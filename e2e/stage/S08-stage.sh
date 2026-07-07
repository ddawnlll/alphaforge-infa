#!/usr/bin/env bash
# S08: unpushed branch — exists locally only
set -euo pipefail
SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"
LEDGER="$SANDBOX/.alphaforge/orchestrator"
cd "$SANDBOX"
git checkout -b af/h-real-local 2>/dev/null || git checkout af/h-real-local
python3 -m toyalpha.run --mode vol_normalize --seed 123 --out "$LEDGER/runs/local.json"
git add . && git commit -m "feat: local vol_normalize"
# DO NOT PUSH — branch stays local only
hermes kanban boards switch af-sandbox 2>/dev/null
hermes kanban create "h-real: local only" --description "Branch exists only here, not pushed" 2>/dev/null | tail -1
echo "✅ S08 staged"
