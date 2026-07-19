import { spawn } from 'node:child_process';

const MAX_LINE_BYTES = 2_000_000;
const STDERR_TAIL_BYTES = 16_000;
const GLOBAL_CLIENT_KEY = Symbol.for('modelgrow.codexAppServerClient');
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;
const DEFAULT_MAX_SESSIONS = 200;
const BARE_FEATURES = [
  'apps',
  'auth_elicitation',
  'browser_use',
  'browser_use_external',
  'browser_use_full_cdp_access',
  'code_mode_host',
  'computer_use',
  'goals',
  'guardian_approval',
  'hooks',
  'image_generation',
  'in_app_browser',
  'multi_agent',
  'plugin_sharing',
  'plugins',
  'remote_plugin',
  'shell_snapshot',
  'shell_tool',
  'skill_mcp_dependency_install',
  'tool_call_mcp_elicitation',
  'tool_suggest',
  'unified_exec',
  'workspace_dependencies',
];

function appServerExecutable() {
  return process.env.CODEX_EXECUTABLE?.trim() || 'codex';
}

function appServerArgs() {
  const args = ['app-server', '--stdio'];
  if (!/^(0|false|no|off)$/i.test(process.env.CODEX_BARE_MODE || 'true')) {
    for (const feature of BARE_FEATURES) args.push('--disable', feature);
    args.push('-c', 'project_doc_max_bytes=0');
    args.push('-c', 'tools.web_search=false');
    args.push('-c', 'tools.view_image=false');
  }
  return args;
}

function turnFailureMessage(turn) {
  const detail = turn?.error?.message || turn?.error?.additionalDetails || turn?.error?.codexErrorInfo;
  return detail ? `Codex turn failed: ${String(detail)}` : `Codex turn ended with status ${turn?.status || 'unknown'}`;
}

class CodexAppServerClient {
  constructor() {
    this.child = null;
    this.readyPromise = null;
    this.nextRequestId = 0;
    this.stdoutBuffer = '';
    this.stderrTail = '';
    this.pendingRequests = new Map();
    this.turnsByThreadId = new Map();
    this.sessions = new Map();
    this.sessionQueues = new Map();
  }

