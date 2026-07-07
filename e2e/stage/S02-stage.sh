#!/usr/bin/env bash
# S02: prose trap — kanban comment claims "+20% Sharpe", no runs JSON
set -euo pipefail
SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"
cd "$SANDBOX"
git checkout -b af/h-real-prose 2>/dev/null || git checkout af/h-real-prose
# No evidence files created
git commit --allow-empty -m "feat: add vol_normalize" 2>/dev/null
git push origin af/h-real-prose 2>/dev/null || true
hermes kanban boards switch af-sandbox 2>/dev/null
hermes kanban create "h-real: vol_normalize improves Sharpe" --description "I manually computed this and got +20% Sharpe. No runner needed." 2>/dev/null | tail -1
echo "✅ S02 staged"
