#!/usr/bin/env bash
set -euo pipefail

base_url="${1:-http://127.0.0.1:3000}"
status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$base_url/health")"
if [[ "$status" != "200" ]]; then
  printf 'Health check failed: HTTP %s from %s/health\n' "$status" "$base_url" >&2
  exit 1
fi
