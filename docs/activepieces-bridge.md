# Activepieces Bridge

ModelGrow uses Activepieces as the hidden OAuth + execution engine.

## Target Architecture

- `modelgrow.com`: marketplace, users, tokens, dashboard, chat UX.
- Activepieces/Railway instance: builder, OAuth credentials, flow execution, run logs.
- One ModelGrow user maps to one Activepieces account/project.
- Runtime flows are per-user copies of developer/source flows.
- Users spend ModelGrow tokens per run; they do not buy/own automations by default.

## Runtime Flow

```txt
User clicks Run in ModelGrow
-> ModelGrow checks token balance
-> ModelGrow ensures linked Activepieces user/project
-> ModelGrow copies source flow into user's project if needed
-> ModelGrow triggers /api/v1/webhooks/{runtimeFlowId}
-> ModelGrow reads Activepieces run status
-> If successful, ModelGrow deducts tokens and records execution
```

## Database Mapping

`activepieces_user_links`

- Stores one linked Activepieces user/project per ModelGrow user.
- Key fields: `user_id`, `activepieces_user_id`, `activepieces_project_id`, `status`.

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
```

`ACTIVEPIECES_USER_PASSWORD_SECRET` lets ModelGrow deterministically create/sign into linked Activepieces accounts without storing plaintext passwords.

## Safe Rollout

1. Apply `supabase/migrations/create_activepieces_bridge.sql`.
2. Add `ACTIVEPIECES_USER_PASSWORD_SECRET` locally and in Vercel.
3. Call `GET /api/activepieces/health?probe=true` while signed in.
4. Call `POST /api/activepieces/projects/ensure` while signed in.
5. Link one test automation by setting `automations.activepieces_source_flow_id`.
6. Run that automation from ModelGrow.

## Fallback Behavior

`/api/automations/execute` uses Activepieces only when `automations.activepieces_source_flow_id` is set.

Automations without that field still use the legacy `automation-runner` path.
