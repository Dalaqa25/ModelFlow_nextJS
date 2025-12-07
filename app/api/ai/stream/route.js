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
          content: "You are an AI assistant for ModelGrow, a platform where developers can upload n8n-style JSON workflows and pre-trained models, and non-technical users can discover and use them through simple conversations. Your purpose is to help users find the right workflows and models for their automation needs. When users describe what they want to automate, guide them to relevant solutions available on the platform. Be friendly, helpful, and focus on understanding their automation goals."
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
          if (isFunctionCall && functionCallData.name === 'search_automations') {
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

              // Get AI's final response with search results
              const finalResponse = await client.chat.completions.create({
                messages: followUpMessages,
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
