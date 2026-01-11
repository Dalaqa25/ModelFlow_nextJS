import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { AI_TOOLS, SYSTEM_PROMPT } from '@/lib/ai/tools';
import {
  handleSearchAutomations,
  handleStartSetup,
  handleSearchUserFiles,
  handleListUserFiles,
  handleCreateGoogleFile,
  handleConfirmFileSelection,
  handleCollectTextInput,
  handleExecuteAutomation
} from '@/lib/ai/tool-handlers';

const client = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

export async function POST(request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, messages, temperature = 0.7 } = body;

    // Build messages array with system prompt
    const chatMessages = buildChatMessages(messages, prompt);
    if (!chatMessages) {
      return NextResponse.json({ error: "Either 'prompt' or 'messages' is required" }, { status: 400 });
    }

    console.log('[AI Stream] Starting request, messages count:', chatMessages.length);

    // Create streaming response
    const response = await client.chat.completions.create({
      messages: chatMessages,
      model: "gpt-4o",
      temperature,
      tools: AI_TOOLS,
      tool_choice: "auto",
      stream: true,
    });

    console.log('[AI Stream] Got response from OpenAI');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const { functionCallData, isFunctionCall } = await streamResponse(response, controller, encoder);

          if (isFunctionCall) {
            await handleToolCall(functionCallData, user, controller, encoder);
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error) {
    console.error('[AI Stream] Error:', error.message, error.status, error.code);
    return NextResponse.json({ error: "Failed to process chat request", message: error.message }, { status: 500 });
  }
}

// Build chat messages with system prompt
function buildChatMessages(messages, prompt) {
  const systemMessage = { role: "system", content: SYSTEM_PROMPT };

  if (messages && Array.isArray(messages)) {
    const hasSystemMessage = messages.some(msg => msg.role === 'system' && msg.content.includes('ModelGrow'));
    return hasSystemMessage ? messages : [systemMessage, ...messages];
  } else if (prompt) {
    return [systemMessage, { role: "user", content: prompt }];
  }
  return null;
}

// Stream the AI response and collect function call data
async function streamResponse(response, controller, encoder) {
  let functionCallData = { name: '', arguments: '' };
  let isFunctionCall = false;

  for await (const chunk of response) {
    const delta = chunk.choices[0]?.delta;
    
    if (delta?.tool_calls) {
      isFunctionCall = true;
      const toolCall = delta.tool_calls[0];
      if (toolCall?.function?.name) functionCallData.name = toolCall.function.name;
      if (toolCall?.function?.arguments) functionCallData.arguments += toolCall.function.arguments;
    }
    
    const content = delta?.content || '';
    if (content) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
    }
  }

  return { functionCallData, isFunctionCall };
}

// Route tool calls to appropriate handlers
async function handleToolCall(functionCallData, user, controller, encoder) {
  try {
    const args = JSON.parse(functionCallData.arguments);

    switch (functionCallData.name) {
      case 'search_automations':
        await handleSearchAutomations(args, controller, encoder);
        break;
      
      case 'start_setup':
        const shouldClose = await handleStartSetup(args, user, controller, encoder);
        if (shouldClose) return;
        break;
      
      case 'search_user_files':
        await handleSearchUserFiles(args, user, controller, encoder);
        break;
      
      case 'list_user_files':
        await handleListUserFiles(args, user, controller, encoder);
        break;
      
      case 'create_google_file':
        await handleCreateGoogleFile(args, user, controller, encoder);
        break;
        break;
      
      case 'confirm_file_selection':
        handleConfirmFileSelection(args, controller, encoder);
        break;
      
      case 'collect_text_input':
        handleCollectTextInput(args, controller, encoder);
        break;
      
      case 'execute_automation':
        await handleExecuteAutomation(args, user, controller, encoder);
        break;
    }
  } catch (e) {
    // JSON parse error or handler error - silently ignore incomplete calls
  }
}
