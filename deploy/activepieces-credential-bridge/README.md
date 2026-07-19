# ModelGrow Activepieces credential bridge

This sidecar is the only component allowed to read Activepieces' encrypted
`app_connection` rows. It returns a versioned, short-lived authentication
envelope only to an authenticated ModelGrow native n8n runtime request.

It does **not** store tokens in Supabase, the imported workflow JSON, logs, or
browser state. Supabase stores only the connection's external identifier.
OAuth refresh tokens and provider client secrets remain inside the Activepieces
vault; OAuth is refreshed before the execution envelope is returned.

## Response contract

The bridge normalizes Activepieces connection records into one of five protocol
shapes: `oauth2`, `oauth1`, `basic`, `secret-text`, or `custom`. The runtime uses
that protocol shape to compile a temporary native n8n credential instead of
branching on individual app names.

## Deployment contract

1. Run the sidecar on the same private Docker network as Activepieces and its
   PostgreSQL container.
2. Give it the same `AP_ENCRYPTION_KEY` and PostgreSQL settings as Activepieces.
3. Generate a separate random `MODELGROW_CREDENTIAL_BRIDGE_SECRET` of at least
   32 bytes.
4. Proxy `/__modelgrow/credential-bridge/` to the sidecar through HTTPS.
5. Configure the native n8n runtime with:

   - `ACTIVEPIECES_CREDENTIAL_BRIDGE_ENABLED=true`
   - `ACTIVEPIECES_CREDENTIAL_BRIDGE_URL=https://activepieces.modelgrow.com/__modelgrow/credential-bridge/`
   - `ACTIVEPIECES_CREDENTIAL_BRIDGE_SECRET=<same bridge secret>`

Keep the feature flag disabled until the binding migration and sidecar health
check have passed. Imported workflows fail closed while it is disabled.

If exactly one active connection matches a required piece, the runtime adopts it
and stores the non-secret binding. If several accounts match, execution stops
with `AMBIGUOUS_CONNECTION` instead of guessing which account to use.
