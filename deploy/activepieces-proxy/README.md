# Activepieces Proxy

This proxy sits in front of the Activepieces container and turns `activepieces.modelgrow.com` into a ModelGrow-gated surface instead of a public login page.

## What it does

- redirects HTTP to HTTPS
- blocks public builder signup/signin routes
- allows `/authenticate` only when ModelGrow issued a short-lived launch cookie
- proxies builder traffic through to the automation engine
- injects ModelGrow branding into the builder shell so users do not see upstream product branding
- serves ModelGrow favicon/logo assets to the builder shell

## Current Caddy deployment

The live `activepieces.modelgrow.com` deployment currently reports `server: Caddy`.
Its canonical configuration is checked in as `Caddyfile`. It exposes the native
n8n runtime at `/__modelgrow/native-n8n/*` and returns `410 Gone` for the removed
legacy runner route.

Stock Caddy cannot do Nginx-style HTML response injection without an extra plugin,
so use the container patch script for the current deployment:

```bash
cd /path/to/ModelFlow_nextJS
deploy/activepieces-proxy/apply-activepieces-whitelabel.sh
```

That script patches the running `app` container by:

- injecting `/_modelgrow/brand.js` into `index.html`;
- changing the browser title to `ModelGrow Builder`;
- replacing favicon/logo static assets;
- hiding upstream sidebar noise like Explore, Impact, Leaderboard, Platform Admin, project switcher clutter, and Import.

Run it again after the Activepieces app container is rebuilt or upgraded.

Also run the Caddy lockdown script on the Activepieces host:

```bash
cd /path/to/ModelFlow_nextJS
ACTIVEPIECES_PROXY_SHARED_SECRET=<same secret as ModelGrow> \
  deploy/activepieces-proxy/apply-caddy-lockdown.sh
```

## Files

- `docker-compose.yml`: Nginx proxy + optional Certbot service
- `.env.example`: required environment values
- `nginx/templates/activepieces.conf.template`: templated Nginx config
- `nginx/brand/modelgrow-brand.js`: DOM-level white-label pass for the embedded builder UI

## Required ModelGrow env

Set these in the ModelGrow app environment:

```txt
ACTIVEPIECES_SHARED_COOKIE_DOMAIN=.modelgrow.com
ACTIVEPIECES_LAUNCH_SECRET=<long-random-secret>
NEXT_PUBLIC_APP_URL=https://modelgrow.com
```

## Required proxy env

Copy `.env.example` to `.env` and adjust if needed:

```txt
ACTIVEPIECES_SERVER_NAME=activepieces.modelgrow.com
ACTIVEPIECES_UPSTREAM=http://127.0.0.1:8080
MODELGROW_VERIFY_URL=https://modelgrow.com/api/activepieces/launch/verify
```

## Certificate bootstrap

Start Nginx first so ACME challenge files are reachable:

```bash
docker compose up -d activepieces-proxy
```

Request the certificate:

```bash
docker compose run --rm certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d activepieces.modelgrow.com
```

Restart Nginx after the cert is issued:

```bash
docker compose restart activepieces-proxy
```

## Important note

This proxy must be the public listener for `activepieces.modelgrow.com`.

If DNS points directly to the Activepieces container port, the barrier does not exist.

## White-labeling note

The proxy branding script is the fast no-fork layer. It replaces visible upstream
product strings, swaps common logo/favicon surfaces, and hides non-ModelGrow
navigation such as Explore/Impact/Leaderboard.

For a permanent zero-leak guarantee, keep this proxy layer and also build a
ModelGrow-branded frontend image/fork of the builder app. The proxy protects
production immediately; the fork removes the source strings/assets at build time.
