// New multi-model AI chat endpoint
// GPT-4o-mini for decisions, Llama for conversation

import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth/auth-utils';
import { classifyIntent, streamResponse } from '@/lib/ai/multi-model';
import {
  handleSearchAutomations,
  handleStartSetup,
  handleAutoSetup,
  handleSearchUserFiles,
  handleListUserFiles,
  handleConfirmFileSelection,
  handleExecuteAutomation,
  handleScheduleAutomation,
} from '@/lib/ai/tool-handlers';

export async function POST(request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context } = await request.json();
    
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('[AI Chat] Message:', message);
    console.log('[AI Chat] Context:', context);

    // Step 1: Classify intent using GPT-4o-mini
    const intentResult = await classifyIntent(message, JSON.stringify(context || {}));
    console.log('[AI Chat] Intent:', intentResult);

    const encoder = new TextEncoder();

    // Step 2: Execute action based on intent
    const stream = new ReadableStream({
      async start(controller) {
        const sendSSE = (data) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let actionResult = null;

          switch (intentResult.intent) {
            case 'search_automations':
              actionResult = await executeSearchAutomations(
                intentResult.extracted_data,
                user,
                controller,
                encoder
              );
              break;

            case 'select_automation':
              actionResult = await executeSelectAutomation(
                intentResult.extracted_data,
                context,
                user,
                controller,
                encoder
              );
              break;

            case 'provide_file':
              actionResult = await executeProvideFile(
                intentResult.extracted_data,
                context,
                user,
                controller,
                encoder
              );
              break;

            case 'provide_email':
              actionResult = await executeProvideEmail(
                intentResult.extracted_data,
                context,
                user,
                controller,
                encoder
              );
              break;

            case 'confirm_execute':
              actionResult = await executeConfirmRun(
                context,
                user,
                controller,
                encoder
              );
              break;

            case 'schedule_automation':
              actionResult = await executeScheduleAutomation(
                intentResult.extracted_data,
                context,
                user,
                controller,
                encoder
              );
              break;

            case 'ask_question':
            default:
              // Let Llama handle questions and general chat naturally
              actionResult = { type: 'conversation', query: message };
              break;
          }

          // Step 3: Generate natural response using Llama
          const contextStr = buildContextString(context, actionResult);
          const responseStream = await streamResponse(contextStr, actionResult, message);

          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              sendSSE({ content });
            }
          }

          // Send any UI updates (automation list, file list, etc.)
          if (actionResult?.uiUpdate) {
            sendSSE(actionResult.uiUpdate);
          }

          sendSSE({ type: 'done' });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('[AI Chat] Error:', error);
          sendSSE({ content: "Sorry, something went wrong. Please try again." });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('[AI Chat] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Action executors
async function executeSearchAutomations(data, user, controller, encoder) {
  // Use existing handler but capture result
  const results = [];
  const mockController = {
    enqueue: (chunk) => {
      controller.enqueue(chunk);
      // Parse and capture results
      const str = new TextDecoder().decode(chunk);
      if (str.includes('automation_list')) {
        try {
          const match = str.match(/data: (.+)\n/);
          if (match) results.push(JSON.parse(match[1]));
        } catch (e) {}
      }
    }
  };
  
  await handleSearchAutomations({ query: data.query || '' }, mockController, encoder);
  
  return { type: 'search_results', results };
}

async function executeSelectAutomation(data, context, user, controller, encoder) {
  const selection = data.selection;
  const automations = context?.availableAutomations || [];
  
  let selectedAutomation = null;
  if (typeof selection === 'number') {
    selectedAutomation = automations[selection - 1];
  } else if (typeof selection === 'string') {
    selectedAutomation = automations.find(a => 
      a.name.toLowerCase().includes(selection.toLowerCase())
    );
  }

  if (selectedAutomation) {
    await handleStartSetup(
      { automation_id: selectedAutomation.id, automation_name: selectedAutomation.name },
      user,
      controller,
      encoder
    );
    return { type: 'automation_selected', automation: selectedAutomation };
  }

  return { type: 'error', message: 'Could not find that automation' };
}

async function executeProvideFile(data, context, user, controller, encoder) {
  const { file_name, file_type } = data;
  
  await handleSearchUserFiles(
    { 
      query: file_name, 
      file_type: file_type || 'any',
      automation_id: context?.automationId,
      automation_name: context?.automationName
    },
    user,
    controller,
    encoder
  );

  return { type: 'file_search', query: file_name };
}

async function executeProvideEmail(data, context, user, controller, encoder) {
  const { email } = data;
  
  // More lenient email validation
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!email || !emailRegex.test(email.trim())) {
    sendSSE(controller, encoder, {
      content: "That doesn't look like a valid email address. Please provide a valid email (e.g., billing@company.com)"
    });
    return { type: 'error', message: 'Invalid email format' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Add to collected fields
  const updatedConfig = {
    ...context?.collectedFields,
    billing_email: cleanEmail
  };

  // Send confirmation
  sendSSE(controller, encoder, {
    content: `✓ Saved ${cleanEmail} as your billing email.`
  });

  return { 
    type: 'field_collected', 
    field: 'billing_email', 
    value: cleanEmail,
    updatedConfig,
    uiUpdate: { type: 'field_collected', field_name: 'billing_email', value: cleanEmail }
  };
}

async function executeConfirmRun(context, user, controller, encoder) {
  if (!context?.automationId || !context?.collectedFields) {
    return { type: 'error', message: 'No automation ready to run' };
  }

  await handleExecuteAutomation(
    { 
      automation_id: context.automationId, 
      config: context.collectedFields 
    },
    user,
    controller,
    encoder
  );

  return { type: 'execution_started' };
}

async function executeScheduleAutomation(data, context, user, controller, encoder) {
  try {
    const result = await handleScheduleAutomation(data, context, user, controller, encoder);
    return {
      type: 'schedule_created',
      timeExpression: data.time_expression,
      scheduleType: data.schedule_type,
      result
    };
  } catch (error) {
    sendSSE(controller, encoder, {
      content: `Sorry, I couldn't schedule that: ${error.message}`
    });
    return { type: 'error', message: error.message };
  }
}

function buildContextString(context, actionResult) {
  let str = '';
  
  if (context?.automationName) {
    str += `Setting up: ${context.automationName}\n`;
  }
  
  if (context?.collectedFields) {
    str += `Collected so far: ${JSON.stringify(context.collectedFields)}\n`;
  }
  
  if (context?.remainingFields?.length > 0) {
    str += `Still need: ${context.remainingFields.join(', ')}\n`;
  }

  if (actionResult) {
    str += `Last action: ${actionResult.type}\n`;
  }

  return str || 'Starting fresh conversation';
}
