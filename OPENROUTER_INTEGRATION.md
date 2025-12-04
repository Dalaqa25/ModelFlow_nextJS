# OpenRouter AI Integration Guide

## 🎉 Integration Complete!

OpenRouter has been successfully integrated into ModelFlow with automatic fallback across multiple free AI models.

## 📁 Files Created

### 1. Core Utility (`lib/openrouter.js`)
- OpenRouter client configuration
- 12+ free models with automatic fallback
- Helper functions for various AI tasks
- Streaming support
- Credit monitoring

### 2. API Routes
- `/app/api/ai/generate/route.js` - Standard AI generation endpoint
- `/app/api/ai/stream/route.js` - Real-time streaming endpoint

### 3. Test Interface
- `/app/ai-playground/page.jsx` - Interactive testing playground

## 🚀 Getting Started

### 1. Environment Variables

Make sure your `.env.local` has:

```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=ModelFlow
```

### 2. Test the Integration

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/ai-playground`

3. Try the preset prompts or create your own!

## 🎯 Features

### Smart Fallback System
If one free model is rate-limited or expired, it automatically tries the next one:
- Google Gemini models
- Mistral 7B
- Meta Llama models
- Microsoft Phi models
- And more!

### Two Generation Modes

**Standard Generation** (⚡ Generate button)
- Returns complete response at once
- Shows token usage statistics
- Best for shorter responses

**Streaming** (🎥 Stream button)
- Real-time word-by-word output
- ChatGPT-style experience
- Better for longer responses

## 📖 Usage Examples

### Simple Text Generation

```javascript
import { generateText } from '@/lib/openrouter';

const result = await generateText('Write a description for a 3D model');

if (result.success) {
  console.log(result.content);
  console.log('Model used:', result.model);
}
```

### With System Prompt

```javascript
import { generateWithSystemPrompt } from '@/lib/openrouter';

const result = await generateWithSystemPrompt(
  'You are a helpful 3D modeling assistant',
  'Generate 10 tags for a medieval castle model'
);
```

### In API Routes

```javascript
import { generateCompletion } from '@/lib/openrouter';

const result = await generateCompletion({
  messages: [
    { role: 'system', content: 'You are helpful' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  max_tokens: 1000,
});
```

### Frontend Usage

```javascript
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Your prompt here',
    systemPrompt: 'Optional system prompt',
    temperature: 0.7,
    maxTokens: 1000,
  }),
});

const data = await response.json();
console.log(data.content);
```

## 💡 Use Cases in ModelFlow

### 1. Auto-Generate Model Descriptions
When users upload models, automatically generate compelling descriptions:

```javascript
const result = await generateWithSystemPrompt(
  'You are a 3D model marketplace assistant. Write compelling, SEO-friendly descriptions.',
  `Generate a description for this model: ${modelName}. Category: ${category}`
);
```

### 2. Generate Tags Automatically
```javascript
const result = await generateText(
  `Generate 10 relevant tags for a ${category} 3D model named "${modelName}"`
);
```

### 3. Content Moderation
```javascript
const result = await generateWithSystemPrompt(
  'You are a content moderator. Analyze if comments are appropriate for a professional marketplace.',
  `Is this comment appropriate? "${userComment}"`
);
```

### 4. Model Recommendations
```javascript
const result = await generateText(
  `Based on user interest in ${userPreferences}, recommend 5 types of 3D models they might like`
);
```

### 5. AI Assistant in Requests
Help users write better model requests:

```javascript
const result = await generateWithSystemPrompt(
  'Help users write clear, detailed 3D model requests',
  `Improve this request: "${userRequest}"`
);
```

## 🔧 Configuration

### Free Models List
The integration uses these free models (in order of preference):
1. Google Gemini Flash 1.5 8B
2. Google Gemini 2.0 Flash Exp
3. Google Gemini Flash 1.5
4. Mistral 7B Instruct
5. Hermes 3 Llama 3.1 405B
6. Meta Llama 3.2 3B
7. Meta Llama 3.2 1B
8. Microsoft Phi-3 Mini
9. Microsoft Phi-3 Medium
10. Qwen 2 7B
11. OpenChat 7B
12. Zephyr 7B Beta

### Upgrading to Premium Models
When ready, you can use premium models:

```javascript
import { PREMIUM_MODELS } from '@/lib/openrouter';

const result = await generateCompletion({
  messages: [...],
  preferredModel: PREMIUM_MODELS.GPT4_TURBO,
  useFreeModels: false, // Don't fallback to free models
});
```

## 📊 Monitoring

### Check Available Models
```javascript
import { checkAvailableModels } from '@/lib/openrouter';

const models = await checkAvailableModels();
console.log(models);
```

### Check Credit Balance
```javascript
import { getCreditsBalance } from '@/lib/openrouter';

const balance = await getCreditsBalance();
console.log(balance);
```

## 🐛 Troubleshooting

### "All models failed"
- Check if `OPENROUTER_API_KEY` is set correctly
- Verify you have credits in your OpenRouter account
- Some free models may be temporarily unavailable

### Rate Limiting
- Free models have rate limits
- The fallback system will automatically try other models
- Consider upgrading to premium models for production

### Authentication Errors
- Ensure user is authenticated before calling AI endpoints
- Check `getSupabaseUser()` is working correctly

## 🎨 Next Steps

1. **Test in AI Playground**: Visit `/ai-playground` to test
2. **Integrate into Features**: Add AI to model uploads, requests, etc.
3. **Monitor Usage**: Keep track of token usage and costs
4. **Upgrade When Ready**: Switch to premium models for production

## 📚 Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Dashboard](https://openrouter.ai/dashboard)

---

**Happy Building! 🚀**

