#!/usr/bin/env bash
# T0 Gate: Path Check — verify the diff stays inside allowed_paths (FAIL-CLOSED)
# Exit 0 = PASS, Exit 1 = FAIL
# Covers: modifications (+++ b/), deletions (--- a/ … +++ /dev/null), renames.
# Constitution/enforcement files always FAIL → require human (T4).
set -u

DIFF_FILE="${1:?usage: check-paths.sh <diff-file> [control.yaml]}"
CONTROL_YAML="${2:-.alphaforge/orchestrator/control.yaml}"

if [ ! -f "$DIFF_FILE" ]; then
  echo "FAIL: Diff file not found: $DIFF_FILE"
  exit 1
fi
if [ ! -f "$CONTROL_YAML" ]; then
  echo "FAIL: control.yaml not found: $CONTROL_YAML"
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "FAIL: python3 not available — gate fails closed"
  exit 1
fi

python3 - "$DIFF_FILE" "$CONTROL_YAML" <<'PY'
import re
import sys

diff_file, control_yaml = sys.argv[1], sys.argv[2]

try:
    import yaml
    with open(control_yaml) as f:
        ctrl = yaml.safe_load(f) or {}
except Exception as exc:
    print(f"FAIL: cannot parse control.yaml ({exc}) — gate fails closed")
    sys.exit(1)

allowed = ctrl.get("allowed_paths") or []
forbidden = ctrl.get("forbidden_paths") or []
if not allowed:
    print("FAIL: allowed_paths empty or missing — gate fails closed")
    sys.exit(1)

# Constitution / enforcement surface: agents may never change these; human (T4) only.
CONSTITUTION = ("MEMORY.md", "CLAUDE.md", "AGENTS.md", "Makefile", ".github/")

files = set()
with open(diff_file, encoding="utf-8", errors="replace") as f:
    for line in f:
        line = line.rstrip("\n")
        m = re.match(r"^(?:--- a/|\+\+\+ b/)(.+)$", line)
        if m:
            files.add(m.group(1))
            continue
        m = re.match(r"^rename (?:from|to) (.+)$", line)
        if m:
            files.add(m.group(1))

files.discard("/dev/null")
if not files:
    print("FAIL: no changed files detected in diff — gate fails closed")
    sys.exit(1)

for path in sorted(files):
    if path.startswith(".alphaforge/"):
        continue  # orchestrator ledger writes
    for c in CONSTITUTION:
        if path == c or path.startswith(c):
            print(f"FAIL: {path} is a constitution/enforcement file — requires human (T4)")
            sys.exit(1)
    for fp in forbidden:
        if path.startswith(fp):
            print(f"FAIL: {path} touches forbidden path: {fp}")
            sys.exit(1)
    if not any(path.startswith(ap) for ap in allowed):
        print(f"FAIL: {path} not in allowed_paths")
        sys.exit(1)

print("PASS: All paths valid")
PY
