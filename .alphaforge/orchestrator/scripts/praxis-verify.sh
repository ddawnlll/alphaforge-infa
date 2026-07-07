#!/usr/bin/env bash
# AlphaForge Praxis Verification Gateway
# ========================================
# Thin wrapper that sources the canonical Praxis scripts from the hermes-pack
# submodule and runs them with AlphaForge-specific config.
set -u
set -o pipefail

RUN_ID="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
HERMES_PACK_DIR="${REPO_DIR}/.hermes-pack"
LEDGER_DIR="${REPO_DIR}/.alphaforge/orchestrator"

# Check hermes-pack submodule exists
if [ ! -f "${HERMES_PACK_DIR}/templates/praxis/praxis-verify.sh" ]; then
  echo "[praxis] ERROR: hermes-pack submodule not found at ${HERMES_PACK_DIR}"
  echo "[praxis] Run: git submodule update --init"
  exit 1
fi

# Export env vars for the canonical praxis-verify.sh
export REPO_DIR
export LEDGER_DIR
export EVIDENCE_BUNDLE="${LEDGER_DIR}/evidence/${RUN_ID}/evidence_bundle.json"
export EVIDENCE_SCHEMA="${LEDGER_DIR}/schemas/evidence_bundle.schema.json"
export FORBIDDEN_PATHS="${LEDGER_DIR}/control.yaml"
export BUDGET_CONFIG="${LEDGER_DIR}/control.yaml"
export RISK_LEVEL="${RISK_LEVEL:-low}"

echo "[praxis] AlphaForge Praxis Gate v1"
echo "[praxis] Run: ${RUN_ID}"
echo "[praxis] Hermes Pack: ${HERMES_PACK_DIR}"

# Call canonical praxis-verify.sh
exec bash "${HERMES_PACK_DIR}/templates/praxis/praxis-verify.sh" \
  "$RUN_ID" \
  "$EVIDENCE_BUNDLE" \
  "${LEDGER_DIR}/schemas" \
  "$LEDGER_DIR"
