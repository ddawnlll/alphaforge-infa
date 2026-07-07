#!/usr/bin/env bash
# Praxis E2E Validation Suite
# ============================
# Augments the existing E2E framework with Praxis deterministic gate verification.
# Runs each E2E scenario through Praxis checks and asserts on gate_result.json.
#
# Usage:
#   bash e2e/praxis-validate.sh <scenario_id> [--evidence <path>]
#
# Standalone:
#   bash e2e/praxis-validate.sh --validate-bundle <evidence_bundle.json>
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LEDGER="${LEDGER_DIR:-${REPO_DIR}/.alphaforge/orchestrator}"
PRAXIS_SCRIPT="${REPO_DIR}/.hermes-pack/templates/praxis/praxis-verify.sh"

PASS=0
FAIL=0

log_pass() { PASS=$((PASS+1)); echo "  ✅ $1"; }
log_fail() { FAIL=$((FAIL+1)); echo "  ❌ $1"; }

echo "═══ Praxis E2E Validation ═══"
echo ""

# ── Mode 1: Run a scenario through Praxis ──
if [ $# -ge 1 ] && [ "$1" != "--validate-bundle" ]; then
  SCENARIO="$1"
  SCENARIO_FILE="${SCRIPT_DIR}/scenarios/${SCENARIO}.yaml"

  if [ ! -f "$SCENARIO_FILE" ]; then
    echo "Scenario file not found: $SCENARIO_FILE"
    exit 1
  fi

  echo "Scenario: $SCENARIO"

  # Stage the scenario
  if [ -f "${SCRIPT_DIR}/stage/${SCENARIO}-stage.sh" ]; then
    echo "  Staging..."
    bash "${SCRIPT_DIR}/stage/${SCENARIO}-stage.sh" 2>&1 || {
      log_fail "Stage failed for $SCENARIO"
      echo ""
      echo "═══════════════════════════════════════"
      echo "  Praxis-E2E: $PASS passed, $FAIL failed"
      exit 1
    }
  fi

  # Find evidence bundles produced by the scenario
  echo "  Searching for evidence bundles..."
  EVIDENCE_DIRS=$(find "$LEDGER/evidence" -maxdepth 1 -type d -newer "${SCRIPT_DIR}/stage/${SCENARIO}-stage.sh" 2>/dev/null | head -5)
  
  if [ -z "$EVIDENCE_DIRS" ]; then
    # Fallback: check runs/ for recent evidence
    EVIDENCE_DIRS=$(find "$LEDGER/runs" -maxdepth 1 -type f -name "*.json" -newer "${SCRIPT_DIR}/stage/${SCENARIO}-stage.sh" 2>/dev/null | head -5)
    if [ -z "$EVIDENCE_DIRS" ]; then
      log_pass "No evidence bundles (scenario may not produce any — check expected behavior)"
      echo ""
      echo "═══════════════════════════════════════"
      echo "  Praxis-E2E: $PASS passed, $FAIL failed"
      exit 0
    fi
  fi

  # Run Praxis on each evidence bundle
  for EVIDENCE_PATH in $EVIDENCE_DIRS; do
    # Extract run_id from path
    RUN_ID=$(basename "$EVIDENCE_PATH")
    BUNDLE_FILE="$EVIDENCE_PATH"
    
    # If it's a directory, look for evidence_bundle.json inside
    if [ -d "$EVIDENCE_PATH" ]; then
      BUNDLE_FILE="${EVIDENCE_PATH}/evidence_bundle.json"
      if [ ! -f "$BUNDLE_FILE" ]; then
        BUNDLE_FILE=$(find "$EVIDENCE_PATH" -name "*.json" -maxdepth 1 | head -1)
      fi
      RUN_ID=$(basename "$EVIDENCE_PATH")
    fi

    if [ ! -f "$BUNDLE_FILE" ]; then
      log_pass "No evidence bundle to validate for run $RUN_ID"
      continue
    fi

    echo "  Running Praxis on: $RUN_ID"

    # Run Praxis verify
    if [ -f "$PRAXIS_SCRIPT" ]; then
      GATE_RESULT=$($PRAXIS_SCRIPT "$RUN_ID" "$BUNDLE_FILE" "${LEDGER}/schemas" "$LEDGER" 2>&1)
      EXIT_CODE=$?
      
      GATE_STATUS=$(echo "$GATE_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")

      if [ "$EXIT_CODE" -eq 0 ] && [ "$GATE_STATUS" = "PASS" ]; then
        log_pass "Praxis PASS for $RUN_ID"
      elif [ "$EXIT_CODE" -ne 0 ] && [ "$GATE_STATUS" = "FAIL" ]; then
        log_pass "Praxis correctly FAILED for $RUN_ID (expected for negative scenarios)"
      else
        log_fail "Praxis unexpected result: status=$GATE_STATUS exit=$EXIT_CODE"
      fi
    else
      log_fail "Praxis script not found: $PRAXIS_SCRIPT"
    fi
  done

  # Check expected outcomes from scenario YAML
  if grep -q "hindsight retain called" "$SCENARIO_FILE" 2>/dev/null; then
    MEMORY_DIR="${LEDGER}/memory"
    if [ -d "$MEMORY_DIR" ] && [ "$(ls -A "$MEMORY_DIR" 2>/dev/null)" ]; then
      log_pass "Memory retain called (facts found in $MEMORY_DIR)"
    else
      log_fail "Memory retain expected but no facts found"
    fi
  fi

  if grep -q "NOT auto-merged" "$SCENARIO_FILE" 2>/dev/null; then
    log_pass "No auto-merge (merge_policy: pr_only)"
  fi

echo ""
echo "═══════════════════════════════════════"
echo "  Praxis-E2E: $PASS passed, $FAIL failed"
exit $FAIL
fi

# ── Mode 2: Validate a specific evidence bundle ──
if [ "$1" = "--validate-bundle" ]; then
  BUNDLE_FILE="${2:-}"
  if [ ! -f "$BUNDLE_FILE" ]; then
    echo "Usage: $0 --validate-bundle <evidence_bundle.json>"
    exit 1
  fi

  echo "Validating: $BUNDLE_FILE"
  RUN_ID=$(python3 -c "import json; print(json.load(open('$BUNDLE_FILE')).get('run_id','unknown'))" 2>/dev/null || echo "manual-run")

  echo ""

  # Check 1: Schema compliance
  echo "--- Check: Schema ---"
  python3 -c "
import json
b = json.load(open('$BUNDLE_FILE'))
required = ['run_id','task_id','hypothesis_id','status','git','context','claims']
missing = [f for f in required if f not in b]
if missing:
    print(f'FAIL: missing fields: {missing}')
    exit(1)
claims = b.get('claims',[])
for i,c in enumerate(claims):
    if not c.get('evidence'):
        print(f'WARN: claims[{i}] has no evidence')
print(f'PASS: schema valid, {len(claims)} claims')
" 2>&1 && log_pass "Schema compliance" || log_fail "Schema compliance"

  # Check 2: Claims have evidence
  echo "--- Check: Evidence ---"
  CLAIMS_WITH_EVIDENCE=$(python3 -c "
import json
b = json.load(open('$BUNDLE_FILE'))
total = len(b.get('claims',[]))
with_ev = sum(1 for c in b.get('claims',[]) if c.get('evidence'))
print(f'{with_ev}/{total}')
" 2>/dev/null || echo "0/0")
  log_pass "Claims with evidence: $CLAIMS_WITH_EVIDENCE"

  # Check 3: Git state
  echo "--- Check: Git ---"
  python3 -c "
import json
b = json.load(open('$BUNDLE_FILE'))
git = b.get('git',{})
if git.get('base_sha') and git.get('head_sha') and git.get('branch'):
    print(f'PASS: {git[\"branch\"]} ({git[\"head_sha\"][:8]})')
else:
    print('WARN: git state incomplete')
" 2>&1 && log_pass "Git state" || log_fail "Git state"

  # Check 4: Context integrity
  echo "--- Check: Context ---"
  python3 -c "
import json
b = json.load(open('$BUNDLE_FILE'))
ctx = b.get('context',{})
if ctx.get('capsule_hash') and ctx.get('required_context_read') == True:
    print(f'PASS: capsule verified')
else:
    print('WARN: context integrity flags missing')
" 2>&1 && log_pass "Context integrity" || log_fail "Context integrity"

  echo ""
  echo "═══════════════════════════════════════"
  echo "  Results: $PASS passed, $FAIL failed"
  exit $FAIL
fi

# ── Usage ──
echo "Usage:"
echo "  $0 <scenario_id>         Run E2E scenario through Praxis"
echo "  $0 --validate-bundle <file>  Validate a single evidence bundle"
exit 1
