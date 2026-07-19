# Imported workflow credential bridge

This bridge lets an imported n8n workflow reuse a user's app connection created
through ModelGrow Builder OAuth. The imported JSON never receives or stores an
OAuth token. The browser never sees one either.

## Execution path

1. ModelGrow detects supported credential requirements from the imported
   workflow's node and credential types.
2. The user connects the required app through the existing ModelGrow Builder
   OAuth screen.
3. Supabase stores only a binding from the workflow credential slot to the
   Activepieces connection identifier.
4. Immediately before a run or credential rotation, the private native n8n runtime asks
   the private credential bridge for that exact connection.
5. The bridge reads and decrypts the connection inside the Activepieces private
   network, refreshes it if necessary, and returns a versioned authentication
   envelope to the authenticated runner request. OAuth refresh tokens and
   provider client secrets never leave the bridge.
6. The native runtime compiles OAuth2, OAuth1, Basic, secret-text, or custom auth into a
   temporary native n8n credential. The credential is attached by ID, used for
   one execution, and deleted with the temporary workflow afterward.

## Credential discovery

Google Sheets, Google Drive, Gmail, Slack, and LinkedIn retain explicit aliases
for exported workflows that omit their credential blocks. For any exported n8n
node that includes a credential type, the runner also derives the connector and
Activepieces piece identity from workflow metadata. This removes the old
five-connector execution ceiling.

Where n8n and Activepieces use different connector identifiers or incompatible
custom field names, add a reusable connector alias/credential adapter. Never
add automation-specific credential code.

## Safe rollout order

1. Apply `20260715090000_add_user_automation_connection_bindings.sql`.
2. Deploy the credential bridge beside Activepieces PostgreSQL on its private
   Docker network.
3. Confirm the bridge `/health` endpoint through the protected reverse-proxy
   route.
4. Set the same random bridge secret on the sidecar and native n8n runtime.
5. Set a separate `NATIVE_N8N_RUNTIME_SHARED_SECRET` on ModelGrow and the runtime.
6. Enable `ACTIVEPIECES_CREDENTIAL_BRIDGE_ENABLED=true` in ModelGrow and the
   runtime.
7. Test one imported workflow with a non-production account before expanding
   access.

## Kill switch

Set `ACTIVEPIECES_CREDENTIAL_BRIDGE_ENABLED=false` in ModelGrow and the runner.
Imported workflows fail closed and do not execute. There is no legacy token
fallback.

## Security boundaries

- Do not make the bridge port public.
- Do not reuse the Activepieces encryption key as the bridge shared secret.
- Do not log request or response bodies on the bridge or native runtime.
- OAuth refresh tokens and provider client secrets stay inside Activepieces.
- Authentication envelopes exist only in runner memory and native n8n's
  temporary credential store for the duration of one execution.
- A missing or ambiguous connection must stop execution; never guess between
  multiple connected accounts.
- Supabase contains identifiers only. Activepieces remains the credential vault.
