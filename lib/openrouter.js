import OpenAI from 'openai';

// Initialize OpenRouter client
export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
    'X-Title': process.env.OPENROUTER_SITE_NAME || 'ModelFlow',
  },
});

// FREE MODELS - Updated list of free models on OpenRouter
// These models have free tiers but may have rate limits or expire
export const FREE_MODELS = [
  'google/gemma-3n-e2b-it:free',
];

// PAID MODELS (for reference when you want to upgrade)
export const PREMIUM_MODELS = {
  GPT4_TURBO: 'openai/gpt-4-turbo',
  GPT4: 'openai/gpt-4',
  GPT35_TURBO: 'openai/gpt-3.5-turbo',
  CLAUDE_OPUS: 'anthropic/claude-3-opus',
  CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
  CLAUDE_HAIKU: 'anthropic/claude-3-haiku',
  GEMINI_PRO: 'google/gemini-pro-1.5',
};

/**
 * AI completion using the configured free model
 */
export async function generateCompletion({
  messages,
  temperature = 0.7,
  max_tokens = 1000,
  stream = false,
  preferredModel = null, // Can specify a preferred model
  useFreeModels = true, // Set to false to use only premium models
}) {
  const model = preferredModel || (useFreeModels ? FREE_MODELS[0] : null);

  if (!model) {
    return {
      success: false,
      error: 'No model specified',
    };
  }

  try {
    console.log(`🤖 Trying model: ${model}`);
    
    const completion = await openrouter.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      stream,
    });

    console.log(`✅ Success with model: ${model}`);
    
    return {
      success: true,
      data: completion,
      content: completion.choices[0]?.message?.content,
      model: model,
      usage: completion.usage,
    };
    
  } catch (error) {
    console.warn(`❌ Model ${model} failed:`, error.message);
    
    return {
      success: false,
      error: error.message || 'Model request failed',
    };
  }
}

/**
 * Simple single prompt helper
 */
export async function generateText(prompt, options = {}) {
  const messages = [
    {
      role: 'user',
      content: prompt,
    },
  ];

  return generateCompletion({
    messages,
    ...options,
  });
}

/**
 * Generate with system prompt + user prompt
 */
export async function generateWithSystemPrompt(systemPrompt, userPrompt, options = {}) {
  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  return generateCompletion({
    messages,
    ...options,
  });
}

/**
 * Multi-turn conversation helper
 */
export async function generateConversation(conversationHistory, options = {}) {
  return generateCompletion({
    messages: conversationHistory,
    ...options,
  });
}

/**
 * Streaming response helper
 */
export async function generateStreamingCompletion({
  messages,
  temperature = 0.7,
  max_tokens = 1000,
  preferredModel = null,
  useFreeModels = true,
}) {
  const model = preferredModel || (useFreeModels ? FREE_MODELS[0] : null);

  if (!model) {
    return {
      success: false,
      error: 'No model specified',
    };
  }

  try {
    console.log(`🤖 Trying streaming with model: ${model}`);
    
    const stream = await openrouter.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true,
    });

    console.log(`✅ Streaming started with model: ${model}`);
    
    return {
      success: true,
      stream,
      model,
    };
    
  } catch (error) {
    console.warn(`❌ Streaming failed for ${model}:`, error.message);
    
    return {
      success: false,
      error: error.message || 'Streaming request failed',
    };
  }
}

/**
 * Check available models and their status
 */
export async function checkAvailableModels() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });
    
    const data = await response.json();
    return {
      success: true,
      models: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get current credit balance (useful for monitoring usage)
 */
export async function getCreditsBalance() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });
    
    const data = await response.json();
    return {
      success: true,
      balance: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

