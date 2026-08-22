'use strict';

// An OpenAI-compatible front door to Claude Code running headless.
//
// ModelGrow's orchestrator and the imported n8n workflows both speak the
// OpenAI chat-completions dialect. Claude Code speaks its own CLI. This
// translates between them, so the account's existing Claude subscription
// answers requests that would otherwise go to a metered third-party API and
// no workflow has to be rewritten to benefit.
//
// Deliberately kept in the repository. Its predecessor existed only on the
// server it ran on, and was lost with that machine.

const http = require('node:http');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');

const SECRET = process.env.ORCHESTRATOR_GATEWAY_SECRET || '';
const PORT = Number(process.env.GATEWAY_PORT) || 3100;
const HOST = process.env.GATEWAY_HOST || '0.0.0.0';
const CLAUDE = process.env.CLAUDE_EXECUTABLE || 'claude';
const CHAT_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';
const EFFORT = process.env.CLAUDE_EFFORT || 'low';
const TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS) || 240000;
const MAX_CONCURRENT = Number(process.env.GATEWAY_MAX_CONCURRENT) || 2;
const MAX_QUEUE = Number(process.env.GATEWAY_MAX_QUEUE) || 32;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

if (!SECRET) {
  console.error('ORCHESTRATOR_GATEWAY_SECRET is required');
  process.exit(1);
}

// Callers ask for whatever model their workflow was written against. Rather
// than reject an unfamiliar name — which would make every imported workflow a
// manual edit — anything unrecognised resolves to the configured Claude model.
const OPENAI_MODEL_ALIASES = new Map([
  ['gpt-4o', 'claude-sonnet-5'],
  ['gpt-4o-mini', 'claude-haiku-4-5-20251001'],
  ['gpt-4', 'claude-sonnet-5'],
  ['gpt-4-turbo', 'claude-sonnet-5'],
  ['gpt-3.5-turbo', 'claude-haiku-4-5-20251001'],
  ['claude-haiku', 'claude-haiku-4-5-20251001'],
  ['claude-sonnet', 'claude-sonnet-5'],
]);

function resolveModel(requested) {
  const name = String(requested || '').trim().toLowerCase();
  if (name.startsWith('claude-')) return name;
  return OPENAI_MODEL_ALIASES.get(name) || CHAT_MODEL;
}

// Vision and tool payloads arrive as content arrays; keep the text and drop
// the rest rather than serialising objects into the prompt.
function flattenMessages(messages) {
  const parts = [];
  for (const message of messages || []) {
    const content = Array.isArray(message?.content)
      ? message.content.map((part) => (typeof part === 'string' ? part : part?.text || '')).join('')
      : String(message?.content ?? '');
    if (!content.trim()) continue;
    const role = message.role === 'assistant' ? 'Assistant' : message.role === 'system' ? 'System' : 'User';
    parts.push(`${role}: ${content}`);
  }
  return parts.join('\n\n');
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
  res.end(payload);
}

function openAiError(res, status, message, type = 'invalid_request_error') {
  send(res, status, { error: { message, type } });
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

// One Claude turn. `outputSchema` switches it into structured mode, which is
// how tool calls are served: the tool's own parameter schema goes in and a
// conforming object comes back, with no tool-calling protocol involved.
function runClaude(prompt, outputSchema, model) {
  const args = [
    '-p',
    '--output-format', 'json',
    '--model', model || CHAT_MODEL,
    '--effort', EFFORT,
    '--allowedTools', '',
    '--permission-mode', 'dontAsk',
    '--setting-sources', '',
    '--strict-mcp-config',
  ];
  if (outputSchema) args.push('--json-schema', JSON.stringify(outputSchema));

  return new Promise((resolve, reject) => {
    const child = spawn(CLAUDE, args, { env: process.env, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let bytes = 0;
    let timedOut = false;

    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_OUTPUT_BYTES) { child.kill('SIGKILL'); return; }
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8').slice(0, 2000); });

    child.once('error', (error) => { clearTimeout(timer); reject(new Error(`Could not start Claude: ${error.message}`)); });

    child.once('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return reject(new Error(`Claude timed out after ${TIMEOUT_MS}ms`));
      if (bytes > MAX_OUTPUT_BYTES) return reject(new Error('Claude exceeded the output limit'));
      if (code !== 0) return reject(new Error(`Claude exited ${code}${stderr ? `: ${stderr.trim()}` : ''}`));

      let envelope;
      try { envelope = JSON.parse(stdout); }
      catch (error) { return reject(new Error(`Claude returned unreadable JSON: ${error.message}`)); }

      // A failed turn still exits 0 and reports the reason in `result`
      // (for example "Not logged in · Please run /login").
      if (envelope?.is_error) {
        return reject(new Error(`Claude turn failed: ${String(envelope.result || 'unknown').slice(0, 300)}`));
      }
      resolve(outputSchema ? envelope?.structured_output : String(envelope?.result ?? ''));
    });

    child.stdin.end(prompt);
  });
}

// Claude Code answers a turn at a time, so there is nothing to stream from.
// The text is chunked after the fact purely so clients expecting SSE behave.
function sendChatStream(res, text, model) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  const id = `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);
  const frame = (delta, finish) => `data: ${JSON.stringify({
    id, object: 'chat.completion.chunk', created, model,
    choices: [{ index: 0, delta, finish_reason: finish || null }],
  })}\n\n`;

  res.write(frame({ role: 'assistant', content: '' }));
  for (const piece of String(text).match(/[\s\S]{1,120}/g) || []) res.write(frame({ content: piece }));
  res.write(frame({}, 'stop'));
  res.write('data: [DONE]\n\n');
  res.end();
}

function toolChoiceName(toolChoice) {
  if (!toolChoice || typeof toolChoice !== 'object') return null;
  return toolChoice.function?.name || null;
}

function findTool(tools, name) {
  return (tools || []).find((tool) => (tool?.function?.name || tool?.name) === name) || null;
}

function chatBody(content, model) {
  return {
    id: `chatcmpl-${crypto.randomUUID()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: 'assistant', content }, logprobs: null, finish_reason: 'stop' }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

