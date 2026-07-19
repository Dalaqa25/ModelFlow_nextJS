# Activepieces Bridge

ModelGrow uses Activepieces as the OAuth vault and as the execution engine for
workflows authored in ModelGrow Builder. Imported n8n workflows execute in the
private native n8n runtime.

## Target Architecture

- `modelgrow.com`: marketplace, users, tokens, dashboard, chat UX.
- Activepieces/Azure instance: builder, OAuth vault, builder-flow execution, run logs.
- One ModelGrow user maps to one Activepieces account with two project roles.
- The builder project is visible and contains flows the user creates and can publish to ModelGrow.
- The runtime project is hidden and contains only ModelGrow-managed marketplace copies.
- Runtime flows are per-user copies of developer/source flows and must live only in the hidden runtime project.
- Users spend ModelGrow tokens per run; they do not buy/own automations by default.

## Runtime Flow

```txt
User clicks Run in ModelGrow
-> ModelGrow checks token balance
-> ModelGrow ensures linked Activepieces user and hidden runtime project
-> ModelGrow copies source flow into the hidden runtime project if needed
-> ModelGrow triggers /api/v1/webhooks/{runtimeFlowId}
-> ModelGrow reads Activepieces run status
-> If successful, ModelGrow deducts tokens and records execution
```

## Database Mapping

`activepieces_user_links`

- Stores one linked Activepieces user plus builder/runtime project ids per ModelGrow user.
- Key fields: `user_id`, `activepieces_user_id`, `activepieces_builder_project_id`, `activepieces_runtime_project_id`, `status`.
- `activepieces_project_id` is the legacy builder project id and is kept for compatibility.

`activepieces_runtime_flows`

- Stores per-user copied Activepieces flows for ModelGrow automations.
- Key fields: `user_id`, `automation_id`, `activepieces_flow_id`, `activepieces_source_flow_id`.

`automations`

- `activepieces_source_flow_id`: developer/source flow to copy for runtime execution.
- `activepieces_source_project_id`: source project, usually the developer project.
- `activepieces_trigger_type`: currently `webhook`.

## Required Env Vars

```txt
ACTIVEPIECES_MCP_URL=https://activepieces-production-d3ff.up.railway.app/...
ACTIVEPIECES_OWNER_EMAIL=...
ACTIVEPIECES_OWNER_PASSWORD=...
ACTIVEPIECES_USER_PASSWORD_SECRET=long-random-secret
ACTIVEPIECES_SHARED_COOKIE_DOMAIN=.modelgrow.com
ACTIVEPIECES_LAUNCH_SECRET=long-random-secret
```

`ACTIVEPIECES_USER_PASSWORD_SECRET` lets ModelGrow deterministically create/sign into linked Activepieces accounts without storing plaintext passwords.

See [docs/activepieces-access-control.md](./activepieces-access-control.md) for the reverse-proxy barrier that blocks public standalone access to the Activepieces subdomain.

## Safe Rollout

1. Apply `supabase/migrations/create_activepieces_bridge.sql`.
2. Add `ACTIVEPIECES_USER_PASSWORD_SECRET` locally and in Vercel.
3. Call `GET /api/activepieces/health?probe=true` while signed in.
4. Call `POST /api/activepieces/projects/ensure` while signed in.
5. Link one test automation by setting `automations.activepieces_source_flow_id`.
6. Run that automation from ModelGrow.

## Engine Boundary

`/api/automations/execute` dispatches by immutable source type:

- `activepieces_source_flow_id` present: isolated Activepieces runtime copy.
- `activepieces_source_flow_id` absent: imported n8n JSON in the private native
  n8n runtime.

There is no custom executor or legacy credential fallback. Imported workflows
resolve user credentials through the Activepieces bridge immediately before
execution or credential rotation.
