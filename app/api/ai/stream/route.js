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
    // Authenticate user
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, messages, temperature = 0.7 } = body;

    // Build messages array
    let chatMessages;
    if (messages && Array.isArray(messages)) {
      chatMessages = messages;
    } else if (prompt) {
      chatMessages = [
        { 
          role: "system", 
          content: `You are an AI assistant for ModelGrow, a platform where developers can upload n8n-style JSON workflows and pre-trained models, and non-technical users can discover and use them through simple conversations.

Your capabilities:
- Search for automations based on user needs
- Explain what automations do and how they work
- Guide users through the setup process
- Help connect required services
- Collect configuration inputs

CRITICAL RULES:
1. When calling request_configuration, you MUST use the exact UUID from search results (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
2. When calling request_configuration, you MUST use the EXACT required_inputs array from the search results - DO NOT make up your own input names
3. NEVER make up automation IDs or use automation names as IDs
4. The UUID and required_inputs are provided in the search results
5. After showing a connection button or config form, DO NOT repeat the same request - wait for user response
6. If user reports an error (like "automation failed" or "not found"), acknowledge it and offer to help troubleshoot or search for alternatives - DO NOT just re-show the same results

Setup Flow:
1. User describes what they want → call search_automations
2. User selects an automation → check if it needs EXTERNAL service connectors (like googleSheets, gmail, slack, etc.)
3. If needs EXTERNAL connectors → call request_connection (once)
4. After user connects OR if no external connectors needed → call request_configuration with exact UUID and exact required_inputs from search results (once)
5. After form is shown → wait for user to submit
6. If execution fails → acknowledge the error and ask how to help

IMPORTANT: Only call request_connection for EXTERNAL services that need OAuth (like googleSheets, gmail, slack, twitter, etc.). 
DO NOT call request_connection for internal n8n nodes like: set, webhook, extractFromFile, @n8n/n8n-nodes-langchain.*, etc.

Be concise and friendly. Don't repeat yourself.`
        },
        { role: "user", content: prompt }
      ];
    } else {
      return NextResponse.json(
        { error: "Either 'prompt' or 'messages' is required" },
        { status: 400 }
      );
    }

    // Define tools available to AI
    const tools = [
      {
        type: "function",
        function: {
          name: "search_automations",
          description: "Search for automations and workflows in the database when the user clearly describes what they want to automate. Only call this when you have enough information about their automation needs (e.g., 'email automation', 'social media posting', 'data sync between apps').",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The user's automation requirement or description of what they want to automate"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_connection",
          description: "Request the user to connect a service account (like Google, Slack, etc.) when they select an automation that requires it. Call this when the user wants to use an automation that needs external service connections.",
          parameters: {
            type: "object",
            properties: {
              provider: {
                type: "string",
                description: "The service provider to connect (e.g., 'google', 'slack', 'github')",
                enum: ["google"]
              },
              reason: {
                type: "string",
                description: "Brief explanation of why this connection is needed"
              }
            },
            required: ["provider", "reason"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "request_configuration",
          description: "Request configuration inputs from the user when they select an automation that needs specific values (like Sheet ID, email addresses, etc.). Call this after the user has connected required services. CRITICAL: You must use the exact UUID from the search results (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), NOT the automation name. You must also pass the EXACT required_inputs array from the search results without modification.",
          parameters: {
            type: "object",
            properties: {
              automation_id: {
                type: "string",
                description: "The exact UUID of the automation from the search results (e.g., '115c2421-e502-4489-8112-6b1deecc949c'). This MUST be the 'id' field from the search results, NOT the name.",
                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
              },
              required_inputs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" }
                  },
                  required: ["name", "type"]
                },
                description: "The EXACT required_inputs array from the search results. This is an array of objects with {name, type} structure. Copy it EXACTLY as shown in the search results. Example: [{\"name\":\"GOOGLE_SHEET_ID\",\"type\":\"text\"},{\"name\":\"FILE_INPUT\",\"type\":\"file\"}]"
              }
            },
            required: ["automation_id", "required_inputs"]
          }
        }
      }
    ];

    const response = await client.chat.completions.create({
      messages: chatMessages,
      model: "gpt-4o-mini",
      temperature,
      tools,
      tool_choice: "auto",
      stream: true,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let functionCallData = { name: '', arguments: '' };
          let isFunctionCall = false;

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;
            
            // Check if AI is calling a function
            if (delta?.tool_calls) {
              isFunctionCall = true;
              const toolCall = delta.tool_calls[0];
              
              if (toolCall?.function?.name) {
                functionCallData.name = toolCall.function.name;
              }
              if (toolCall?.function?.arguments) {
                functionCallData.arguments += toolCall.function.arguments;
              }
            }
            
            // Regular content streaming
            const content = delta?.content || '';
            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          // If AI called a function, execute it
          if (isFunctionCall && functionCallData.name === 'request_connection') {
            try {
              // Ensure we have complete JSON before parsing
              if (!functionCallData.arguments || functionCallData.arguments.trim() === '') {
                throw new Error('Empty function arguments');
              }
              const args = JSON.parse(functionCallData.arguments);
              
              // Send connection request to frontend
              const connectionData = `data: ${JSON.stringify({ 
                type: 'connect_request',
                provider: args.provider,
                reason: args.reason
              })}\n\n`;
              controller.enqueue(encoder.encode(connectionData));

              // AI continues with brief explanation
              const explainMessage = `data: ${JSON.stringify({ 
                content: `\n\nClick the button above to connect your ${args.provider.charAt(0).toUpperCase() + args.provider.slice(1)} account.`
              })}\n\n`;
              controller.enqueue(encoder.encode(explainMessage));
            } catch (error) {
              // Don't show error if JSON is incomplete
              if (!(error instanceof SyntaxError)) {
                // Error handled silently
              }
            }
          } else if (isFunctionCall && functionCallData.name === 'request_configuration') {
            try {
              // Validate JSON is complete before parsing
              if (!functionCallData.arguments || functionCallData.arguments.trim() === '') {
                throw new Error('Empty function arguments');
              }
              
              const args = JSON.parse(functionCallData.arguments);
              
              // Validate automation_id is a UUID
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              if (!uuidRegex.test(args.automation_id)) {
                const errorMsg = `\n\n⚠️ Error: Invalid automation ID format. Please select an automation from the search results above.`;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errorMsg })}\n\n`));
              } else {
                // 🔥 FETCH REQUIRED_INPUTS DIRECTLY FROM DATABASE
                // This ensures we get the correct data regardless of what AI sends
                try {
                  const { data: automationData, error: dbError } = await supabase
                    .from('automations')
                    .select('required_inputs')
                    .eq('id', args.automation_id)
                    .single();

                  if (dbError || !automationData) {
                    const errorMsg = `\n\n⚠️ Error: Could not find automation details.`;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errorMsg })}\n\n`));
                    return;
                  }

                  let actualRequiredInputs = automationData.required_inputs;
                  
                  // Parse if they're JSON strings
                  if (Array.isArray(actualRequiredInputs) && actualRequiredInputs.length > 0) {
                    if (typeof actualRequiredInputs[0] === 'string' && actualRequiredInputs[0].startsWith('{')) {
                      try {
                        actualRequiredInputs = actualRequiredInputs.map(input => JSON.parse(input));
                      } catch (e) {
                        // Error handled silently
                      }
                    }
                  }

                  // Send configuration form request to frontend with ACTUAL data
                  const configData = `data: ${JSON.stringify({ 
                    type: 'config_request',
                    automation_id: args.automation_id,
                    required_inputs: actualRequiredInputs
                  })}\n\n`;
                  controller.enqueue(encoder.encode(configData));

                  // AI continues with brief explanation
                  const explainMessage = `data: ${JSON.stringify({ 
                    content: `\n\nPlease fill in the form above.`
                  })}\n\n`;
                  controller.enqueue(encoder.encode(explainMessage));
                } catch (fetchError) {
                  const errorMsg = `\n\n⚠️ Error: Could not load automation configuration.`;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errorMsg })}\n\n`));
                }
              }
            } catch (error) {
              // Don't show error to user if JSON is incomplete - just skip
              if (error instanceof SyntaxError) {
                // Incomplete JSON, waiting for more data
              }
            }
          } else if (isFunctionCall && functionCallData.name === 'search_automations') {
            try {
              const args = JSON.parse(functionCallData.arguments);
              
              // Execute search
              const queryEmbedding = await generateEmbedding(args.query);
              const { data: searchResults, error: searchError } = await supabase.rpc('search_automations', {
                query_embedding: queryEmbedding,
                match_limit: 5
              });

              if (searchError) {
                // Error handled silently
              }

              // Send search results back to AI
              const followUpMessages = [
                ...chatMessages,
                {
                  role: "assistant",
                  content: null,
                  tool_calls: [{
                    id: "call_search",
                    type: "function",
                    function: {
                      name: "search_automations",
                      arguments: JSON.stringify(args)
                    }
                  }]
                },
                {
                  role: "tool",
                  tool_call_id: "call_search",
                  content: JSON.stringify(searchResults || [])
                }
              ];

              // Filter results by minimum similarity threshold (30%)
              const MINIMUM_SIMILARITY = 0.30;
              const filteredResults = searchResults && searchResults.length > 0
                ? searchResults.filter(r => r.similarity >= MINIMUM_SIMILARITY)
                : [];

              // Parse required_inputs if they're stored as JSON strings
              const normalizedResults = filteredResults.map(r => {
                let parsedInputs = r.required_inputs;
                
                // If required_inputs is an array of JSON strings, parse them
                if (Array.isArray(r.required_inputs) && r.required_inputs.length > 0) {
                  if (typeof r.required_inputs[0] === 'string' && r.required_inputs[0].startsWith('{')) {
                    try {
                      parsedInputs = r.required_inputs.map(input => JSON.parse(input));
                    } catch (e) {
                      // Error handled silently
                    }
                  }
                }
                
                return { ...r, required_inputs: parsedInputs };
              });

              // Send structured automation results first (use normalized results)
              if (normalizedResults.length > 0) {
                const automationsData = `data: ${JSON.stringify({ 
                  type: 'automations',
                  automations: normalizedResults 
                })}\n\n`;
                controller.enqueue(encoder.encode(automationsData));
              }

              // Get AI's final response with search results
              const resultsContext = normalizedResults.length > 0
                ? `The following automations are now displayed as cards to the user:\n${normalizedResults.map((r, i) => {
                    const connectors = r.required_connectors ? (typeof r.required_connectors === 'string' ? r.required_connectors : JSON.stringify(r.required_connectors)) : 'none';
                    const inputs = r.required_inputs && r.required_inputs.length > 0 ? JSON.stringify(r.required_inputs) : '[]';
                    return `${i + 1}. "${r.name}" (UUID: ${r.id}) - ${r.description} - Price: $${(r.price_cents / 100).toFixed(2)} - Requires connectors: ${connectors} - Needs inputs: ${inputs}`;
                  }).join('\n')}\n\n⚠️ CRITICAL INSTRUCTIONS FOR request_configuration:\n1. You MUST use the exact UUID shown above (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), NOT the automation name\n2. You MUST copy the ENTIRE required_inputs array EXACTLY as shown above - do NOT simplify, shorten, or modify it\n3. The required_inputs is an array of objects with {name, type} - pass it AS-IS without any changes\n4. Example: If you see required_inputs: [{"name":"FIELD_A","type":"text"},{"name":"FIELD_B","type":"file"}], you must pass that EXACT array\n\nWhen the user refers to "first one", "the automation", etc., they mean one of these automations. When a user selects an automation:\n1. Only call request_connection for EXTERNAL services (googleSheets, gmail, slack, etc.) - NOT for internal n8n nodes like set, webhook, extractFromFile, @n8n/n8n-nodes-langchain.*, etc.\n2. If no external services needed, go directly to request_configuration with the exact UUID and inputs`
                : "No results were found.";

              const finalResponse = await client.chat.completions.create({
                messages: [
                  ...followUpMessages,
                  {
                    role: "system",
                    content: `The search results have been displayed as interactive cards to the user. ${resultsContext}\n\nProvide a brief, friendly message (1-2 sentences max). If results were found, say something like 'I found some automations that might help!' If no results, suggest they try describing their needs differently.`
                  }
                ],
                model: "gpt-4o-mini",
                temperature,
                stream: true,
              });

              // Stream the final response
              for await (const chunk of finalResponse) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                  const data = `data: ${JSON.stringify({ content })}\n\n`;
                  controller.enqueue(encoder.encode(data));
                }
              }
            } catch (searchError) {
              const errorMsg = '\n\nSorry, I encountered an error while searching for automations.';
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errorMsg })}\n\n`));
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
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process chat request", message: error.message },
      { status: 500 }
    );
  }
}
