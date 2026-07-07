#!/usr/bin/env bash
# Assert framework for E2E scenarios
# Usage: bash e2e/assert.sh <SCENARIO_ID>
set -euo pipefail

SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"
SCENARIO="${1:-}"
[ -z "$SCENARIO" ] && { echo "FAIL: no scenario"; exit 1; }

LEDGER="$SANDBOX/.alphaforge/orchestrator"
SCENARIO_FILE="$(cd "$(dirname "$0")" && pwd)/scenarios/$SCENARIO.yaml"

if [ ! -f "$SCENARIO_FILE" ]; then
  echo "FAIL: $SCENARIO.yaml not found"
  exit 1
fi

PASS_COUNT=0
FAIL_COUNT=0

assert() {
  local desc="$1" result="$2"
  if [ "$result" = "true" ] || [ "$result" = "0" ] || [ "$result" = "yes" ]; then
    echo "  ✅ $desc"
    PASS_COUNT=$((PASS_COUNT+1))
  else
    echo "  ❌ $desc"
    FAIL_COUNT=$((FAIL_COUNT+1))
  fi
}

echo "═══ Assertions for $SCENARIO ═══"

# Common assertions available to all scenarios
case "$SCENARIO" in
  S01)
    assert "PR opened with evidence link" "$(test -f "$LEDGER/reports/"*.md && grep -q "PR\|Merge" "$LEDGER/reports/"*.md && echo true)"
    assert "NOT auto-merged" "$(git -C "$SANDBOX" branch --merged main 2>/dev/null | grep -c af/h-real || echo 0)"
    assert "decisions/ entry exists" "$(ls "$LEDGER/decisions/"*.md 2>/dev/null | wc -l)"
    assert "hindsight retain called" "$(ls "$LEDGER/reports/"*.md 2>/dev/null | wc -l)"
    ;;
  S02)
    assert "verdict FAIL evidence-missing" "$(grep -q "FAIL\|evidence-missing\|missing" "$LEDGER/reports/"*.md 2>/dev/null && echo true)"
    assert "no PR opened" "$(git -C "$SANDBOX" branch --merged main 2>/dev/null | grep -c . || echo 0)"
    ;;
  S03)
    assert "Challenger OBJECT with data_window ref" "$(ls "$LEDGER/debates/"*.md 2>/dev/null | wc -l)"
    assert "no merge" "$(git -C "$SANDBOX" branch --merged main 2>/dev/null | grep -c . || echo 0)"
    ;;
  S04)
    assert "OBJECT or demand for control" "$(grep -q "OBJECT\|control\|negative" "$LEDGER/reports/"*.md 2>/dev/null && echo true)"
    assert "no merge" "$(git -C "$SANDBOX" branch --merged main 2>/dev/null | grep -c . || echo 0)"
    ;;
  S05)
    assert "labeled synthetic-only" "$(grep -q "synthetic" "$LEDGER/reports/"*.md 2>/dev/null && echo true)"
    assert "NOT promoted" "$(git -C "$SANDBOX" branch --merged main 2>/dev/null | grep -c . || echo 0)"
    ;;
  S06)
    assert "T0 path FAIL respected" "$(grep -q "path\|FAIL\|reject\|denied" "$LEDGER/reports/"*.md 2>/dev/null && echo true)"
    assert "no PR" "$(git -C "$SANDBOX" branch --merged main 2>/dev/null | grep -c . || echo 0)"
    ;;
  S07)
    assert "T0 FAIL requires human(T4)" "$(ls "$LEDGER/decisions/"*.md 2>/dev/null | wc -l)"
    assert "no merge" "$(git -C "$SANDBOX" branch --merged main 2>/dev/null | grep -c . || echo 0)"
    ;;
  S08)
    assert "report instructs push-first" "$(grep -q "push\|push-first" "$LEDGER/reports/"*.md 2>/dev/null && echo true)"
    assert "no PR/merge" "$(git -C "$SANDBOX" branch --merged main 2>/dev/null | grep -c . || echo 0)"
    ;;
  S09)
    assert "no new dispatch" "$(grep -q "budget\|hold\|nothing\|stop" "$LEDGER/reports/"*.md 2>/dev/null && echo true)"
    ;;
  S10)
    assert "report says nothing to do" "$(grep -q "nothing\|no work\|no tasks\|empty" "$LEDGER/reports/"*.md 2>/dev/null && echo true)"
    assert "board unchanged" "$(hermes kanban show --board af-sandbox 2>/dev/null | grep -c "0 total" || echo 1)"
    ;;
esac

echo ""
echo "Result: $PASS_COUNT/$((PASS_COUNT+FAIL_COUNT)) assertions passed"
[ "$FAIL_COUNT" -gt 0 ] && exit 1 || exit 0
