// Multi-model AI stream endpoint
// Llama (Groq) as orchestrator/brain, GPT-4o-mini (GitHub) as tool executor

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { AI_TOOLS, ORCHESTRATOR_PROMPT, TOOL_EXECUTOR_PROMPT } from '@/lib/ai/tools';
import {
  handleSearchAutomations,
  handleStartSetup,
  handleAutoSetup,
  handleSearchUserFiles,
  handleListUserFiles,
  handleConfirmFileSelection,
  handleCollectTextInput,
  handleExecuteAutomation,
  handleShowUserAutomations,
  handleSaveBackgroundConfig,
} from '@/lib/ai/tool-handlers';

// Llama client (Groq) - the brain/orchestrator
const orchestratorClient = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// GPT-4o-mini client (GitHub Models) - tool executor
const toolExecutorClient = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

const ORCHESTRATOR_MODEL = "llama-3.3-70b-versatile";
const TOOL_EXECUTOR_MODEL = "openai/gpt-4o-mini";

export async function POST(request) {
  try {
    const authUser = await getSupabaseUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the database user ID (not the auth ID)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', authUser.email)
      .maybeSingle();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Use database user (with correct ID) for all tool handlers
    const user = { id: dbUser.id, email: dbUser.email };

    const body = await request.json();
    const { prompt, messages, temperature = 0.7 } = body;

    const chatMessages = buildChatMessages(messages, prompt);
    if (!chatMessages) {
      return NextResponse.json({ error: "Either 'prompt' or 'messages' is required" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const lastUserMessage = chatMessages.filter(m => m.role === 'user').pop()?.content || '';

    // STEP 1: Ask Llama (the brain) to understand and decide

    const orchestratorMessages = [
      { role: "system", content: ORCHESTRATOR_PROMPT },
      ...chatMessages.filter(m => m.role !== 'system')
    ];

    const orchestratorResponse = await orchestratorClient.chat.completions.create({
      messages: orchestratorMessages,
      model: ORCHESTRATOR_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const llamaOutput = orchestratorResponse.choices[0].message.content;

    let decision;
    try {
      decision = JSON.parse(llamaOutput);
    } catch (e) {
      decision = { response: llamaOutput, action: null };
    }

    const conversationalResponse = decision.response || '';
    const actionNeeded = decision.action;

    // STEP 2: Stream response to user
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First, stream Llama's conversational response
          if (conversationalResponse) {
            // Stream character by character for typewriter effect (or in chunks)
            const chunks = conversationalResponse.match(/.{1,10}/g) || [];
            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
              // Small delay for natural feel (optional, can remove for speed)
            }
          }

          // STEP 3: If action needed, execute it
          if (actionNeeded && actionNeeded.tool) {
            const setupContext = extractSetupContext(chatMessages);

            // Use GPT-4o-mini to generate proper tool arguments
            const toolArgs = await generateToolArguments(
              actionNeeded.tool,
              actionNeeded.hint || '',
              lastUserMessage,
              chatMessages,
              setupContext
            );

            if (toolArgs) {
              // Execute the tool
              await executeToolAction(
                actionNeeded.tool,
                toolArgs,
                user,
                controller,
                encoder,
                setupContext
              );
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: "Sorry, something went wrong. Please try again." })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to process chat request", message: error.message }, { status: 500 });
  }
}

// Use GPT-4o-mini to generate proper tool arguments
async function generateToolArguments(toolName, hint, userMessage, chatMessages, setupContext) {
  try {
    // SHORTCUT: If executing and we have ready-to-execute config, use it directly!
    // This ensures the config doesn't get lost when GPT tries to generate arguments
    if (toolName === 'execute_automation' && setupContext?.readyToExecute && setupContext?.collectedConfig) {
      return {
        automation_id: setupContext.automationId,
        config: setupContext.collectedConfig
      };
    }

    // CRITICAL FIX: If calling auto_setup and we have collected config, pass it directly!
    if (toolName === 'auto_setup' && setupContext?.collectedConfig && Object.keys(setupContext.collectedConfig).length > 0) {
      return {
        automation_id: setupContext.automationId,
        automation_name: setupContext.automationName,
        existing_config: setupContext.collectedConfig  // Pass collected fields directly!
      };
    }

    // Build context for tool executor
    const contextParts = [
      `Tool to call: ${toolName}`,
      `Hint: ${hint}`,
      `User message: ${userMessage}`,
    ];

    if (setupContext) {
      contextParts.push(`Setup context: automation_id="${setupContext.automationId}", automation_name="${setupContext.automationName}"`);
      if (setupContext.collectedConfig && Object.keys(setupContext.collectedConfig).length > 0) {
        contextParts.push(`CRITICAL - Already collected config (MUST include as existing_config): ${JSON.stringify(setupContext.collectedConfig)}`);
      }
    }

    // Extract relevant context from chat history
    const recentContext = chatMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
    contextParts.push(`Recent conversation:\n${recentContext}`);

    const toolExecutorMessages = [
      { role: "system", content: TOOL_EXECUTOR_PROMPT },
      { role: "user", content: contextParts.join('\n\n') }
    ];

    const response = await toolExecutorClient.chat.completions.create({
      messages: toolExecutorMessages,
      model: TOOL_EXECUTOR_MODEL,
      temperature: 0.1,
      tools: AI_TOOLS,
      tool_choice: { type: "function", function: { name: toolName } },
    });

    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (toolCall) {
      return JSON.parse(toolCall.function.arguments);
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Execute the tool action
async function executeToolAction(toolName, args, user, controller, encoder, setupContext) {
  const sendSSE = (data) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  try {
    switch (toolName) {
      case 'search_automations':
        await handleSearchAutomations(args, controller, encoder);
        break;
      case 'start_setup':
        await handleStartSetup(args, user, controller, encoder);
        break;
      case 'auto_setup':
        await handleAutoSetup(args, user, controller, encoder);
        break;
      case 'search_user_files':
        await handleSearchUserFiles(args, user, controller, encoder, setupContext);
        break;
      case 'list_user_files':
        await handleListUserFiles(args, user, controller, encoder, setupContext);
        break;
      case 'confirm_file_selection':
        await handleConfirmFileSelection(args, user, controller, encoder);
        break;
      case 'collect_text_input':
        await handleCollectTextInput(args, user, controller, encoder, setupContext);
        break;
      case 'execute_automation':
        await handleExecuteAutomation(args, user, controller, encoder);
        break;

      case 'show_user_automations':
        await handleShowUserAutomations(args, user, controller, encoder);
        break;

      case 'save_background_config':
        await handleSaveBackgroundConfig(args, user, controller, encoder);
        break;

      default:
        sendSSE({ content: "\n\nI'm not sure how to do that. Could you try again?" });
    }
  } catch (e) {
    sendSSE({ content: "\n\nSorry, something went wrong with that action." });
  }
}

// Build chat messages with system context (but not ORCHESTRATOR_PROMPT - that's added separately)
function buildChatMessages(messages, prompt) {
  if (messages && Array.isArray(messages)) {
    // Keep user's context but we'll add our own system prompt
    return messages;
  } else if (prompt) {
    return [{ role: "user", content: prompt }];
  }
  return null;
}

// Extract setup context from conversation
function extractSetupContext(messages) {
  const allContent = messages.map(m => m.content || '').join('\n');

  console.log('[extractSetupContext] Searching in messages:', allContent.substring(0, 500));

  // Look for automation context
  const automationIdMatch = allContent.match(/automation_id[=:]\s*"?([a-f0-9-]+)"?/i);
  const automationNameMatch = allContent.match(/(?:Setting up |automation_name[=:]\s*)"([^"]+)"/i);

  // PRIORITY 1: Look for READY_TO_RUN marker (has full config ready to execute)
  const readyToRunMatch = allContent.match(/\[READY_TO_RUN automation_id="([^"]+)" config=(\{[\s\S]*?\})\]/);

  console.log('[extractSetupContext] Found READY_TO_RUN:', !!readyToRunMatch);

  if (readyToRunMatch) {
    try {
      const config = JSON.parse(readyToRunMatch[2]);
      console.log('[extractSetupContext] Parsed config:', config);
      return {
        automationId: readyToRunMatch[1],
        automationName: automationNameMatch?.[1] || null,
        collectedConfig: config,
        readyToExecute: true  // Flag that setup is complete
      };
    } catch (e) {
      console.log('[extractSetupContext] Failed to parse config:', e);
    }
  }

  // PRIORITY 2: Look for existing_config (during setup flow)
  const configMatch = allContent.match(/existing_config[=:]\s*(\{[\s\S]*?\})(?=\n|IMPORTANT|$)/);

  const automationId = automationIdMatch?.[1];

  let collectedConfig = {};
  if (configMatch) {
    try {
      collectedConfig = JSON.parse(configMatch[1]);
    } catch (e) { }
  }

  if (automationId) {
    console.log('[extractSetupContext] Found automation_id:', automationId, 'with config keys:', Object.keys(collectedConfig));
    return {
      automationId,
      automationName: automationNameMatch?.[1] || null,
      collectedConfig
    };
  }

  console.log('[extractSetupContext] No context found');
  return null;
}
