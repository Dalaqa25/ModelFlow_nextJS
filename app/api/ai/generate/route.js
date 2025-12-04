import { NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/auth-utils';
import { generateCompletion, FREE_MODELS } from '@/lib/openrouter';

export async function POST(request) {
  try {
    // Authenticate user
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to use AI features' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      prompt, 
      systemPrompt, 
      model, 
      temperature = 0.7, 
      maxTokens = 1000,
      conversationHistory 
    } = body;

    // Validate input
    if (!prompt && !conversationHistory) {
      return NextResponse.json(
        { error: 'Prompt or conversation history is required' },
        { status: 400 }
      );
    }

    // Build messages array
    let messages = [];
    
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // Use provided conversation history
      messages = conversationHistory;
    } else {
      // Build from scratch
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
    }

    // Generate completion with automatic fallback
    const result = await generateCompletion({
      messages,
      temperature,
      max_tokens: maxTokens,
      preferredModel: model, // Will fallback to free models if this fails
      useFreeModels: true,
    });

    if (!result.success) {
      console.error('AI Generation failed:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to generate AI response',
          details: result.details,
          message: result.error 
        },
        { status: 500 }
      );
    }

    // Log usage for monitoring
    console.log(`✅ AI Generation successful for user: ${user.email}`);
    console.log(`📊 Model used: ${result.model}`);
    console.log(`📊 Tokens used: ${result.usage?.total_tokens || 'N/A'}`);

    return NextResponse.json({
      success: true,
      content: result.content,
      model: result.model,
      usage: result.usage,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check available models and service status
export async function GET(request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if OpenRouter is configured
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        configured: false,
        error: 'OpenRouter API key not configured',
      }, { status: 503 });
    }

    return NextResponse.json({
      configured: true,
      freeModels: FREE_MODELS,
      totalFreeModels: FREE_MODELS.length,
      message: 'OpenRouter is ready to use',
    });

  } catch (error) {
    console.error('Error checking AI service:', error);
    return NextResponse.json(
      { 
        configured: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}

