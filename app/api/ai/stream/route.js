// Multi-model AI stream endpoint.
// The conversational orchestrator is selected with AI_ORCHESTRATOR_PROVIDER.
// Existing deterministic handlers remain authoritative for automation actions.

import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { AI_TOOLS, ORCHESTRATOR_PROMPT, TOOL_EXECUTOR_PROMPT } from '@/lib/ai/tools';
import {
  createClaudeOrchestratorDecision,
  createCodexOrchestratorDecision,
  getOrchestratorProvider,
  shouldFallbackToClaude,
  shouldFallbackToGroq,
} from '@/lib/ai/orchestrator-provider';
import {
  extractAvailableAutomationDiscoveryRequest,
  extractVisibleUserContent,
  isReadyToExecuteConfirmation,
  resolveCatalogTurn,
} from '@/lib/ai/intent-routing';
import { findLatestSetupMarker } from '@/lib/ai/setup-context';
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
  handleRequestFileUpload,
  handleListAutomationFiles,
  handleDeleteAutomationFile,
  handlePreviewAutomationFile,
  handleScheduleAutomation,
} from '@/lib/ai/tool-handlers';

// Multiple Groq API keys for rotation (supports unlimited keys)
const GROQ_API_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7,
  process.env.GROQ_API_KEY_8,
].filter(Boolean); // Remove undefined keys

const ORCHESTRATOR_PROVIDER = getOrchestratorProvider();
const GROQ_ENABLED = ORCHESTRATOR_PROVIDER === 'groq' || shouldFallbackToGroq();
console.log(`[AI] Orchestrator provider: ${ORCHESTRATOR_PROVIDER}`);
console.log(GROQ_ENABLED
  ? `[AI] Groq enabled with ${GROQ_API_KEYS.length} configured key(s)`
  : '[AI] Groq disabled');

let currentKeyIndex = 0;

// Get next API key (round-robin)
function getNextGroqKey() {
  if (GROQ_API_KEYS.length === 0) {
    throw new Error('No Groq API keys configured');
  }
  const key = GROQ_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
  // Using key rotation for rate limit management
  return key;
}

// Create Groq client with current key
function createGroqClient() {
  return new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: getNextGroqKey(),
  });
}

// GPT-4o-mini client (GitHub Models) - tool executor
const toolExecutorClient = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

const ORCHESTRATOR_MODEL = "llama-3.3-70b-versatile";
const TOOL_EXECUTOR_MODEL = "openai/gpt-4o-mini";

export const runtime = 'nodejs';

// buildChatMessages spreads `...msg` and attaches internal fields (visibleContent,
// metadata, id) that intent routing and the Codex path rely on. Groq validates
// message properties strictly and rejects unknown ones with a 400, so strip down
// to the wire schema before sending. Keep this the only place that talks to Groq.
const GROQ_MESSAGE_FIELDS = ['role', 'content', 'name', 'tool_call_id', 'tool_calls'];

function toGroqWireMessages(messages) {
  if (!Array.isArray(messages)) return messages;

  return messages.map((message) => {
    const wire = {};
    for (const field of GROQ_MESSAGE_FIELDS) {
      if (message?.[field] !== undefined) wire[field] = message[field];
    }
    return wire;
  });
}

async function createGroqOrchestratorDecision(orchestratorMessages) {
  if (GROQ_API_KEYS.length === 0) {
    throw new Error('No Groq API keys configured');
  }

  const wireMessages = toGroqWireMessages(orchestratorMessages);

  let retryCount = 0;
  const maxRetries = GROQ_API_KEYS.length;
  while (retryCount < maxRetries) {
    try {
      const orchestratorClient = createGroqClient();
      console.log(`[AI] Using Groq fallback key ${currentKeyIndex}/${GROQ_API_KEYS.length}`);
      const response = await orchestratorClient.chat.completions.create({
        messages: wireMessages,
        model: ORCHESTRATOR_MODEL,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });
      const output = response.choices[0].message.content;
      try {
        return JSON.parse(output);
      } catch {
        return { response: output, action: null };
      }
    } catch (error) {
      retryCount += 1;
      if (error.status !== 429 || retryCount >= maxRetries) throw error;
      console.warn(`[AI] Groq rate limit hit; trying fallback key ${retryCount + 1}/${maxRetries}`);
    }
  }

  throw new Error('No AI orchestrator produced a decision');
}

