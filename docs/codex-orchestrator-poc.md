# Codex orchestrator proof

This proof replaces only ModelGrow's conversational decision engine. Existing
authentication, automation handlers, database access, and ActivePieces calls
remain in the ModelGrow backend.

## Local subscription-backed proof

The local proof uses the signed-in Codex CLI through one warm app-server
process. ModelGrow creates an isolated, ephemeral, read-only Codex thread for
each request and forwards the structured response deltas into its SSE chat
stream. It does not expose a shell or repository to chat users.

```env
AI_ORCHESTRATOR_PROVIDER=codex
CODEX_LOCAL_EXECUTION_ENABLED=true
CODEX_APP_SERVER_ENABLED=true
CODEX_MODEL=gpt-5.4-mini
CODEX_REASONING_EFFORT=none
CODEX_TIMEOUT_MS=60000
CODEX_FALLBACK_TO_GROQ=true
```

Local execution is intended for development validation only. It requires the
machine running Next.js to have an authenticated `codex` executable.

## Hosted gateway contract

Vercel should call a private, persistent gateway instead of launching the CLI.

```env
AI_ORCHESTRATOR_PROVIDER=codex
CODEX_GATEWAY_URL=https://private-gateway.example/v1/decision
CODEX_GATEWAY_SECRET=replace-with-a-long-random-secret
CODEX_TIMEOUT_MS=30000
CODEX_FALLBACK_TO_GROQ=true
```

ModelGrow sends:

```json
{
  "prompt": "compact ModelGrow decision prompt",
  "outputSchema": { "type": "object" }
}
```

The gateway returns either the decision directly or under a `decision` key:

```json
{
  "decision": {
    "response": "I’ll look for that automation.",
    "action": {
      "tool": "search_automations",
      "hint": "invoice processing"
    }
  }
}
```

The gateway must require the bearer secret, rate-limit callers, isolate Codex
from application files, and never return Codex stderr or authentication data.
