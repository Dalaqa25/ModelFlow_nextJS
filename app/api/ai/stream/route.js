import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getSupabaseUser } from '@/lib/auth-utils';

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

    const response = await client.chat.completions.create({
      messages: chatMessages,
      model: "gpt-4o",
      temperature,
      stream: true,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
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
