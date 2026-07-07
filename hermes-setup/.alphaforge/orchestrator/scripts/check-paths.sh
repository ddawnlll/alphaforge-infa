#!/usr/bin/env bash
# T0 Gate: Path Check — diff'in allowed_paths içinde kaldığını doğrula
# Exit 0 = PASS, Exit 1 = FAIL
set -u

DIFF_FILE="$1"
CONTROL_YAML="${2:-.alphaforge/orchestrator/control.yaml}"

if [ ! -f "$DIFF_FILE" ]; then
  echo "FAIL: Diff file not found: $DIFF_FILE"
  exit 1
fi
if [ ! -f "$CONTROL_YAML" ]; then
  echo "FAIL: control.yaml not found: $CONTROL_YAML"
  exit 1
fi

# Read allowed_paths from control.yaml
ALLOWED=$(python3 -c "
import yaml, sys
with open('$CONTROL_YAML') as f:
    d = yaml.safe_load(f)
for p in d.get('allowed_paths', []):
    print(p)
" 2>/dev/null)

FORBIDDEN=$(python3 -c "
import yaml, sys
with open('$CONTROL_YAML') as f:
    d = yaml.safe_load(f)
for p in d.get('forbidden_paths', []):
    print(p)
" 2>/dev/null)

# Parse diff for changed files
while IFS= read -r line; do
  # Skip headers and context lines, get filenames from diff
  [[ "$line" != "+++ b/"* ]] && continue
  FILE="${line#+++ b/}"
  
  # Check forbidden paths first
  for fp in $FORBIDDEN; do
    if [[ "$FILE" == "$fp"* ]]; then
      echo "FAIL: $FILE touches forbidden path: $fp"
      exit 1
    fi
  done
  
  # If allowed_paths is not empty, check if file is under allowed
  if [ -n "$ALLOWED" ]; then
    FOUND=0
    for ap in $ALLOWED; do
      if [[ "$FILE" == "$ap"* ]]; then
        FOUND=1
        break
      fi
    done
    if [ "$FOUND" -eq 0 ]; then
      # Constitution files are always allowed
      case "$FILE" in
        AGENTS.md|MEMORY.md|CLAUDE.md|.alphaforge/*) FOUND=1 ;;
      esac
    fi
    if [ "$FOUND" -eq 0 ]; then
      echo "FAIL: $FILE not in allowed_paths"
      exit 1
    fi
  fi
done < <(grep "^+++ b/" "$DIFF_FILE" 2>/dev/null || echo "")

echo "PASS: All paths valid"
exit 0
