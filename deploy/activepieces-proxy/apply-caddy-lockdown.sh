#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${ACTIVEPIECES_PROXY_SHARED_SECRET:-}" ]]; then
  echo "ACTIVEPIECES_PROXY_SHARED_SECRET is required" >&2
  exit 1
fi

cd "${HOME}/activepieces"

timestamp="$(date +%Y%m%d%H%M%S)"
cp docker-compose.yml "docker-compose.yml.bak.${timestamp}"
cp Caddyfile "Caddyfile.bak.${timestamp}"

if grep -q '^ACTIVEPIECES_PROXY_SHARED_SECRET=' .env; then
  python3 - <<'PY'
from pathlib import Path
import os

path = Path(".env")
lines = path.read_text().splitlines()
secret = os.environ["ACTIVEPIECES_PROXY_SHARED_SECRET"]
updated = []
for line in lines:
    if line.startswith("ACTIVEPIECES_PROXY_SHARED_SECRET="):
        updated.append(f"ACTIVEPIECES_PROXY_SHARED_SECRET={secret}")
    else:
        updated.append(line)
path.write_text("\n".join(updated) + "\n")
PY
else
  printf '\nACTIVEPIECES_PROXY_SHARED_SECRET=%s\n' "$ACTIVEPIECES_PROXY_SHARED_SECRET" >> .env
fi

python3 - <<'PY'
from pathlib import Path

compose = Path("docker-compose.yml")
text = compose.read_text()
marker = "    env_file: .env\n"
if marker not in text.split("  app:", 1)[0]:
    needle = "    ports:\n      - \"80:80\"\n      - \"443:443\"\n"
    replacement = "    ports:\n      - \"80:80\"\n      - \"443:443\"\n    env_file: .env\n"
    if needle not in text:
        raise SystemExit("Could not find caddy ports block in docker-compose.yml")
    text = text.replace(needle, replacement, 1)
compose.write_text(text)

Path("Caddyfile").write_text("""activepieces.modelgrow.com {
  @blocked_pages path /sign-in /sign-up /forgot-password /explore* /impact* /leaderboard* /community* /templates* /platform*
  respond @blocked_pages 403

  @managed_auth_api {
    path /api/v1/authentication/sign-in /api/v1/authentication/sign-up
    header X-ModelGrow-Proxy-Secret {$ACTIVEPIECES_PROXY_SHARED_SECRET}
  }
  handle @managed_auth_api {
    reverse_proxy app:80
  }

  @blocked_auth_api path /api/v1/authentication/sign-in /api/v1/authentication/sign-up
  respond @blocked_auth_api 403

  @authenticate path /authenticate
  handle @authenticate {
    forward_auth https://www.modelgrow.com {
      uri /api/activepieces/launch/verify
      header_up Host www.modelgrow.com
      header_up X-Original-URI {uri}
      header_up Cookie {header.Cookie}
      header_up X-Forwarded-Host {host}
      header_up X-Forwarded-Proto https
    }
    reverse_proxy app:80
  }

  reverse_proxy app:80
}
""")
PY

docker compose up -d caddy
docker exec activepieces-caddy caddy validate --config /etc/caddy/Caddyfile
docker exec activepieces-caddy caddy reload --config /etc/caddy/Caddyfile

echo "--- docker-compose.yml ---"
sed -n '1,120p' docker-compose.yml
echo "--- Caddyfile ---"
sed -n '1,200p' Caddyfile
