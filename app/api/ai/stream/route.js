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
- Show pricing and requirements
- Help users understand setup instructions
- Search for alternative solutions if needed

What you CANNOT do:
- You cannot modify, edit, or customize automations
- You cannot create new automations
- You cannot execute or run automations
- You cannot access user's personal data or accounts

When a user selects an automation, offer to:
1. Provide more details about how it works
2. Explain the setup process
3. Show pricing information
4. Search for similar alternatives

Be friendly, helpful, and honest about your limitations. Focus on helping users discover and understand the right automation for their needs.`
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
              const args = JSON.parse(functionCallData.arguments);
              
              // Send connection request to frontend
              const connectionData = `data: ${JSON.stringify({ 
                type: 'connect_request',
                provider: args.provider,
                reason: args.reason
              })}\n\n`;
              controller.enqueue(encoder.encode(connectionData));

              // AI continues with explanation
              const explainMessage = `data: ${JSON.stringify({ 
                content: `\n\nTo use this automation, you'll need to connect your ${args.provider.charAt(0).toUpperCase() + args.provider.slice(1)} account. Click the button above to get started.`
              })}\n\n`;
              controller.enqueue(encoder.encode(explainMessage));
            } catch (error) {
              console.error('Connection request error:', error);
            }
          } else if (isFunctionCall && functionCallData.name === 'search_automations') {
            try {
              const args = JSON.parse(functionCallData.arguments);
              
              // Execute search
              const queryEmbedding = await generateEmbedding(args.query);
              const { data: searchResults } = await supabase.rpc('search_automations', {
                query_embedding: queryEmbedding,
                match_limit: 5
              });

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

              // Send structured automation results first
              if (searchResults && searchResults.length > 0) {
                const automationsData = `data: ${JSON.stringify({ 
                  type: 'automations',
                  automations: searchResults 
                })}\n\n`;
                controller.enqueue(encoder.encode(automationsData));
              }

              // Get AI's final response with search results
              const resultsContext = searchResults && searchResults.length > 0
                ? `The following automations are now displayed as cards to the user:\n${searchResults.map((r, i) => {
                    const connectors = r.required_connectors ? (typeof r.required_connectors === 'string' ? r.required_connectors : JSON.stringify(r.required_connectors)) : 'none';
                    return `${i + 1}. "${r.name}" (ID: ${r.id}) - ${r.description} - Price: $${(r.price_cents / 100).toFixed(2)} - Requires: ${connectors}`;
                  }).join('\n')}\n\nWhen the user refers to "first one", "the Google Sheets one", or similar, they mean one of these automations. When a user selects an automation that requires connectors (like googleSheets, gmail, etc.), you should inform them they need to connect those services and offer to help them connect.`
                : "No results were found.";

              const finalResponse = await client.chat.completions.create({
                messages: [
                  ...followUpMessages,
                  {
                    role: "system",
                    content: `The search results have been displayed as interactive cards to the user. ${resultsContext}\n\nProvide a brief, friendly message. If results were found, say something like 'I found some automations that might help!' If no results, suggest they try describing their needs differently.`
                  }
                ],
                model: "gpt-4o",
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
              console.error('Function call error:', searchError);
              const errorMsg = '\n\nSorry, I encountered an error while searching for automations.';
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errorMsg })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
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
    console.error("AI stream error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", message: error.message },
      { status: 500 }
    );
  }
}
