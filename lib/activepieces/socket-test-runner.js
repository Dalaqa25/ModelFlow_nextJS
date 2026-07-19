import { getActivepiecesBaseUrl } from './client.js';

const SOCKET_PATH = '/api/socket.io';
const DEFAULT_TEST_TIMEOUT_MS = 120000;

function getSocketUrl() {
  const base = new URL(getActivepiecesBaseUrl());
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  base.pathname = SOCKET_PATH;
  base.search = 'EIO=4&transport=websocket';
  base.hash = '';
  return base.toString();
}

function parseSocketIoEventPacket(packet) {
  if (typeof packet !== 'string' || !packet.startsWith('42')) return null;

  try {
    const parsed = JSON.parse(packet.slice(2));
    if (!Array.isArray(parsed) || typeof parsed[0] !== 'string') return null;
    return { event: parsed[0], payload: parsed[1] };
  } catch (_) {
    return null;
  }
}

function isSameFlowVersion(run, flowVersionId) {
  return String(run?.flowVersionId || run?.flow_version_id || '') === String(flowVersionId);
}

function isFinishedRun(run) {
  const status = String(run?.status || '').toUpperCase();
  return Boolean(
    run?.finishTime ||
    run?.finishedAt ||
    ['SUCCEEDED', 'FAILED', 'INTERNAL_ERROR', 'TIMEOUT', 'STOPPED'].includes(status)
  );
}

export async function runActivepiecesBuilderTestFlow({
  token,
  projectId,
  flowVersionId,
  timeoutMs = DEFAULT_TEST_TIMEOUT_MS,
}) {
  if (!token) throw new Error('Missing ModelGrow Builder auth token');
  if (!projectId) throw new Error('Missing ModelGrow Builder project');
  if (!flowVersionId) throw new Error('Missing builder flow version');
  if (typeof WebSocket !== 'function') {
    throw new Error('This Node runtime does not support WebSocket');
  }

  const socketUrl = getSocketUrl();

  return new Promise((resolve, reject) => {
    let socket;
    let initialRun = null;
    let settled = false;
    let authenticated = false;

    const cleanup = () => {
      clearTimeout(timeout);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    const finish = (error, run) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(run);
    };

    const timeout = setTimeout(() => {
      const error = new Error(`ModelGrow Builder test run did not finish within ${Math.round(timeoutMs / 1000)} seconds`);
      error.code = 'ACTIVEPIECES_TEST_RUN_TIMEOUT';
      error.run = initialRun;
      finish(error);
    }, timeoutMs);

    try {
      socket = new WebSocket(socketUrl);
    } catch (error) {
      finish(error);
      return;
    }

    socket.addEventListener('error', () => {
      if (!settled) {
        finish(new Error('Could not connect to ModelGrow Builder test runner socket'));
      }
    });

    socket.addEventListener('close', () => {
      if (!settled) {
        finish(new Error('ModelGrow Builder test runner socket closed before the run finished'));
      }
    });

    socket.addEventListener('message', (event) => {
      const packet = typeof event.data === 'string' ? event.data : String(event.data || '');

      // Engine.IO open packet. Now connect the default Socket.IO namespace with auth.
      if (packet.startsWith('0')) {
        socket.send(`40${JSON.stringify({ token, projectId })}`);
        return;
      }

      // Engine.IO ping packet.
      if (packet === '2') {
        socket.send('3');
        return;
      }

      // Socket.IO namespace connected.
      if (packet.startsWith('40') && !authenticated) {
        authenticated = true;
        socket.send(`42${JSON.stringify(['TEST_FLOW_RUN', { flowVersionId }])}`);
        return;
      }

      // Socket.IO namespace error.
      if (packet.startsWith('44')) {
        let message = 'ModelGrow Builder rejected the test-run socket connection';
        try {
          const parsed = JSON.parse(packet.slice(2));
          message = parsed?.message || parsed?.error || message;
        } catch (_) {}
        finish(new Error(message));
        return;
      }

      const eventPacket = parseSocketIoEventPacket(packet);
      if (!eventPacket) return;

      if (eventPacket.event === 'TEST_FLOW_RUN_STARTED') {
        if (!isSameFlowVersion(eventPacket.payload, flowVersionId)) return;
        initialRun = eventPacket.payload;
        if (isFinishedRun(initialRun)) {
          finish(null, initialRun);
        }
        return;
      }

      if (eventPacket.event === 'UPDATE_RUN_PROGRESS') {
        const run = eventPacket.payload?.flowRun;
        if (!run) return;
        if (initialRun?.id && run.id !== initialRun.id) return;
        if (!initialRun && !isSameFlowVersion(run, flowVersionId)) return;
        initialRun = initialRun || run;
        if (isFinishedRun(run)) {
          finish(null, run);
        }
      }
    });
  });
}
