import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    const systemPrompt = {
      role: "system",
      content: `You are an AI assistant for ModelGrow, a platform for discovering and using n8n automation workflows.

CRITICAL: DO NOT CALL search_automations IF:
- You already showed automation results in THIS conversation
- User asks "what does it do", "tell me more", "how does it work", etc.
- User is asking follow-up questions about automations you ALREADY showed

ONLY call search_automations when:
- User asks for a COMPLETELY DIFFERENT type of automation (new topic)
- This is the FIRST message asking for automation help

WHEN TO USE EACH TOOL:
- search_automations: ONLY for NEW automation requests you haven't searched for yet
- request_configuration: When user says "I want to use this" or "Select" 
- request_connection: When OAuth is needed

For follow-up questions like "what does it do?" or "tell me more" - just answer directly using the automation info from your conversation history. DO NOT search again.

Be concise - 1-2 sentences max per response.`
    };

    let chatMessages;
    if (messages && Array.isArray(messages)) {
      // Check if system message already exists
      const hasSystemMessage = messages.some(msg => msg.role === 'system' && msg.content.includes('ModelGrow'));
      if (hasSystemMessage) {
        chatMessages = messages;
      } else {
        chatMessages = [systemPrompt, ...messages];
      }
    } else if (prompt) {
      chatMessages = [
        systemPrompt,
        { role: "user", content: prompt }
      ];
    } else {
      return NextResponse.json({ error: "Either 'prompt' or 'messages' is required" }, { status: 400 });
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "search_automations",
          description: "Search for automations when user describes what they want to automate.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "The user's automation requirement" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_connection",
          description: "Request user to connect a service account when automation requires it.",
          parameters: {
            type: "object",
            properties: {
              provider: { type: "string", enum: ["google"], description: "The service provider to connect" },
              reason: { type: "string", description: "Brief explanation of why this connection is needed" }
            },
            required: ["provider", "reason"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_configuration",
          description: "Request configuration inputs after user has connected required services. Use exact UUID from search results.",
          parameters: {
            type: "object",
            properties: {
              automation_id: { type: "string", description: "The exact UUID from search results" },
              required_inputs: { type: "array", items: { type: "object" }, description: "The required_inputs array from search results" }
            },
            required: ["automation_id", "required_inputs"]
          }
        }
      }
    ];

    const response = await client.chat.completions.create({
      messages: chatMessages,
      model: "gpt-4o",
      temperature,
      tools,
      tool_choice: "auto",
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
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

          // Handle request_connection
          if (isFunctionCall && functionCallData.name === 'request_connection') {
            try {
              const args = JSON.parse(functionCallData.arguments);
              const providerName = args.provider.charAt(0).toUpperCase() + args.provider.slice(1);

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                content: `To run this automation, I need to connect to your ${providerName} account. This allows the automation to:\n\n• Access your Google Drive & Sheets to store data\n• Read and process your files securely\n• Save results back to your account\n\nYour credentials are encrypted and only used for this automation.\n\n`
              })}\n\n`));

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'connect_request',
                provider: args.provider,
                reason: args.reason
              })}\n\n`));
            } catch (e) { }
          }

          // Handle request_configuration
          else if (isFunctionCall && functionCallData.name === 'request_configuration') {
            try {
              const args = JSON.parse(functionCallData.arguments);
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

              if (!uuidRegex.test(args.automation_id)) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: "\n\n⚠️ Error: Invalid automation ID." })}\n\n`));
              } else {
                const { data: automationData, error: dbError } = await supabase
                  .from('automations')
                  .select('required_inputs, required_connectors')
                  .eq('id', args.automation_id)
                  .single();

                if (dbError || !automationData) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: "\n\n⚠️ Error: Could not find automation details." })}\n\n`));
                } else {
                  // Check connectors
                  let requiredConnectors = [];
                  if (automationData.required_connectors) {
                    if (typeof automationData.required_connectors === 'string') {
                      try { requiredConnectors = JSON.parse(automationData.required_connectors); }
                      catch (e) { requiredConnectors = automationData.required_connectors.split(',').map(s => s.trim()).filter(Boolean); }
                    } else if (Array.isArray(automationData.required_connectors)) {
                      requiredConnectors = automationData.required_connectors;
                    }
                  }

                  const hasGoogle = requiredConnectors.some(c =>
                    c.toLowerCase().includes('google') || c.toLowerCase().includes('sheets') || c.toLowerCase().includes('gmail')
                  );

                  if (hasGoogle) {
                    const { data: integration } = await supabase
                      .from('user_integrations')
                      .select('id')
                      .eq('user_id', user.id)
                      .eq('provider', 'google')
                      .maybeSingle();

                    if (!integration) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        content: `To run this automation, I need to connect to your Google account. This allows the automation to:\n\n• Access your Google Drive & Sheets to store data\n• Read and process your files securely\n• Save results back to your account\n\nYour credentials are encrypted and only used for this automation.\n\n`
                      })}\n\n`));
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connect_request', provider: 'google', reason: 'Required for this automation' })}\n\n`));
                      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                      controller.close();
                      return;
                    }
                  }

                  // Show config form
                  let actualRequiredInputs = automationData.required_inputs;
                  if (Array.isArray(actualRequiredInputs) && actualRequiredInputs.length > 0 && typeof actualRequiredInputs[0] === 'string' && actualRequiredInputs[0].startsWith('{')) {
                    try { actualRequiredInputs = actualRequiredInputs.map(input => JSON.parse(input)); } catch (e) { }
                  }

                  const fieldExplanations = (actualRequiredInputs || []).map(input => {
                    const name = input.name || input;
                    return `• **${name.replace(/_/g, ' ').toLowerCase()}**: needed to run the automation`;
                  }).join('\n');

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    content: `Great choice! To run this automation, I need a few details from you:\n\n${fieldExplanations}\n\n`
                  })}\n\n`));

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'config_request',
                    automation_id: args.automation_id,
                    required_inputs: actualRequiredInputs
                  })}\n\n`));
                }
              }
            } catch (e) { }
          }

          // Handle search_automations
          else if (isFunctionCall && functionCallData.name === 'search_automations') {
            try {
              const args = JSON.parse(functionCallData.arguments);
              const queryEmbedding = await generateEmbedding(args.query);

              const { data: searchResults, error: searchError } = await supabase.rpc('search_automations', {
                query_embedding: queryEmbedding,
                match_limit: 5
              });

              const followUpMessages = [
                ...chatMessages,
                { role: "assistant", content: null, tool_calls: [{ id: "call_search", type: "function", function: { name: "search_automations", arguments: JSON.stringify(args) } }] },
                { role: "tool", tool_call_id: "call_search", content: JSON.stringify(searchResults || []) }
              ];

              const MINIMUM_SIMILARITY = 0.50;
              const filteredResults = searchResults && searchResults.length > 0
                ? searchResults.filter(r => r.similarity >= MINIMUM_SIMILARITY).slice(0, 3)
                : [];

              const normalizedResults = filteredResults.map(r => {
                let parsedInputs = r.required_inputs;
                if (Array.isArray(r.required_inputs) && r.required_inputs.length > 0 && typeof r.required_inputs[0] === 'string' && r.required_inputs[0].startsWith('{')) {
                  try { parsedInputs = r.required_inputs.map(input => JSON.parse(input)); } catch (e) { }
                }
                return { ...r, required_inputs: parsedInputs };
              });

              // Get AI intro message FIRST
              const resultsContext = normalizedResults.length > 0 ? `Found ${normalizedResults.length} automation(s).` : "No results found.";

              const finalResponse = await client.chat.completions.create({
                messages: [...followUpMessages, { role: "system", content: `${resultsContext} Provide a brief intro (1-2 sentences). Say something like 'I found some automations!' if found, or suggest trying different terms if not. DO NOT list the automations.` }],
                model: "gpt-4o",
                temperature,
                stream: true,
              });

              // Stream AI intro FIRST
              for await (const chunk of finalResponse) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              }

              // THEN send automation cards
              if (normalizedResults.length > 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'automations', automations: normalizedResults })}\n\n`));

                // Send automation context as separate event (not streamed content) for AI reference
                const automationContext = normalizedResults.map(a =>
                  `[Automation: "${a.name}" | UUID: ${a.id} | Description: ${a.description?.slice(0, 100)}...]`
                ).join('\n');
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'automation_context',
                  context: automationContext
                })}\n\n`));
              }
            } catch (searchError) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: '\n\nSorry, I encountered an error while searching.' })}\n\n`));
            }
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
    return NextResponse.json({ error: "Failed to process chat request", message: error.message }, { status: 500 });
  }
}
