#!/usr/bin/env bash
set -euo pipefail

# Patches the running Activepieces frontend container so the builder shell is
# branded as ModelGrow. This is for the current Caddy-based deployment where
# Caddy cannot inject/replace response bodies without a plugin.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
deploy_dir="${ACTIVEPIECES_DEPLOY_DIR:-${HOME}/activepieces}"
logo_path="${MODELGROW_LOGO_PATH:-${repo_root}/public/logo.png}"
favicon_path="${MODELGROW_FAVICON_PATH:-${repo_root}/public/favicon.ico}"
brand_js_path="${MODELGROW_BRAND_JS_PATH:-${repo_root}/deploy/activepieces-proxy/nginx/brand/modelgrow-brand.js}"

if [[ ! -d "$deploy_dir" ]]; then
  echo "Activepieces deploy dir not found: $deploy_dir" >&2
  exit 1
fi

if [[ ! -f "$logo_path" ]]; then
  echo "ModelGrow logo not found: $logo_path" >&2
  exit 1
fi

if [[ ! -f "$brand_js_path" ]]; then
  echo "Branding script not found: $brand_js_path" >&2
  exit 1
fi

cd "$deploy_dir"

app_container="${ACTIVEPIECES_APP_CONTAINER:-}"
if [[ -z "$app_container" ]]; then
  app_container="$(docker compose ps -q app || true)"
fi
if [[ -z "$app_container" ]]; then
  app_container="$(docker ps --format '{{.ID}} {{.Names}}' | awk '/activepieces.*app|app.*activepieces/ {print $1; exit}')"
fi
if [[ -z "$app_container" ]]; then
  echo "Could not find the Activepieces app container. Set ACTIVEPIECES_APP_CONTAINER." >&2
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

cp "$logo_path" "$tmpdir/modelgrow-logo.png"
cp "$brand_js_path" "$tmpdir/modelgrow-brand.js"
if [[ -f "$favicon_path" ]]; then
  cp "$favicon_path" "$tmpdir/favicon.ico"
fi

python3 - "$tmpdir/modelgrow-logo.png" > "$tmpdir/logo.svg" <<'PY'
import base64
import sys
from pathlib import Path

data = base64.b64encode(Path(sys.argv[1]).read_bytes()).decode()
print(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#f8f5ff"/>
  <image href="data:image/png;base64,{data}" x="12" y="8" width="104" height="110" preserveAspectRatio="xMidYMid meet"/>
</svg>''')
PY

docker cp "$tmpdir/modelgrow-brand.js" "$app_container:/tmp/modelgrow-brand.js"
docker cp "$tmpdir/modelgrow-logo.png" "$app_container:/tmp/modelgrow-logo.png"
docker cp "$tmpdir/logo.svg" "$app_container:/tmp/modelgrow-logo.svg"
if [[ -f "$tmpdir/favicon.ico" ]]; then
  docker cp "$tmpdir/favicon.ico" "$app_container:/tmp/modelgrow-favicon.ico"
fi

docker exec -i "$app_container" sh -s <<'SH'
set -eu

roots=""
for root in /usr/src/app/dist/packages/web /usr/src/app/packages/web /usr/share/nginx/html /app/dist/packages/web /app/packages/web /opt/render/project/src/dist/packages/web; do
  if [ -d "$root" ]; then
    roots="$roots $root"
  fi
done

index_files="$(find $roots -type f -name index.html 2>/dev/null | sort -u || true)"
if [ -z "$index_files" ]; then
  echo "No index.html files found inside app container" >&2
  exit 1
fi

static_dirs="$(printf '%s\n' "$index_files" | sed 's#/index.html$##' | sort -u)"

for dir in $static_dirs; do
  mkdir -p "$dir/_modelgrow"
  cp /tmp/modelgrow-brand.js "$dir/_modelgrow/brand.js"
  cp /tmp/modelgrow-logo.png "$dir/_modelgrow/logo.png"

  # Do not overwrite root logo assets such as /logo.svg or /logo.png.
  # Activepieces also uses those shared assets as generic/fallback icons in the
  # workflow builder. Replacing them makes every node look like ModelGrow.
  # The DOM branding layer swaps only shell/chrome logos to /_modelgrow/logo.png.

  if [ -f /tmp/modelgrow-favicon.ico ]; then
    cp /tmp/modelgrow-favicon.ico "$dir/favicon.ico" 2>/dev/null || true
  fi
done

for file in $index_files; do
  cp "$file" "$file.bak.modelgrow.$(date +%Y%m%d%H%M%S)"
  sed -i \
    -e 's#<title>Activepieces</title>#<title>ModelGrow Builder</title>#g' \
    -e 's#>Activepieces<#>ModelGrow<#g' \
    "$file"

  if ! grep -q '/_modelgrow/brand.js' "$file"; then
    sed -i 's#</head>#<script defer src="/_modelgrow/brand.js"></script></head>#' "$file"
  fi
done

echo "Patched ModelGrow branding into:"
printf '%s\n' "$index_files"
SH

echo "Done. Hard-refresh activepieces.modelgrow.com or open a fresh private window."
