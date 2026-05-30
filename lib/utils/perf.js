export function startTimer(label) {
  const startedAt = Date.now();
  return {
    end(extra = {}) {
      const durationMs = Date.now() - startedAt;
      console.log(`[Perf] ${label} ${durationMs}ms`, extra);
      return durationMs;
    },
  };
}

export async function timedFetch(url, options = {}, label = url) {
  const timer = startTimer(`fetch ${label}`);
  try {
    const response = await fetch(url, options);
    timer.end({ status: response.status, ok: response.ok });
    return response;
  } catch (error) {
    timer.end({ error: error?.message || 'unknown error' });
    throw error;
  }
}
