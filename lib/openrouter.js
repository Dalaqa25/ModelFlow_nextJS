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
  'google/gemini-flash-1.5-8b',
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-flash-1.5',
  'mistralai/mistral-7b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.2-1b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'microsoft/phi-3-medium-128k-instruct:free',
  'qwen/qwen-2-7b-instruct:free',
  'openchat/openchat-7b:free',
  'huggingfaceh4/zephyr-7b-beta:free',
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
 * Smart AI completion with automatic fallback to multiple free models
 * If one model fails or is rate-limited, it tries the next one
 */
export async function generateCompletion({
  messages,
  temperature = 0.7,
  max_tokens = 1000,
  stream = false,
  preferredModel = null, // Can specify a preferred model
  useFreeModels = true, // Set to false to use only premium models
}) {
  const modelsToTry = useFreeModels 
    ? (preferredModel ? [preferredModel, ...FREE_MODELS] : FREE_MODELS)
    : [preferredModel];

  let lastError = null;
  
  // Try each model until one works
  for (const model of modelsToTry) {
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
      lastError = error;
      
      // If it's a rate limit or availability error, try next model
      if (error.status === 429 || error.status === 503 || error.message.includes('rate limit')) {
        continue; // Try next model
      }
      
      // For other errors, might want to try next model anyway
      continue;
    }
  }

  // If all models failed
  return {
    success: false,
    error: lastError?.message || 'All models failed',
    details: `Tried ${modelsToTry.length} models, all failed`,
  };
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
  const modelsToTry = useFreeModels 
    ? (preferredModel ? [preferredModel, ...FREE_MODELS] : FREE_MODELS)
    : [preferredModel];

  let lastError = null;

  for (const model of modelsToTry) {
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
      lastError = error;
      continue;
    }
  }

  return {
    success: false,
    error: lastError?.message || 'All models failed for streaming',
  };
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