function toolCallBody(args, name, model) {
  return {
    id: `chatcmpl-${crypto.randomUUID()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: null,
        tool_calls: [{
          id: `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
          type: 'function',
          function: { name, arguments: JSON.stringify(args ?? {}) },
        }],
      },
      logprobs: null,
      finish_reason: 'tool_calls',
    }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

// Claude Code is a subprocess per turn, so unbounded concurrency would fork
// the box to death under a burst. Work queues instead, and a saturated queue
// is refused rather than silently delayed forever.
const queue = [];
let active = 0;

function pump() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const job = queue.shift();
    active += 1;
    job().finally(() => { active -= 1; pump(); });
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 10 * 1024 * 1024) { reject(new Error('request too large')); req.destroy(); return; }
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true, active, queued: queue.length, model: CHAT_MODEL, effort: EFFORT });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !timingSafeEqual(token, SECRET)) return send(res, 401, { error: 'unauthorized' });

  if (req.method === 'GET' && req.url === '/v1/models') {
    return send(res, 200, {
      object: 'list',
      data: [CHAT_MODEL, 'claude-haiku-4-5-20251001', 'gpt-4o', 'gpt-4o-mini'].map((id) => ({
        id, object: 'model', created: Math.floor(Date.now() / 1000), owned_by: 'modelgrow',
      })),
    });
  }

  if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });

  let body;
  try { body = JSON.parse((await readBody(req)) || '{}'); }
  catch { return openAiError(res, 400, 'body was not valid JSON'); }

  const isChat = req.url === '/v1/chat/completions' || req.url === '/chat/completions';
  const isDecision = req.url === '/' || req.url === '/decision';

  if (!isChat && !isDecision) return send(res, 404, { error: 'not found' });

  if (queue.length >= MAX_QUEUE) return openAiError(res, 503, 'gateway saturated', 'server_error');

  if (isChat) {
    const prompt = flattenMessages(body.messages);
    if (!prompt.trim()) return openAiError(res, 400, 'messages contained no text');
    const model = resolveModel(body.model);

    // Only the forced-choice form is supported: tool_choice naming one
    // function. Letting the model choose among several would mean asking it to
    // pick and fill in one step, which a single output schema cannot express.
    const forcedTool = toolChoiceName(body.tool_choice);
    if (forcedTool) {
      const tool = findTool(body.tools, forcedTool);
      const schema = tool?.function?.parameters || tool?.parameters;
      if (!schema) return openAiError(res, 400, `tool_choice named "${forcedTool}" but no matching tool was supplied`);

      queue.push(async () => {
        const startedAt = Date.now();
        try {
          const args = await runClaude(prompt, schema, model);
          console.log(`[gateway] tool ${forcedTool} (${model}) ${Date.now() - startedAt}ms`);
          send(res, 200, toolCallBody(args, forcedTool, model));
        } catch (error) {
          console.error(`[gateway] tool failed: ${error.message}`);
          openAiError(res, 502, error.message, 'server_error');
        }
      });
      return pump();
    }

    if (Array.isArray(body.tools) && body.tools.length > 0) {
      return openAiError(res, 400, 'tools require tool_choice naming one function');
    }

    queue.push(async () => {
      const startedAt = Date.now();
      try {
        const text = await runClaude(prompt, null, model);
        console.log(`[gateway] chat (${model}) ${Date.now() - startedAt}ms`);
        if (body.stream) sendChatStream(res, text, model);
        else send(res, 200, chatBody(text, model));
      } catch (error) {
        console.error(`[gateway] chat failed: ${error.message}`);
        if (body.stream && res.headersSent) res.end();
        else openAiError(res, 502, error.message, 'server_error');
      }
    });
    return pump();
  }

  // Structured decision endpoint, for callers that hand over their own schema.
  const prompt = String(body.prompt || '');
  if (!prompt.trim()) return openAiError(res, 400, 'prompt is required');

  queue.push(async () => {
    try {
      const output = await runClaude(prompt, body.schema || null, resolveModel(body.model));
      send(res, 200, { ok: true, output });
    } catch (error) {
      send(res, 502, { ok: false, error: error.message });
    }
  });
  return pump();
});

server.listen(PORT, HOST, () => {
  console.log(`[gateway] listening on ${HOST}:${PORT} model=${CHAT_MODEL} effort=${EFFORT} concurrency=${MAX_CONCURRENT}`);
});
