// Multi-model AI setup
// GPT-4o-mini (GitHub Models) for intent/tools, Llama (Groq) for conversation

import OpenAI from "openai";

// GitHub Models client - for intent classification and tool calling
const githubClient = new OpenAI({
  baseURL: "https://models.github.ai/inference",
  apiKey: process.env.GITHUB_TOKEN,
});

// Groq client - for natural conversation
const groqClient = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// Models
const TOOL_MODEL = "openai/gpt-4o-mini"; // Good at following instructions, tool calling
const CHAT_MODEL = "llama-3.3-70b-versatile"; // Good at natural conversation

/**
 * Classify user intent and extract structured data
 * Uses GPT-4o-mini for reliable classification
 */
export async function classifyIntent(userMessage, conversationContext) {
  const response = await githubClient.chat.completions.create({
    model: TOOL_MODEL,
    temperature: 0.1, // Low temp for consistent classification
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an intent classifier for an automation setup assistant. Analyze the user message and return JSON with:

{
  "intent": "search_automations" | "select_automation" | "provide_file" | "provide_email" | "confirm_execute" | "schedule_automation" | "ask_question" | "change_value" | "other",
  "confidence": 0.0-1.0,
  "extracted_data": {
    // For select_automation: { "selection": number or name }
    // For provide_file: { "file_name": string, "file_type": "folder" | "spreadsheet" | "document" }
    // For provide_email: { "email": string }
    // For confirm_execute: { "confirmed": true }
    // For schedule_automation: { "time_expression": string, "automation_reference": string (optional), "schedule_type": "recurring" | "one_time" }
    // For change_value: { "field": string, "new_value": string }
    // For ask_question: { "question": string }
  }
}

Context about current state:
${conversationContext}

Be precise. If user says "1" or "first one" after seeing a list, that's "select_automation" or file selection.
If user says "run it", "yes", "go ahead" after seeing a summary, that's "confirm_execute".
If user provides an email address, that's "provide_email".

For schedule_automation intent:
- Recognize phrases like "schedule", "run every", "execute every", "run in", "execute in", "run after", "set up to run"
- Extract the time expression exactly as stated (e.g., "every 6 hours", "in 5 hours", "daily at 3pm", "every monday at 9am")
- Determine schedule_type: "recurring" for patterns with "every" or "daily", "one_time" for patterns with "in" or "after"
- Extract automation_reference if user mentions a specific automation (e.g., "this", "invoice automation", "the email one")
- Examples:
  * "run this every 6 hours" → { time_expression: "every 6 hours", schedule_type: "recurring", automation_reference: "this" }
  * "schedule in 5 hours" → { time_expression: "in 5 hours", schedule_type: "one_time" }
  * "make the invoice automation run daily at 3pm" → { time_expression: "daily at 3pm", schedule_type: "recurring", automation_reference: "invoice automation" }`
      },
      { role: "user", content: userMessage }
    ]
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch (e) {
    return { intent: "other", confidence: 0, extracted_data: {} };
  }
}

/**
 * Decide which tool to call based on intent and context
 * Uses GPT-4o-mini for reliable tool selection
 */
export async function decideToolCall(intent, extractedData, setupState, tools) {
  const response = await githubClient.chat.completions.create({
    model: TOOL_MODEL,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `Based on the user's intent and current setup state, decide which tool to call.
        
Current setup state:
${JSON.stringify(setupState, null, 2)}

User intent: ${intent}
Extracted data: ${JSON.stringify(extractedData)}

Return a JSON object with:
{
  "tool": "tool_name" or null if no tool needed,
  "arguments": { ... tool arguments ... },
  "reasoning": "brief explanation"
}`
      }
    ],
    tools: tools,
    tool_choice: "auto"
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (toolCall) {
    return {
      tool: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments)
    };
  }
  return null;
}

/**
 * Generate a natural conversational response
 * Uses Llama for natural, friendly responses
 */
export async function generateResponse(context, actionResult, userMessage) {
  const response = await groqClient.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: `You are a friendly AI assistant helping users set up automations. Be conversational, helpful, and concise.

RULES:
- Never show technical IDs or UUIDs to users
- Don't use markdown formatting (no **, no #, no -)
- Be warm and natural, not robotic
- Keep responses brief but helpful

Current context:
${context}

Action that was just performed:
${JSON.stringify(actionResult, null, 2)}

Generate a natural response explaining what happened and what's next (if anything).`
      },
      { role: "user", content: userMessage }
    ]
  });

  return response.choices[0].message.content;
}

/**
 * Stream a conversational response
 * Uses Llama for natural, friendly responses
 */
export async function streamResponse(context, actionResult, userMessage) {
  return await groqClient.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.7,
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a friendly AI assistant helping users set up automations.

=== CRITICAL STATE TRACKING RULES ===
1. ALWAYS check what fields have been collected BEFORE asking for anything
2. NEVER ask for a field that was already provided
3. When user uploads a file, that field is DONE - move to next field
4. When user provides ANY information, acknowledge it and ask for the NEXT missing field

=== CURRENT STATE ===
${context}

=== LAST ACTION ===
${JSON.stringify(actionResult, null, 2)}

=== RESPONSE RULES ===
- Be warm, friendly, and conversational
- NO markdown formatting (no **, no #, no -)
- Keep responses SHORT (1-2 sentences max)
- If a field was just collected, say "Got it!" then ask for NEXT field
- If all fields collected, say "Perfect! Ready to run"
- NEVER repeat questions for fields already collected

=== FIELD TRACKING ===
Before responding, mentally check:
1. What fields are already collected? (check context)
2. What fields are still missing?
3. Did user just provide something? If yes, what's NEXT?

Example good flow:
User: *uploads video*
You: "Got it! Now I need the interval between posts."
User: "every 6 hours"
You: "Perfect! Ready to schedule your TikTok videos."

Example BAD flow (NEVER DO THIS):
User: *uploads video*
You: "I still need video files" ← WRONG! File was just uploaded!`
      },
      { role: "user", content: userMessage }
    ]
  });
}

export { githubClient, groqClient, TOOL_MODEL, CHAT_MODEL };
