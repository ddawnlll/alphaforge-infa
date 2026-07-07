#!/usr/bin/env bash
# E2E suite runner: resets sandbox, stages scenario, triggers tick, asserts outcome
# Usage: bash e2e/run-suite.sh
set -euo pipefail

SUITE_DIR="$(cd "$(dirname "$0")" && pwd)"
SCENARIOS=("S01" "S02" "S03" "S04" "S05" "S06" "S07" "S08" "S09" "S10")
RESULTS="$SUITE_DIR/results/$(date +%Y-%m-%d_%H%M).md"
SANDBOX_REPO="/teamspace/studios/this_studio/af-sandbox"

echo "# E2E Test Suite Results" > "$RESULTS"
echo "Date: $(date)" >> "$RESULTS"
echo "Orchestrator model: $(hermes profile show af-orchestrator | grep Model)" >> "$RESULTS"
echo "SOUL version: $(git -C "$SUITE_DIR/.." rev-parse HEAD 2>/dev/null || echo 'unknown')" >> "$RESULTS"
echo "" >> "$RESULTS"
echo "| Scenario | Outcome | Evidence |" >> "$RESULTS"
echo "|---|---|---|" >> "$RESULTS"

PASS=0
FAIL=0

for SCENARIO in "${SCENARIOS[@]}"; do
  echo ""
  echo "═══ $SCENARIO ═══"
  
  # Reset sandbox to pristine state
  bash "$SUITE_DIR/reset.sh" 2>/dev/null || true
  
  # Stage scenario
  if [ -f "$SUITE_DIR/stage/$SCENARIO-stage.sh" ]; then
    bash "$SUITE_DIR/stage/$SCENARIO-stage.sh" 2>&1 || {
      echo "| $SCENARIO | STAGE FAIL | stage script error |" >> "$RESULTS"
      FAIL=$((FAIL+1))
      continue
    }
  fi
  
  # Set sandbox mode running
  sed -i 's/mode: paused/mode: running/' "$SANDBOX_REPO/.alphaforge/orchestrator/control.yaml"
  
  # Trigger one tick
  hermes cron run af-orchestrator-tick 2>&1 | tail -3 || true
  
  # Set sandbox back to paused
  sed -i 's/mode: running/mode: paused/' "$SANDBOX_REPO/.alphaforge/orchestrator/control.yaml"
  
  # Assert outcomes
  ASSERT_RESULT="FAIL"
  ASSERT_EVIDENCE="no assert script"
  if [ -f "$SUITE_DIR/scenarios/$SCENARIO.yaml" ]; then
    ASSERT_RESULT=$(bash "$SUITE_DIR/assert.sh" "$SCENARIO" 2>&1 || echo "ASSERT FAIL")
    ASSERT_EVIDENCE="$ASSERT_RESULT"
  fi
  
  echo "| $SCENARIO | $ASSERT_RESULT | $ASSERT_EVIDENCE |" >> "$RESULTS"
  if echo "$ASSERT_RESULT" | grep -q "PASS"; then
    PASS=$((PASS+1))
  else
    FAIL=$((FAIL+1))
  fi
done

echo "" >> "$RESULTS"
echo "**Score: $PASS/$((PASS+FAIL))**" >> "$RESULTS"
echo "" >> "$RESULTS"
echo "Suite complete: $PASS passed, $FAIL failed"
echo "Results: $RESULTS"
