#!/usr/bin/env bash
# T0 Gate: Schema Check — validate required fields in runs/<ID>.json (FAIL-CLOSED)
# Exit 0 = PASS, Exit 1 = FAIL
set -u

JSON_FILE="${1:?usage: check-schema.sh <runs-json-file>}"

if [ ! -f "$JSON_FILE" ]; then
  echo "FAIL: File not found: $JSON_FILE"
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "FAIL: python3 not available — gate fails closed"
  exit 1
fi

python3 - "$JSON_FILE" <<'PY'
import json
import sys

path = sys.argv[1]
try:
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
except Exception as exc:
    print(f"FAIL: invalid JSON ({exc})")
    sys.exit(1)

if not isinstance(d, dict):
    print("FAIL: top-level JSON must be an object")
    sys.exit(1)

REQUIRED = ("run_id", "git_commit", "config", "metrics", "data_window", "is_synthetic")
missing = [k for k in REQUIRED if k not in d]
if missing:
    print(f"FAIL: Missing required fields: {' '.join(missing)}")
    sys.exit(1)

if not isinstance(d["is_synthetic"], bool):
    print("FAIL: is_synthetic must be boolean")
    sys.exit(1)

if not isinstance(d["metrics"], dict) or not d["metrics"]:
    print("FAIL: metrics must be a non-empty object")
    sys.exit(1)

print("PASS: Schema valid")
PY
