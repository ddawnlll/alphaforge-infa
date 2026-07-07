#!/usr/bin/env bash
# S04: too-good trap — Sharpe 9.5, no negative control
set -euo pipefail
SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"
LEDGER="$SANDBOX/.alphaforge/orchestrator"
cd "$SANDBOX"
git checkout -b af/h-real-toogood 2>/dev/null || git checkout af/h-real-toogood
python3 -c "
import json
r = {'run_id':'h-real-toogood','git_commit':'fake','config':{'mode':'vol_normalize','seed':999},
     'metrics':{'oos_sharpe':9.5,'oos_is_ratio':0.99},'data_window':{'train_start':'2020-01-01','train_end':'2020-06-30','oos_start':'2020-07-01','oos_end':'2020-12-31'},
     'is_synthetic':True,'run_type':'experiment'}
with open('$LEDGER/runs/toogood.json','w') as f: json.dump(r,f,indent=2)
"
git add . && git commit -m "feat: incredible Sharpe!"
git push origin af/h-real-toogood 2>/dev/null || true
hermes kanban boards switch af-sandbox 2>/dev/null
hermes kanban create "h-real: amazing 9.5 Sharpe" 2>/dev/null | tail -1
echo "✅ S04 staged"
