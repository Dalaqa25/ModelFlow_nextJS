# ModelGrow Builder white-label plan

ModelGrow uses the upstream automation engine for the builder, OAuth, connector metadata, and execution. Users and developers should experience this as ModelGrow from start to finish.

## Current production shield

The deployment in front of the builder is the first white-label layer:

- blocks public signup/signin entry points;
- blocks standalone product routes such as Explore, Impact, Leaderboard, Community, Templates, and Platform;
- serves ModelGrow favicon/logo assets;
- injects `/_modelgrow/brand.js` into builder HTML;
- rewrites visible `Activepieces` text to `ModelGrow`;
- swaps obvious product logo images to the ModelGrow logo;
- hides upstream product navigation links.

The live deployment currently uses Caddy. Stock Caddy cannot rewrite proxied HTML
bodies without an additional plugin, so `deploy/activepieces-proxy/apply-activepieces-whitelabel.sh`
patches the running builder app container directly. Run it after deploying or
rebuilding the Activepieces app container.

This is the fastest way to stop upstream branding from leaking without maintaining
a full frontend fork immediately.

## Permanent zero-leak layer

For a hard guarantee, build a ModelGrow-branded frontend image/fork of the builder app:

1. Replace upstream app name constants with `ModelGrow`.
2. Replace logo/favicon/manifest assets with ModelGrow assets.
3. Remove or feature-flag non-ModelGrow product pages:
   - Explore
   - Impact
   - Leaderboard
   - Community
   - Templates marketplace
   - public sign-in/sign-up
4. Keep only:
   - builder canvas;
   - OAuth/connection dialogs;
   - workflow publishing/enabling needed by ModelGrow;
   - runtime/API routes.
5. Keep the proxy in front anyway, because it enforces ModelGrow-only access even if an upstream route reappears after upgrades.

## OAuth consent boundary

Provider OAuth consent screens show the OAuth app that owns the client ID. If
ModelGrow uses Activepieces cloud OAuth apps, the external consent screen can
still say Activepieces even when the ModelGrow UI and builder shell are
white-labeled.

ModelGrow now supports per-piece ModelGrow-owned OAuth apps. Configure them with
`MODELGROW_OAUTH_APPS_JSON`:

```json
{
  "gmail": {
    "clientId": "MODELGROW_GOOGLE_CLIENT_ID",
    "clientSecret": "MODELGROW_GOOGLE_CLIENT_SECRET"
  },
  "google-sheets": {
    "clientId": "MODELGROW_GOOGLE_CLIENT_ID",
    "clientSecret": "MODELGROW_GOOGLE_CLIENT_SECRET"
  },
  "@activepieces/piece-slack": {
    "clientId": "MODELGROW_SLACK_CLIENT_ID",
    "clientSecret": "MODELGROW_SLACK_CLIENT_SECRET",
    "redirectUrl": "https://www.modelgrow.com/api/activepieces/connections/oauth/callback"
  }
}
```

The keys can be the Activepieces piece name (`@activepieces/piece-gmail`) or the
short slug (`gmail`). If `redirectUrl` is omitted, ModelGrow uses:

```txt
${NEXT_PUBLIC_APP_URL}/api/activepieces/connections/oauth/callback
```

That exact redirect URL must be allowed in the provider's OAuth app settings.
For Google, add it under Authorized redirect URIs for the ModelGrow OAuth client.

So the realistic rule is:

- inside ModelGrow and the builder shell: show ModelGrow only;
- external provider consent: show ModelGrow for connectors configured in
  `MODELGROW_OAUTH_APPS_JSON`;
- external provider consent: fall back to managed Activepieces cloud OAuth for
  connectors without ModelGrow-owned credentials.
