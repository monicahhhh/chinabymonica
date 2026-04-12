#!/usr/bin/env bash
# Run a command with .env then .env.local loaded (same as dev server).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
set -a
# shellcheck disable=SC1091
[[ -f .env ]] && source .env
# shellcheck disable=SC1091
[[ -f .env.local ]] && source .env.local
set +a
export NODE_OPTIONS="${NODE_OPTIONS:---experimental-global-webcrypto}"
exec "$@"
