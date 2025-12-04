import { getSupabaseUser } from '@/lib/auth-utils';
import { generateStreamingCompletion } from '@/lib/openrouter';

export async function POST(request) {
  try {
    // Authenticate user
    const user = await getSupabaseUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { 
      prompt, 
      systemPrompt, 
      model, 
      temperature = 0.7, 
      maxTokens = 1000 
    } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build messages array
    const messages = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    console.log(`🎥 Starting streaming for user: ${user.email}`);

    // Get streaming response with automatic fallback
    const result = await generateStreamingCompletion({
      messages,
      temperature,
      max_tokens: maxTokens,
      preferredModel: model,
      useFreeModels: true,
    });

    if (!result.success) {
      console.error('Streaming failed:', result.error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to start streaming',
          message: result.error 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Streaming started with model: ${result.model}`);

    // Create a readable stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Send as Server-Sent Events format
              const data = JSON.stringify({ 
                content,
                model: result.model,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          
          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          
          console.log(`✅ Streaming completed for user: ${user.email}`);
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream initialization error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

