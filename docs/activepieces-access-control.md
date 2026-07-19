# Activepieces Access Control

ModelGrow should be the only public entrypoint. Activepieces must behave like a hidden builder/execution engine, not a public standalone SaaS.

## Goals

- No public Activepieces self-signup.
- No public Activepieces self-signin for end users.
- Only ModelGrow-managed users should get Activepieces accounts.
- Builder access should start from ModelGrow, not from a bookmarked Activepieces auth page.

## App-Layer Hardening

This repo now enforces a stricter managed-account rule:

- ModelGrow no longer adopts pre-existing Activepieces accounts.
- If a matching Activepieces account already exists outside ModelGrow, provisioning fails with `ACTIVEPIECES_EXTERNAL_ACCOUNT_EXISTS`.
- `/api/activepieces/launch` issues a short-lived launch cookie and signed launch token before redirecting to Activepieces `/authenticate`.
- `/api/activepieces/launch/verify` validates that launch cookie or signed launch token so a reverse proxy can allow only ModelGrow-initiated builder entry.

## Required Env

```txt
ACTIVEPIECES_SHARED_COOKIE_DOMAIN=.modelgrow.com
ACTIVEPIECES_LAUNCH_SECRET=long-random-secret
ACTIVEPIECES_PROXY_SHARED_SECRET=long-random-secret
```

`ACTIVEPIECES_LAUNCH_SECRET` should be different from public app secrets. It is used only to mint and verify short-lived builder launch cookies.

## Reverse Proxy Requirement

If `activepieces.modelgrow.com` points directly at the Activepieces container, the subdomain is still public. The missing barrier is the proxy in front of Activepieces.

You should put Nginx or Caddy in front of the Activepieces container and block:

- `GET /sign-up`
- `POST /api/v1/authentication/sign-up`
- `GET /sign-in`
- `POST /api/v1/authentication/sign-in`
- password reset / magic-link auth routes you do not use

Then allow `/authenticate` only when the short-lived ModelGrow launch cookie verifies successfully.

For ModelGrow backend API calls, allow `/api/v1/authentication/sign-in` and `/api/v1/authentication/sign-up` only when a shared secret header is present.

The repo now includes a ready-to-adapt proxy bundle in [deploy/activepieces-proxy](../deploy/activepieces-proxy).

## Example Nginx Pattern

```nginx
server {
  server_name activepieces.modelgrow.com;

  location = /_modelgrow_launch_verify {
    internal;
    proxy_pass https://modelgrow.com/api/activepieces/launch/verify;
    proxy_pass_request_body off;
    proxy_set_header Content-Length "";
    proxy_set_header Cookie $http_cookie;
    proxy_set_header X-Original-URI $request_uri;
  }

  location = /authenticate {
    auth_request /_modelgrow_launch_verify;
    proxy_pass http://127.0.0.1:8080;
  }

  location = /sign-up { return 403; }
  location = /sign-in { return 403; }
  location = /forgot-password { return 403; }

  location = /api/v1/authentication/sign-up { return 403; }
  location = /api/v1/authentication/sign-in { return 403; }

  location / {
    proxy_pass http://127.0.0.1:8080;
  }
}
```

Assumptions:

- ModelGrow app is reachable at `https://modelgrow.com`
- Activepieces container listens on `127.0.0.1:8080`
- DNS for `activepieces.modelgrow.com` points to the proxy host

## Practical Result

After this is applied:

- strangers cannot create free Activepieces accounts on your subdomain
- ModelGrow users still enter via `/builder` -> `/api/activepieces/launch`
- ModelGrow controls who gets a managed Activepieces account
- outside-created Activepieces accounts are rejected instead of being silently adopted