export async function POST(request) {
  try {
    let authUser = await getSupabaseUser();

    // Fallback: check Authorization header (for API-level testing)
    if (!authUser) {
      const { getAuthenticatedUser } = await import('@/lib/db/supabase-server');
      authUser = await getAuthenticatedUser(request);
    }

    // Optional: Database user
    let user = null;
    if (authUser) {
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

      if (dbUser) {
        user = { id: dbUser.id, email: dbUser.email };
      }
    }

    const body = await request.json();
    const {
      prompt,
      messages,
      temperature = 0.7,
      frontendSetupState,
      conversationId,
      codexSessionId,
    } = body;

    const chatMessages = buildChatMessages(messages, prompt);
    if (!chatMessages) {
      return NextResponse.json({ error: "Either 'prompt' or 'messages' is required" }, { status: 400 });
    }
    
    const encoder = new TextEncoder();
    const lastUserTurn = chatMessages.filter(m => m.role === 'user').pop();
    const lastUserMessage = lastUserTurn?.content || '';
    const visibleLastUserMessage = lastUserTurn?.visibleContent ?? extractVisibleUserContent(lastUserMessage);
    const visibleChatMessages = chatMessages.map(message => ({
      ...message,
      content: ['user', 'assistant'].includes(message.role)
        ? (message.visibleContent ?? extractVisibleUserContent(message.content))
        : message.content,
    }));
    const connectionCompleted = extractActivepiecesConnectionCompleted(lastUserMessage);
    const catalogTurn = resolveCatalogTurn(lastUserMessage, chatMessages);
    const directSetup = extractSelectedAutomationContext(lastUserMessage)
      || (catalogTurn.type === 'selection' ? catalogTurn.selection : null);
    const ambiguousCatalogConfirmation = catalogTurn.type === 'clarification'
      ? catalogTurn.entries
      : null;
    const configSubmission = mergeConfigSubmissions(
      extractConfigFormSubmission(lastUserMessage),
      extractFrontendConfigSubmission(lastUserMessage, frontendSetupState)
    );

    // A config submission can carry the earlier catalog context that originally
    // selected this automation. Never let that stale selection restart setup;
    // the newly submitted form is the authoritative action for this turn.
    if ((connectionCompleted || directSetup) && !configSubmission) {
      const setupRequest = connectionCompleted || directSetup;
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await executeToolAction(
              'start_setup',
              {
                automation_id: setupRequest.automationId,
                automation_name: setupRequest.automationName,
                hint: connectionCompleted
                  ? `User just connected ${connectionCompleted.provider || 'a required app'} through ModelGrow. Resume setup for this exact selected automation and show the next required setup widget if fields remain.`
                  : 'User clicked Use automation in the marketplace. Start setup for this exact selected automation.',
              },
              user,
              controller,
              encoder,
              null,
              chatMessages
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[Direct setup] Error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: 'Sorry, I could not start setup for that automation. Please try again.' })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    }

    if (ambiguousCatalogConfirmation && !configSubmission) {
      const optionText = ambiguousCatalogConfirmation
        .map((entry, index) => `${index + 1}. ${entry.automationName}`)
        .join('\n');
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            content: `Which one should I set up?\n\n${optionText}\n\nReply with the number or name.`,
          })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'X-ModelGrow-Path': 'catalog-clarification',
        },
      });
    }

    if (configSubmission) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await executeToolAction(
              'auto_setup',
              {
                automation_id: configSubmission.automationId,
                automation_name: configSubmission.automationName,
                existing_config: configSubmission.config,
              },
              user,
              controller,
              encoder,
              {
                automationId: configSubmission.automationId,
                automationName: configSubmission.automationName,
                collectedConfig: configSubmission.config,
                missingFields: [],
              },
              chatMessages
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[Direct config submission] Error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: 'Sorry, I could not finish configuring this automation. Please try again.' })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    }

    const initialSetupContext = extractSetupContext(chatMessages);

    // A confirmation after READY_TO_RUN is an application state transition,
    // not an open-ended language decision. Execute it deterministically so an
    // orchestrator cannot accidentally route "run it" to an unrelated tool.
    if (initialSetupContext?.readyToExecute && isReadyToExecuteConfirmation(lastUserMessage)) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            if (!user) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: 'Please sign in first so I can run this automation.' })}\n\n`));
            } else {
              await executeToolAction(
                'execute_automation',
                {
                  automation_id: initialSetupContext.automationId,
                  config: initialSetupContext.collectedConfig || {},
                },
                user,
                controller,
                encoder,
                initialSetupContext,
                chatMessages
              );
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[Direct ready-to-run execution] Error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: 'Sorry, I could not run this automation. Please try again.' })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'X-ModelGrow-Path': 'ready-to-run',
        },
      });
    }

    const availableAutomationDiscoveryRequest = !frontendSetupState?.automationId && !initialSetupContext?.automationId
      ? extractAvailableAutomationDiscoveryRequest(visibleLastUserMessage, visibleChatMessages)
      : null;

    // Catalog discovery is deterministic. Do not ask the model to distinguish
    // "what automations do you have?" from "what automations do I have?".
    if (availableAutomationDiscoveryRequest) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await executeToolAction(
              'search_automations',
              {
                query: visibleLastUserMessage,
                browse_all: availableAutomationDiscoveryRequest.browseAll,
              },
              user,
              controller,
              encoder,
              null,
              chatMessages
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[Direct automation discovery] Error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: 'Sorry, I could not load the available automations right now. Please try again.' })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-ModelGrow-Path': 'automation-catalog',
        },
      });
    }

    const userAutomationStatusRequest = extractUserAutomationStatusRequest(visibleLastUserMessage);
    if (userAutomationStatusRequest) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            if (!user) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: 'Please sign in first so I can check your automations.' })}\n\n`));
            } else {
              await executeToolAction(
                'show_user_automations',
                { status_filter: userAutomationStatusRequest.statusFilter },
                user,
                controller,
                encoder,
                null,
                chatMessages
              );
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('[Direct user automations status] Error:', error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: 'Sorry, I could not check your automations right now. Please try again.' })}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    }

    const instantResponse = !frontendSetupState?.automationId && !initialSetupContext?.automationId
      ? getInstantConversationalResponse(visibleLastUserMessage)
      : null;

    // Do not spend a full agent turn on greetings and tiny acknowledgements that
    // cannot require a tool or change automation state.
    if (instantResponse) {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: instantResponse })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-ModelGrow-Path': 'instant',
        },
      });
    }

    // STEP 1: Ask the selected orchestrator to understand and decide.

    let currentPrompt = ORCHESTRATOR_PROMPT;
    if (!user) {
      currentPrompt += "\n\nCRITICAL CONTEXT: The user is currently NOT signed in (Guest Mode). They can chat with you and explore automations, but to ACTUALLY RUN or configure anything, they will need to create an account. If they ask to run something, enthusiastically guide them to it but mention they'll just need to quickly sign in when they click to start.";
    }

    const orchestratorMessages = [
      { role: "system", content: currentPrompt },
      ...visibleChatMessages.filter(m => m.role !== 'system')
    ];

    const provider = getOrchestratorProvider();
    const canStreamCodexEarly = !frontendSetupState?.automationId && !initialSetupContext?.automationId;

    // STEP 2: Start the browser stream before the orchestrator finishes. Codex app-server
    // deltas are forwarded immediately for ordinary chat; setup turns remain buffered so
    // deterministic setup guards can validate the action before anything is shown.
    const stream = new ReadableStream({
      async start(controller) {
        let streamedResponse = '';
        let thinking = true;
        let streamClosed = false;
        const enqueue = (payload) => {
          if (streamClosed) return false;
          try {
            controller.enqueue(encoder.encode(payload));
            return true;
          } catch (error) {
            streamClosed = true;
            console.warn('[AI Stream] Browser connection closed while a response was being generated:', error.message);
            return false;
          }
        };
        const close = () => {
          if (streamClosed) return;
          streamClosed = true;
          try {
            controller.close();
          } catch (_) {
            // The browser may have already closed the response.
          }
        };

        // Codex can spend several seconds deciding which deterministic ModelGrow
        // action to call. Keep the SSE connection active during that quiet period
        // so browsers and development proxies do not interpret it as a dead request.
        const keepAlive = setInterval(() => {
          enqueue(`: keep-alive ${Date.now()}\n\n`);
        }, 2_500);

        enqueue(`data: ${JSON.stringify({ type: 'thinking', status: 'start' })}\n\n`);

        const finishThinking = () => {
          if (!thinking) return;
          thinking = false;
          enqueue(`data: ${JSON.stringify({ type: 'thinking', status: 'end' })}\n\n`);
        };
        const emitContent = content => {
          if (!content) return;
          finishThinking();
          enqueue(`data: ${JSON.stringify({ content })}\n\n`);
        };

        try {
          let decision;

          // Hoisted out of the Codex branch so every orchestrator sees the same
          // state. When this only existed inside the Codex branch, a fallback
          // run had no idea a catalog had just been offered and treated
          // "tell me about the first one" as a fresh keyword search.
          const modelStateContext = mergeOrchestratorSetupContext(initialSetupContext, frontendSetupState)
            || (
              catalogTurn.entries.length > 0
                ? {
                    catalogOptions: catalogTurn.entries,
                    catalogFocus: catalogTurn.focus?.automationName || null,
                  }
                : null
            );

          if (provider === 'codex') {
            try {
              decision = await createCodexOrchestratorDecision({
                messages: visibleChatMessages,
                isAuthenticated: Boolean(user),
                setupContext: modelStateContext,
                sessionKey: (authUser?.id || user?.id)
                  && typeof (codexSessionId || conversationId) === 'string'
                  && (codexSessionId || conversationId).length > 0
                  && (codexSessionId || conversationId).length <= 128
                  ? `${authUser?.id || user?.id}:${codexSessionId || conversationId}`
                  : null,
                onResponseDelta: delta => {
                  if (!canStreamCodexEarly) return;
                  streamedResponse += delta;
                  emitContent(delta);
                },
              });
            } catch (error) {
              console.error('[AI] Codex orchestrator failed:', error.message);
              if (!shouldFallbackToClaude() && !shouldFallbackToGroq()) throw error;
            }
          }

          // Claude Code headless: the primary orchestrator when selected, and
          // otherwise a tier between Codex and Groq. Groq's smaller model is a
          // noticeably weaker router, so prefer Claude before dropping to it.
          if (!decision && (provider === 'claude' || shouldFallbackToClaude())) {
            if (provider !== 'claude') console.warn('[AI] Falling back to Claude for this request');
            try {
              decision = await createClaudeOrchestratorDecision({
                messages: visibleChatMessages,
                isAuthenticated: Boolean(user),
                setupContext: modelStateContext,
              });
            } catch (error) {
              console.error('[AI] Claude orchestrator failed:', error.message);
              if (!shouldFallbackToGroq()) throw error;
            }
          }

          if (!decision) {
            console.warn('[AI] Falling back to Groq for this request');
            decision = await createGroqOrchestratorDecision(orchestratorMessages);
          }

          let conversationalResponse = decision.response || '';
          let actionNeeded = decision.action;

          if (actionNeeded?.tool === 'request_file_upload') {
            const setupContext = initialSetupContext || {};
            const missingFields = frontendSetupState?.missingFields || setupContext.missingFields || [];
            const explicitFileField = missingFields.find(field => /file|upload|video|image|document/i.test(
              typeof field === 'string' ? field : field?.name || ''
            ));
            if (!explicitFileField) {
              console.warn('[AI] Blocked hallucinated file upload: no explicit customer-owned file field is missing.');
              actionNeeded = null;
              conversationalResponse = 'No upload is required by the current setup. Files supplied by the automation trigger should not be uploaded manually.';
            }
          }

          // GUARD: If we're in an active setup and the AI called search_automations,
          // redirect to collect_text_input — the user is answering setup questions, not searching.
          if (actionNeeded?.tool === 'search_automations') {
            const activeSetupId = initialSetupContext?.automationId || frontendSetupState?.automationId;
            if (activeSetupId) {
              console.log('[AI] Intercepted search_automations during active setup — redirecting to collect_text_input');
              actionNeeded = { tool: 'collect_text_input', hint: 'user provided setup data during active setup' };
            }
          }

          // start_setup requires an authoritative automation UUID. A model may infer
          // that a named catalog item was selected, but a name alone is not safe to
          // execute. Search first so the deterministic catalog handler can return the
          // real automation record and the user can select that exact result.
          if (actionNeeded?.tool === 'start_setup') {
            const selectedAutomationId = initialSetupContext?.automationId || frontendSetupState?.automationId;
            if (!selectedAutomationId) {
              console.log('[AI] Intercepted start_setup without an automation id — resolving through catalog search');
              actionNeeded = {
                tool: 'search_automations',
                hint: actionNeeded.hint || 'resolve the named automation from the published catalog',
              };
            }
          }

          // GUARD: If we're in an active setup with missing fields and the AI did NOT
          // call collect_text_input, force it so the user's answer is actually saved.
          if (!actionNeeded || !actionNeeded.tool) {
            const activeSetupId = initialSetupContext?.automationId || frontendSetupState?.automationId;
            const missingFields = frontendSetupState?.missingFields || initialSetupContext?.missingFields || [];

            if (activeSetupId && missingFields.length > 0) {
              const msg = visibleLastUserMessage;
              const isQuestion = msg.endsWith('?') || /^(what|how|why|when|where|who|which|can|do|does|is|are|will|should)\b/i.test(msg);
              const isFiller = /^(yes|no|ok|sure|hi|hello|hey|thanks|thank you|cool|great|perfect|nice|sounds good|go ahead)$/i.test(msg);

              if (!isQuestion && !isFiller && msg.length > 0) {
                console.log(`[AI] SAFETY NET: AI returned action=null during active setup with missing fields [${missingFields.join(', ')}]. Forcing collect_text_input.`);
                actionNeeded = {
                  tool: 'collect_text_input',
                  hint: `user provided data for setup field. Missing fields: ${missingFields.join(', ')}`
                };
              }
            }
          }

          // First, stream the orchestrator's conversational response.
          // SKIP orchestrator text when collect_text_input is the action —
          // the handler already generates "Got it!" so streaming both causes a
          // doubled acknowledgment ("Got it! Got it! I just need one more thing...")
          if (conversationalResponse && actionNeeded?.tool !== 'collect_text_input') {
            let remainingResponse = conversationalResponse;
            if (streamedResponse && conversationalResponse.startsWith(streamedResponse)) {
              remainingResponse = conversationalResponse.slice(streamedResponse.length);
            } else if (streamedResponse) {
              console.warn('[AI] Final Codex response differed from its streamed prefix; suppressing duplicate final text.');
              remainingResponse = '';
            }
            const chunks = remainingResponse.match(/[\s\S]{1,10}/g) || [];
            for (const chunk of chunks) {
              emitContent(chunk);
            }
          }

          // STEP 3: If action needed, execute it
          if (actionNeeded && actionNeeded.tool) {
            finishThinking();
            let setupContext = initialSetupContext || {};

            // CRITICAL FIX: Merge explicit frontend state into the context
            // This prevents lost fields from regex parsing failures
            if (frontendSetupState && frontendSetupState.automationId) {
              setupContext.automationId = frontendSetupState.automationId;
              setupContext.automationName = frontendSetupState.automationName || setupContext.automationName;
              
              // Frontend collectedConfig is the most reliable source — always prefer it
              if (frontendSetupState.collectedConfig && Object.keys(frontendSetupState.collectedConfig).length > 0) {
                setupContext.collectedConfig = {
                  ...setupContext.collectedConfig,           // regex-parsed (less reliable)
                  ...frontendSetupState.collectedConfig      // frontend state (most reliable, wins)
                };
              }
              if (frontendSetupState.isReadyToExecute) {
                setupContext.readyToExecute = true;
                if (frontendSetupState.readyConfig) {
                  setupContext.collectedConfig = frontendSetupState.readyConfig;
                }
              }
              // Pass missing fields so collect_text_input shortcut knows what to collect
              if (frontendSetupState.missingFields) {
                setupContext.missingFields = frontendSetupState.missingFields;
              }
            }
            
            // If setupContext is empty, make it null to match original behavior
            if (Object.keys(setupContext).length === 0) {
              setupContext = null;
            }

            // Use GPT-4o-mini to generate proper tool arguments
            const toolArgs = await generateToolArguments(
              actionNeeded.tool,
              actionNeeded.hint || '',
              visibleLastUserMessage,
              visibleChatMessages,
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
                setupContext,
                chatMessages
              );
            }
          }

          finishThinking();
          enqueue('data: [DONE]\n\n');
          close();
        } catch (error) {
          console.error('[AI Stream] Failed while generating or executing a response:', error);
          finishThinking();
          enqueue(`data: ${JSON.stringify({ content: "Sorry, something went wrong. Please try again." })}\n\n`);
          enqueue('data: [DONE]\n\n');
          close();
        } finally {
          clearInterval(keepAlive);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    console.error('[POST /api/ai/stream] Error:', error);
    console.error('[POST /api/ai/stream] Stack:', error.stack);
    return NextResponse.json({ error: "Failed to process chat request", message: error.message }, { status: 500 });
  }
}

// Use GPT-4o-mini to generate proper tool arguments
async function generateToolArguments(toolName, hint, userMessage, chatMessages, setupContext) {
  try {
    const localFallback = buildLocalToolArgumentFallback({ toolName, userMessage, setupContext });
    if (localFallback) {
      return localFallback;
    }

    if (toolName === 'request_file_upload' && setupContext?.automationId) {
      const missingFields = setupContext.missingFields || [];
      const field = missingFields.find(candidate => /file|upload|video|image|document/i.test(
        typeof candidate === 'string' ? candidate : candidate?.name || ''
      ));
      const fieldName = typeof field === 'string' ? field : field?.name;
      if (!fieldName) return null;
      const normalized = fieldName.toLowerCase();
      const fileType = normalized.includes('video')
        ? 'video'
        : normalized.includes('image')
          ? 'image'
          : normalized.includes('document') || normalized.includes('pdf')
            ? 'document'
            : 'any';
      return {
        file_type: fileType,
        field_name: fieldName,
        automation_id: setupContext.automationId,
        automation_name: setupContext.automationName || 'Automation',
      };
    }

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

    // SHORTCUT: If saving background config and we have the context, use it directly!
    if (toolName === 'save_background_config' && setupContext?.isBackgroundPrompt && setupContext?.collectedConfig) {
      return {
        automation_id: setupContext.automationId,
        config: setupContext.collectedConfig
      };
    }

    // SHORTCUT: For collect_text_input, the value is ALWAYS the user's last message.
    // Never let GPT-4o-mini guess this — it consistently picks the wrong value.
    if (toolName === 'collect_text_input' && setupContext?.automationId) {
      const hintUpper = (hint || '').toUpperCase();
      const missingFields = (setupContext?.missingFields || [])
        .map(f => (typeof f === 'string' ? f : f.name || f).toUpperCase());

      // Try to get field name from hint (case-insensitive match against known field names)
      let fieldName = null;
      if (missingFields.length > 0) {
        // Check if hint mentions any of the missing fields
        for (const mf of missingFields) {
          if (hintUpper.includes(mf) || hintUpper.includes(mf.replace(/_/g, ' '))) {
            fieldName = mf;
            break;
          }
        }
      }

      // Fall back to first missing field
      if (!fieldName && missingFields.length > 0) {
        fieldName = missingFields[0];
      }

      if (fieldName) {
        console.log(`[AI] collect_text_input SHORTCUT: field=${fieldName}, value="${userMessage}"`);
        return {
          field_name: fieldName,
          value: userMessage,
          automation_id: setupContext.automationId,
          automation_name: setupContext.automationName,
          existing_config: setupContext.collectedConfig || {}
        };
      }
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
      const args = JSON.parse(toolCall.function.arguments);
      
      // CRITICAL OVERRIDE: GPT often forgets to include existing_config in the tool call
      // We must forcefully inject our known truth here so memory is never lost!
      if ((toolName === 'collect_text_input' || toolName === 'auto_setup') && setupContext?.collectedConfig && Object.keys(setupContext.collectedConfig).length > 0) {
        const fieldKey = toolName === 'collect_text_input' ? 'existing_config' : 'existing_config';
        args[fieldKey] = {
          ...(args[fieldKey] || {}),
          ...setupContext.collectedConfig  // frontend state always wins
        };
        console.log(`[AI] Force-injected existing_config into ${toolName} args:`, Object.keys(args[fieldKey]));
      }
      
      return args;
    }
    return null;
  } catch (e) {
    console.error("[AI] Failed to generate tool arguments:", e);
    const localFallback = buildLocalToolArgumentFallback({ toolName, userMessage, setupContext });
    if (localFallback) {
      console.warn(`[AI] Using local tool argument fallback for ${toolName}`);
      return localFallback;
    }
    return null;
  }
}

function buildLocalToolArgumentFallback({ toolName, userMessage, setupContext }) {
  if (toolName === 'show_user_automations') {
    return {
      status_filter: extractUserAutomationStatusRequest(userMessage)?.statusFilter || 'all',
    };
  }

  if (toolName === 'search_automations' && typeof userMessage === 'string' && userMessage.trim()) {
    return {
      query: userMessage.trim(),
    };
  }

  if (toolName === 'start_setup' && setupContext?.automationId) {
    return {
      automation_id: setupContext.automationId,
      automation_name: setupContext.automationName || 'Automation',
    };
  }

  return null;
}

// Execute the tool action
async function executeToolAction(toolName, args, user, controller, encoder, setupContext, chatMessages) {
  // Capture all tool output for conversation history
  let toolOutputText = '';

  // Create a wrapper controller that captures output
  const capturingController = {
    enqueue: (chunk) => {
      // Decode the chunk to extract text
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(chunk);

        // Extract content from SSE format: "data: {...}\n\n"
        if (text.startsWith('data: ')) {
          const jsonStr = text.slice(6).trim();
          if (jsonStr && jsonStr !== '[DONE]') {
            const parsed = JSON.parse(jsonStr);
            if (parsed.content && typeof parsed.content === 'string') {
              toolOutputText += parsed.content;
            }
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }

      // Pass through to real controller
      controller.enqueue(chunk);
    }
  };

  try {
    switch (toolName) {
      case 'search_automations':
        await handleSearchAutomations(args, capturingController, encoder);
        break;
      case 'start_setup':
        // Only inject USER messages so the scan doesn't match words in AI responses
        args.conversation_history = chatMessages
          .filter(m => m.role === 'user')
          .map(m => m.content || '')
          .join('\n');
        await handleStartSetup(args, user, capturingController, encoder);
        break;
      case 'auto_setup':
        // Pass conversation history so tool can check for file uploads
        const autoSetupContext = {
          ...setupContext,
          conversationHistory: chatMessages ? chatMessages.map(m => m.content) : []
        };
        await handleAutoSetup(args, user, capturingController, encoder, autoSetupContext);
        break;
      case 'search_user_files':
        await handleSearchUserFiles(args, user, capturingController, encoder, setupContext);
        break;
      case 'list_user_files':
        await handleListUserFiles(args, user, capturingController, encoder, setupContext);
        break;
      case 'confirm_file_selection':
        await handleConfirmFileSelection(args, user, capturingController, encoder);
        break;
      case 'collect_text_input':
        await handleCollectTextInput(args, user, capturingController, encoder, setupContext);
        break;
      case 'execute_automation':
        await handleExecuteAutomation(args, user, capturingController, encoder);
        break;

      case 'show_user_automations':
        await handleShowUserAutomations(args, user, capturingController, encoder);
        break;

      case 'save_background_config':
        await handleSaveBackgroundConfig(args, user, capturingController, encoder);
        break;

      case 'request_file_upload':
        await handleRequestFileUpload(args, user, capturingController, encoder);
        break;

      case 'list_automation_files':
        await handleListAutomationFiles(args, user, capturingController, encoder, setupContext);
        break;

      case 'delete_automation_file':
        await handleDeleteAutomationFile(args, user, capturingController, encoder);
        break;

      case 'preview_automation_file':
        await handlePreviewAutomationFile(args, user, capturingController, encoder);
        break;

      case 'schedule_automation':
        await handleScheduleAutomation(args, setupContext, user, capturingController, encoder);
        break;

      default:
        const sendSSE = (data) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        sendSSE({ content: "\n\nI'm not sure how to do that. Could you try again?" });
    }

    // Send captured tool output as a special event for frontend to save
    if (toolOutputText.trim()) {
      console.log('[executeToolAction] Captured tool output:', toolOutputText.substring(0, 200));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'tool_output',
        content: toolOutputText,
        tool: toolName
      })}\n\n`));
    } else {
      console.log('[executeToolAction] No tool output captured for:', toolName);
    }
  } catch (e) {
    console.error('[executeToolAction] Error:', e);
    const sendSSE = (data) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    sendSSE({ content: "\n\nSorry, something went wrong with that action." });
  }
}

// Build chat messages with system context (but not ORCHESTRATOR_PROMPT - that's added separately)
function buildChatMessages(messages, prompt) {
  if (messages && Array.isArray(messages)) {
    // Keep a strict boundary between user-authored text and private application
    // state. Deterministic setup parsers consume `content`; intent routing and
    // conversational models consume `visibleContent`.
    return messages.map(msg => {
      if (msg.metadata && msg.metadata.hiddenContext) {
        return {
          ...msg,
          visibleContent: msg.content,
          content: msg.content + '\n' + msg.metadata.hiddenContext
        };
      }
      return {
        ...msg,
        visibleContent: msg.content,
      };
    });
  } else if (prompt) {
    return [{ role: "user", content: prompt, visibleContent: prompt }];
  }
  return null;
}

function extractSelectedAutomationContext(content) {
  if (!content) return null;

  const idMatch = content.match(/\[Selected automation UUID:\s*([A-Za-z0-9_-]{8,})\]/i);

  if (!idMatch) return null;

  const nameMatch =
    content.match(/automation_name[=:]\s*"([^"]+)"/i) ||
    content.match(/set up the "([^"]+)" automation/i) ||
    content.match(/use "([^"]+)"/i);

  return {
    automationId: idMatch[1],
    automationName: nameMatch?.[1] || 'Selected automation',
  };
}

function extractActivepiecesConnectionCompleted(content) {
  if (!content) return null;

  const marker = content.match(
    /\[ACTIVEPIECES_CONNECTION_COMPLETED\s+automation_id="([^"]+)",\s*automation_name="([^"]*)",\s*provider="([^"]*)"\]/i
  );
  if (!marker) return null;

  return {
    automationId: marker[1],
    automationName: marker[2] || 'Selected automation',
    provider: marker[3] || '',
  };
}

function extractConfigFormSubmission(content) {
  if (!content) return null;
  const marker = content.match(/\[CONFIG_FORM_SUBMITTED\s+automation_id="([^"]+)",\s*automation_name="([^"]+)"\]/i);
  if (!marker) return null;

  const configStart = content.lastIndexOf('existing_config=');
  if (configStart < 0) return null;

  const objectStart = content.indexOf('{', configStart);
  if (objectStart < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  let objectEnd = -1;
  for (let index = objectStart; index < content.length; index += 1) {
    const character = content[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (character === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        objectEnd = index + 1;
        break;
      }
    }
  }
  if (objectEnd < 0) return null;

  try {
    return {
      automationId: marker[1],
      automationName: marker[2],
      config: JSON.parse(content.slice(objectStart, objectEnd)),
    };
  } catch (_) {
    return null;
  }
}

function extractFrontendConfigSubmission(lastUserMessage, frontendSetupState) {
  if (!frontendSetupState || typeof frontendSetupState !== 'object') return null;
  if (!/filled\s+the\s+setup\s+details|continue\s+setup/i.test(lastUserMessage || '')) return null;

  const collectedConfig = frontendSetupState.collectedConfig || frontendSetupState.collectedFields || {};
  if (!collectedConfig || typeof collectedConfig !== 'object' || Object.keys(collectedConfig).length === 0) {
    return null;
  }

  const automationId = frontendSetupState.automationId;
  if (!automationId || String(automationId) === 'undefined') return null;

  return {
    automationId,
    automationName: frontendSetupState.automationName || 'Selected automation',
    config: collectedConfig,
  };
}

function mergeConfigSubmissions(parsedSubmission, frontendSubmission) {
  if (!parsedSubmission) return frontendSubmission;
  if (!frontendSubmission) return parsedSubmission;

  return {
    automationId: parsedSubmission.automationId || frontendSubmission.automationId,
    automationName: parsedSubmission.automationName || frontendSubmission.automationName,
    config: {
      ...(parsedSubmission.config || {}),
      ...(frontendSubmission.config || {}),
    },
  };
}

function mergeOrchestratorSetupContext(parsedContext, frontendState) {
  const parsed = parsedContext && typeof parsedContext === 'object' ? parsedContext : {};
  const frontend = frontendState && typeof frontendState === 'object' ? frontendState : {};
  const collectedConfig = {
    ...(parsed.collectedConfig || {}),
    ...(frontend.collectedConfig || {}),
    ...(frontend.collectedFields || {}),
  };
  const missingFields = frontend.missingFields || parsed.missingFields || [];

  if (!parsed.automationId && !frontend.automationId) return null;

  return {
    automationId: frontend.automationId || parsed.automationId || null,
    automationName: frontend.automationName || parsed.automationName || null,
    collectedConfig,
    missingFields,
    readyToExecute: Boolean(
      frontend.isReadyToExecute ||
      parsed.readyToExecute ||
      (frontend.readyConfig && Object.keys(frontend.readyConfig).length > 0)
    ),
    isBackgroundPrompt: Boolean(parsed.isBackgroundPrompt || frontend.isBackgroundPrompt),
  };
}

function extractUserAutomationStatusRequest(content) {
  if (!content || typeof content !== 'string') return null;

  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return null;

  const tokens = normalized.split(' ').filter(Boolean);
  const mentionsAutomation = hasSimilarKeyword(tokens, ['automation', 'automations', 'workflow', 'workflows']);
  const asksToInspect = hasSimilarKeyword(tokens, ['show', 'list', 'check', 'view', 'what', 'which', 'tell']);
  const mentionsOwnership =
    hasSimilarKeyword(tokens, ['my', 'mine']) ||
    normalized.includes("i'm") ||
    normalized.includes('i am') ||
    normalized.includes('i have');
  const mentionsRunState = hasSimilarKeyword(tokens, [
    'running',
    'active',
    'paused',
    'status',
    'enabled',
    'disabled',
    'inactive',
    'currently',
    'current',
    'existing',
    'already',
  ]);

  if (!mentionsAutomation) return null;
  if (!mentionsRunState && !(mentionsOwnership && asksToInspect)) return null;

  let statusFilter = 'all';
  const wantsActive = hasSimilarKeyword(tokens, ['active', 'running', 'enabled', 'currently', 'current']);
  const wantsPaused = hasSimilarKeyword(tokens, ['paused', 'disabled', 'inactive']);
  if (wantsActive && !wantsPaused) {
    statusFilter = 'active';
  } else if (wantsPaused && !wantsActive) {
    statusFilter = 'paused';
  }

  return { statusFilter };
}

function getInstantConversationalResponse(content) {
  if (!content || typeof content !== 'string') return null;

  const normalized = content
    .toLowerCase()
    .replace(/[.!?,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (/^(hi|hello|hey|hey there|hi there|yo|sup|good morning|good afternoon|good evening)$/.test(normalized)) {
    return "Hey! Tell me what you'd like to automate, and I'll find an available workflow for you.";
  }

  if (/^(thanks|thank you|thank you very much|thx)$/.test(normalized)) {
    return "You're welcome! What would you like to do next?";
  }

  if (/^(bye|goodbye|see you|see you later)$/.test(normalized)) {
    return 'See you soon!';
  }

  if (/^(ok|okay|okey|got it|sounds good)$/.test(normalized)) {
    return 'Got it. What would you like to do next?';
  }

  return null;
}

function hasSimilarKeyword(tokens, keywords) {
  return tokens.some((token) => keywords.some((keyword) => tokenLooksLikeKeyword(token, keyword)));
}

function tokenLooksLikeKeyword(token, keyword) {
  if (!token || !keyword) return false;
  if (token === keyword) return true;

  const trimmedToken = token.replace(/^'+|'+$/g, '');
  if (trimmedToken === keyword) return true;

  const sharedPrefixLength = Math.min(trimmedToken.length, keyword.length, 4);
  if (sharedPrefixLength >= 3 && trimmedToken.slice(0, sharedPrefixLength) === keyword.slice(0, sharedPrefixLength)) {
    const lengthDelta = Math.abs(trimmedToken.length - keyword.length);
    if (lengthDelta <= 2) return true;
  }

  if (Math.abs(trimmedToken.length - keyword.length) > 2) return false;
  return getLevenshteinDistance(trimmedToken, keyword, 2) <= 2;
}

function getLevenshteinDistance(source, target, maxDistance) {
  if (source === target) return 0;
  if (!source.length) return target.length;
  if (!target.length) return source.length;
  if (Math.abs(source.length - target.length) > maxDistance) return maxDistance + 1;

  let previous = Array.from({ length: target.length + 1 }, (_, index) => index);

  for (let row = 0; row < source.length; row += 1) {
    const current = [row + 1];
    let smallest = current[0];

    for (let column = 0; column < target.length; column += 1) {
      const cost = source[row] === target[column] ? 0 : 1;
      const value = Math.min(
        previous[column + 1] + 1,
        current[column] + 1,
        previous[column] + cost
      );
      current.push(value);
      if (value < smallest) smallest = value;
    }

    if (smallest > maxDistance) return maxDistance + 1;
    previous = current;
  }

  return previous[target.length];
}

// Extract setup context from conversation
function extractSetupContext(messages) {
  const allContent = messages.map(m => (m.content || '') + (m.metadata?.hiddenContext || '')).join('\n');

  console.log('[extractSetupContext] Searching in messages:', allContent.substring(0, 500));

  // Look for automation context
  const automationIdMatch = allContent.match(/automation_id[=:]\s*"?([a-f0-9-]+)"?/i);
  const automationNameMatch = allContent.match(/(?:Setting up |automation_name[=:]\s*)"([^"]+)"/i);

  // PRIORITY 1: Look for BACKGROUND_PROMPT marker (user is being asked about background execution)
  const backgroundPromptMatch = findLatestSetupMarker(allContent, 'BACKGROUND_PROMPT');

  console.log('[extractSetupContext] Found BACKGROUND_PROMPT:', !!backgroundPromptMatch);

  if (backgroundPromptMatch) {
    try {
      const config = backgroundPromptMatch.config;
      console.log('[extractSetupContext] Background prompt config:', config);
      return {
        automationId: backgroundPromptMatch.automationId,
        automationName: automationNameMatch?.[1] || null,
        collectedConfig: config,
        isBackgroundPrompt: true  // Flag that we're in background activation flow
      };
    } catch (e) {
      console.log('[extractSetupContext] Failed to parse background config:', e);
    }
  }

  // PRIORITY 2: Look for READY_TO_RUN marker (has full config ready to execute)
  const readyToRunMatch = findLatestSetupMarker(allContent, 'READY_TO_RUN');

  console.log('[extractSetupContext] Found READY_TO_RUN:', !!readyToRunMatch);

  if (readyToRunMatch) {
    try {
      const config = readyToRunMatch.config;
      console.log('[extractSetupContext] Parsed config:', config);
      return {
        automationId: readyToRunMatch.automationId,
        automationName: automationNameMatch?.[1] || null,
        collectedConfig: config,
        readyToExecute: true  // Flag that setup is complete
      };
    } catch (e) {
      console.log('[extractSetupContext] Failed to parse config:', e);
    }
  }

  // PRIORITY 3: Look for existing_config (during setup flow)
  // Use matchAll to find ALL occurrences and take the LAST one (most recent state)
  // Use a more robust extraction that handles nested JSON
  const configMatches = [];
  const configSearchRegex = /existing_config[=:]\s*(\{)/g;
  let configSearchMatch;
  while ((configSearchMatch = configSearchRegex.exec(allContent)) !== null) {
    // Walk forward to find the matching closing brace
    let depth = 1;
    let i = configSearchMatch.index + configSearchMatch[0].length;
    while (i < allContent.length && depth > 0) {
      if (allContent[i] === '{') depth++;
      else if (allContent[i] === '}') depth--;
      i++;
    }
    if (depth === 0) {
      configMatches.push(allContent.slice(configSearchMatch.index + configSearchMatch[0].length - 1, i));
    }
  }
  const configMatch = configMatches.length > 0 ? configMatches[configMatches.length - 1] : null;

  const automationId = automationIdMatch?.[1];

  let collectedConfig = {};
  if (configMatch) {
    try {
      collectedConfig = JSON.parse(configMatch);
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
