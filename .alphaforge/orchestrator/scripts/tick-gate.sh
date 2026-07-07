#!/usr/bin/env bash
# Pre-tick gate for AlphaForge orchestrator.
# Thin wrapper that calls the hermes-pack tick-gate.sh with AlphaForge paths.
set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
HERMES_PACK_DIR="${REPO_DIR}/.hermes-pack"

if [ ! -f "${HERMES_PACK_DIR}/templates/scripts/tick-gate.sh" ]; then
  echo '{"wakeAgent": true, "context": {"warning": "hermes-pack submodule not initialized"}}'
  exit 0
fi

# Call canonical tick-gate
exec bash "${HERMES_PACK_DIR}/templates/scripts/tick-gate.sh" "$@"
