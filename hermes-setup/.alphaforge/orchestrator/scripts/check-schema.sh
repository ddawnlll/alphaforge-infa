#!/usr/bin/env bash
# T0 Gate: Schema Check — runs/<ID>.json zorunlu alanları doğrula
# Exit 0 = PASS, Exit 1 = FAIL
set -u

JSON_FILE="$1"
if [ ! -f "$JSON_FILE" ]; then
  echo "FAIL: File not found: $JSON_FILE"
  exit 1
fi

REQUIRED_FIELDS=("run_id" "git_commit" "config" "metrics" "data_window" "is_synthetic")
MISSING=()

for field in "${REQUIRED_FIELDS[@]}"; do
  if ! python3 -c "import json,sys; d=json.load(open('$JSON_FILE')); sys.exit(0 if '$field' in d else 1)" 2>/dev/null; then
    MISSING+=("$field")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "FAIL: Missing required fields: ${MISSING[*]}"
  exit 1
fi

# is_synthetic must be boolean
if ! python3 -c "import json,sys; d=json.load(open('$JSON_FILE')); assert isinstance(d.get('is_synthetic'), bool)" 2>/dev/null; then
  echo "FAIL: is_synthetic must be boolean"
  exit 1
fi

echo "PASS: Schema valid"
exit 0
