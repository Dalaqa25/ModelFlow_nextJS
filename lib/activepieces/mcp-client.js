const MCP_TIMEOUT_MS = 15000;
const MCP_PROTOCOL_VERSION = '2025-03-26';

function getMcpUrl() {
  const url = process.env.ACTIVEPIECES_MCP_URL;
  if (!url) {
    throw new Error('ACTIVEPIECES_MCP_URL is not configured');
  }
  return url;
}

function parseSseJson(text) {
  const dataLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trim())
    .filter(Boolean);

  for (let i = dataLines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(dataLines[i]);
    } catch {
      // Try the previous SSE data line.
    }
  }

  throw new Error('MCP returned SSE, but no JSON payload was found');
}

function parseMcpResponse(text, contentType) {
  if (!text) return null;

  if (contentType?.includes('text/event-stream')) {
    return parseSseJson(text);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const preview = text.slice(0, 240);
    throw new Error(`MCP returned non-JSON response: ${preview}`);
  }
}

async function postJsonRpc(payload, { sessionId } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS);

  try {
    const response = await fetch(getMcpUrl(), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json',
        ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const data = parseMcpResponse(text, response.headers.get('content-type'));
    const nextSessionId = response.headers.get('Mcp-Session-Id') || sessionId || null;

    if (!response.ok) {
      const message = data?.error?.message || data?.message || `MCP request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    if (data?.error) {
      const error = new Error(data.error.message || 'MCP JSON-RPC error');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return { data, sessionId: nextSessionId };
  } finally {
    clearTimeout(timeout);
  }
}

export function isMcpConfigured() {
  return Boolean(process.env.ACTIVEPIECES_MCP_URL);
}

export async function initializeMcp() {
  return postJsonRpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: 'modelgrow',
        version: '0.1.0',
      },
    },
  });
}

export async function sendInitialized({ sessionId } = {}) {
  return postJsonRpc({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {},
  }, { sessionId });
}

export async function listMcpTools({ sessionId } = {}) {
  return postJsonRpc({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  }, { sessionId });
}

export async function callMcpTool(name, args = {}, { sessionId } = {}) {
  return postJsonRpc({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name,
      arguments: args,
    },
  }, { sessionId });
}

export async function smokeTestMcp() {
  const initialized = await initializeMcp();

  // Some MCP servers ignore notifications, some return empty responses. Either
  // way, tools/list is the real proof we need.
  try {
    await sendInitialized({ sessionId: initialized.sessionId });
  } catch {
    // Non-fatal for the smoke test.
  }

  const tools = await listMcpTools({ sessionId: initialized.sessionId });
  const toolList = tools.data?.result?.tools || [];

  return {
    protocolVersion: initialized.data?.result?.protocolVersion || null,
    serverInfo: initialized.data?.result?.serverInfo || null,
    sessionIdReceived: Boolean(initialized.sessionId),
    toolCount: toolList.length,
    tools: toolList.map((tool) => ({
      name: tool.name,
      description: tool.description,
    })),
  };
}
