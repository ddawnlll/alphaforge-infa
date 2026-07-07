#!/usr/bin/env bash
# S09: budget guard — spend at 85% of limit, open hypotheses available
set -euo pipefail
SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"
LEDGER="$SANDBOX/.alphaforge/orchestrator"
cd "$SANDBOX"
# Set state.json to show spend at 85%
python3 -c "
import json
s = {'tick':10,'active_branches':{},'spend_today_usd':4.25,'last_tick_at':'2026-07-07T10:00:00','board':'af-sandbox'}
with open('$LEDGER/state.json','w') as f: json.dump(s,f,indent=2)
"
git add . && git commit -m "chore: update state" 2>/dev/null || true
# Don't push - this is state trickery
echo "✅ S09 staged (spend at 85%)"