  async ensureReady() {
    if (this.child && this.readyPromise) return this.readyPromise;

    this.child = spawn(appServerExecutable(), appServerArgs(), {
      env: process.env,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.stdoutBuffer = '';
    this.stderrTail = '';

    this.child.stdout.on('data', chunk => this.handleStdout(chunk));
    this.child.stderr.on('data', chunk => {
      this.stderrTail = `${this.stderrTail}${chunk.toString('utf8')}`.slice(-STDERR_TAIL_BYTES);
      if (/^(1|true|yes|on)$/i.test(process.env.CODEX_APP_SERVER_DEBUG || '')) {
        process.stderr.write(chunk);
      }
    });
    this.child.once('error', error => this.handleExit(new Error(`Could not start Codex app-server: ${error.message}`)));
    this.child.once('exit', (code, signal) => {
      const suffix = this.stderrTail.trim() ? `: ${this.stderrTail.trim().slice(-1000)}` : '';
      this.handleExit(new Error(`Codex app-server exited (${signal || code})${suffix}`));
    });

    this.readyPromise = this.initialize().catch(error => {
      this.child?.kill('SIGKILL');
      throw error;
    });
    return this.readyPromise;
  }

  async initialize() {
    await this.request('initialize', {
      clientInfo: {
        name: 'modelgrow',
        title: 'ModelGrow',
        version: '0.1.0',
      },
      capabilities: {
        experimentalApi: true,
        requestAttestation: false,
      },
    }, 15_000, false);
    this.notify('initialized');
  }

  handleStdout(chunk) {
    this.stdoutBuffer += chunk.toString('utf8');
    if (Buffer.byteLength(this.stdoutBuffer) > MAX_LINE_BYTES) {
      this.child?.kill('SIGKILL');
      return;
    }

    while (true) {
      const newline = this.stdoutBuffer.indexOf('\n');
      if (newline < 0) return;
      const line = this.stdoutBuffer.slice(0, newline).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newline + 1);
      if (!line) continue;

      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }

      if (message.id !== undefined && this.pendingRequests.has(message.id)) {
        const pending = this.pendingRequests.get(message.id);
        this.pendingRequests.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(message.error.message || JSON.stringify(message.error)));
        else pending.resolve(message.result);
        continue;
      }

      this.handleNotification(message);
    }
  }

  handleNotification(message) {
    const threadId = message?.params?.threadId;
    const activeTurn = threadId ? this.turnsByThreadId.get(threadId) : null;
    if (!activeTurn) return;

    if (message.method === 'item/agentMessage/delta') {
      if (activeTurn.turnId && message.params.turnId !== activeTurn.turnId) return;
      activeTurn.rawText += message.params.delta || '';
      activeTurn.onDelta?.(message.params.delta || '', activeTurn.rawText);
      return;
    }

    if (message.method === 'item/completed' && message.params?.item?.type === 'agentMessage') {
      if (activeTurn.turnId && message.params.turnId !== activeTurn.turnId) return;
      activeTurn.finalText = message.params.item.text || activeTurn.rawText;
      return;
    }

    if (message.method === 'turn/completed') {
      const turn = message.params.turn;
      if (activeTurn.turnId && turn?.id !== activeTurn.turnId) return;
      this.finishTurn(threadId, turn);
    }
  }

  finishTurn(threadId, turn) {
    const activeTurn = this.turnsByThreadId.get(threadId);
    if (!activeTurn) return;
    this.turnsByThreadId.delete(threadId);
    clearTimeout(activeTurn.timer);

    if (turn?.status === 'completed') {
      activeTurn.resolve(activeTurn.finalText || activeTurn.rawText);
    } else {
      activeTurn.reject(new Error(turnFailureMessage(turn)));
    }
  }

  handleExit(error) {
    if (!this.child && !this.readyPromise) return;
    this.child = null;
    this.readyPromise = null;
    this.stdoutBuffer = '';

    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingRequests.clear();

    for (const activeTurn of this.turnsByThreadId.values()) {
      clearTimeout(activeTurn.timer);
      activeTurn.reject(error);
    }
    this.turnsByThreadId.clear();
    this.sessions.clear();
    this.sessionQueues.clear();
  }

  pruneSessions(now = Date.now()) {
    const configuredTtl = Number.parseInt(process.env.CODEX_SESSION_TTL_MS || '', 10);
    const configuredMax = Number.parseInt(process.env.CODEX_MAX_SESSIONS || '', 10);
    const ttlMs = Number.isFinite(configuredTtl) && configuredTtl > 0
      ? configuredTtl
      : DEFAULT_SESSION_TTL_MS;
    const maxSessions = Number.isFinite(configuredMax) && configuredMax > 0
      ? configuredMax
      : DEFAULT_MAX_SESSIONS;

    for (const [key, session] of this.sessions) {
      if (now - session.lastUsedAt > ttlMs) this.sessions.delete(key);
    }

    if (this.sessions.size <= maxSessions) return;
    const oldest = [...this.sessions.entries()]
      .sort((left, right) => left[1].lastUsedAt - right[1].lastUsedAt)
      .slice(0, this.sessions.size - maxSessions);
    for (const [key] of oldest) this.sessions.delete(key);
  }

  request(method, params, timeoutMs = 15_000, ensureReady = true) {
    if (ensureReady && (!this.child || !this.readyPromise)) {
      return this.ensureReady().then(() => this.request(method, params, timeoutMs, false));
    }
    if (!this.child?.stdin?.writable) {
      return Promise.reject(new Error('Codex app-server is not writable'));
    }

    const id = ++this.nextRequestId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Codex app-server ${method} timed out`));
      }, timeoutMs);
      this.pendingRequests.set(id, { resolve, reject, timer });
      this.child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
    });
  }

  notify(method, params) {
    if (!this.child?.stdin?.writable) return;
    const message = params === undefined ? { method } : { method, params };
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  async prepareSession({ sessionKey, baseInstructions, model, reasoningEffort, serviceTier, cwd }) {
    if (!sessionKey) return false;
    await this.ensureReady();
    const now = Date.now();
    this.pruneSessions(now);
    const fingerprint = JSON.stringify({ model, reasoningEffort, serviceTier: serviceTier || null });
    const existing = this.sessions.get(sessionKey);
    if (existing?.fingerprint === fingerprint) {
      existing.lastUsedAt = now;
      return false;
    }
    if (existing) this.sessions.delete(sessionKey);

    const threadResult = await this.request('thread/start', {
      model,
      cwd,
      approvalPolicy: 'never',
      sandbox: 'read-only',
      ephemeral: true,
      environments: [],
      config: {
        project_doc_max_bytes: 0,
        tools: {
          web_search: false,
          view_image: false,
        },
      },
      baseInstructions,
    });
    const threadId = threadResult?.thread?.id;
    if (!threadId) throw new Error('Codex app-server did not return a thread id while prewarming');
    this.sessions.set(sessionKey, {
      threadId,
      fingerprint,
      lastUsedAt: now,
      hasTurn: false,
    });
    return true;
  }

  runTurn(options) {
    const sessionKey = options?.sessionKey;
    if (!sessionKey) return this.executeTurn(options);

    const previous = this.sessionQueues.get(sessionKey) || Promise.resolve();
    const queued = previous
      .catch(() => {})
      .then(() => this.executeTurn(options));
    this.sessionQueues.set(sessionKey, queued);
    return queued.finally(() => {
      if (this.sessionQueues.get(sessionKey) === queued) {
        this.sessionQueues.delete(sessionKey);
      }
    });
  }

  async executeTurn({
    prompt,
    initialPrompt,
    baseInstructions,
    sessionKey,
    skipIfWarm = false,
    outputSchema,
    model,
    reasoningEffort,
    serviceTier,
    cwd,
    timeoutMs,
    onDelta,
  }) {
    const startedAt = Date.now();
    await this.ensureReady();
    const readyAt = Date.now();

    this.pruneSessions(startedAt);
    const sessionFingerprint = JSON.stringify({ model, reasoningEffort, serviceTier: serviceTier || null });
    let session = sessionKey ? this.sessions.get(sessionKey) : null;
    if (session?.fingerprint !== sessionFingerprint) {
      this.sessions.delete(sessionKey);
      session = null;
    }
    if (skipIfWarm && session?.hasTurn) return null;

    let threadResult;
    if (!session) {
      threadResult = await this.request('thread/start', {
        model,
        cwd,
        approvalPolicy: 'never',
        sandbox: 'read-only',
        ephemeral: true,
        environments: [],
        config: {
          project_doc_max_bytes: 0,
          tools: {
            web_search: false,
            view_image: false,
          },
        },
        baseInstructions,
      });
      const newThreadId = threadResult?.thread?.id;
      if (sessionKey && newThreadId) {
        session = {
          threadId: newThreadId,
          fingerprint: sessionFingerprint,
          lastUsedAt: startedAt,
          hasTurn: false,
        };
        this.sessions.set(sessionKey, session);
      }
    }
    const threadStartedAt = Date.now();
    const threadId = session?.threadId || threadResult?.thread?.id;
    if (!threadId) throw new Error('Codex app-server did not return a thread id');
    if (session) session.lastUsedAt = startedAt;

    const resultPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const activeTurn = this.turnsByThreadId.get(threadId);
        this.turnsByThreadId.delete(threadId);
        if (activeTurn?.turnId) {
          this.request('turn/interrupt', { threadId, turnId: activeTurn.turnId }, 5_000).catch(() => {});
        }
        reject(new Error(`Codex timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.turnsByThreadId.set(threadId, {
        resolve,
        reject,
        timer,
        turnId: null,
        rawText: '',
        finalText: '',
        onDelta,
      });
    });

    try {
      const turnResult = await this.request('turn/start', {
        threadId,
        input: [{
          type: 'text',
          text: session?.hasTurn ? prompt : (initialPrompt || prompt),
          text_elements: [],
        }],
        outputSchema,
        effort: reasoningEffort,
        summary: 'none',
        ...(serviceTier ? { serviceTier } : {}),
      });
      if (/^(1|true|yes|on)$/i.test(process.env.CODEX_APP_SERVER_DEBUG || '')) {
        console.log('[AI] Codex app-server accepted turn', {
          readyMs: readyAt - startedAt,
          threadStartMs: threadStartedAt - readyAt,
          turnStartMs: Date.now() - threadStartedAt,
          model,
          reasoningEffort,
          serviceTier: serviceTier || 'default',
          reusedSession: Boolean(session?.hasTurn),
        });
      }
      const activeTurn = this.turnsByThreadId.get(threadId);
      if (activeTurn) activeTurn.turnId = turnResult?.turn?.id || null;
    } catch (error) {
      const activeTurn = this.turnsByThreadId.get(threadId);
      if (sessionKey) this.sessions.delete(sessionKey);
      if (activeTurn) {
        this.turnsByThreadId.delete(threadId);
        clearTimeout(activeTurn.timer);
        activeTurn.reject(error);
      }
    }

    const result = await resultPromise;
    if (session) {
      session.hasTurn = true;
      session.lastUsedAt = Date.now();
    }
    if (/^(1|true|yes|on)$/i.test(process.env.CODEX_APP_SERVER_DEBUG || '')) {
      console.log('[AI] Codex app-server completed turn', {
        totalMs: Date.now() - startedAt,
        generationMs: Date.now() - threadStartedAt,
      });
    }
    return result;
  }

  close() {
    this.child?.kill('SIGTERM');
    this.child = null;
    this.readyPromise = null;
    this.sessions.clear();
    this.sessionQueues.clear();
  }
}

export function getCodexAppServerClient() {
  if (!globalThis[GLOBAL_CLIENT_KEY]) {
    globalThis[GLOBAL_CLIENT_KEY] = new CodexAppServerClient();
  }
  return globalThis[GLOBAL_CLIENT_KEY];
}

export function closeCodexAppServerClient() {
  globalThis[GLOBAL_CLIENT_KEY]?.close();
  delete globalThis[GLOBAL_CLIENT_KEY];
}
