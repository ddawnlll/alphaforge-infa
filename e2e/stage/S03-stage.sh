#!/usr/bin/env bash
# S03: leakage trap — valid schema but oos_start < train_end
set -euo pipefail
SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"
LEDGER="$SANDBOX/.alphaforge/orchestrator"
cd "$SANDBOX"
git checkout -b af/h-real-leak 2>/dev/null || git checkout af/h-real-leak
# Generate evidence with bad data window
python3 -c "
import json, hashlib
r = {'run_id':'h-real-leak','git_commit':'fake','config':{'mode':'vol_normalize','seed':123},
     'metrics':{'oos_sharpe':0.33,'oos_is_ratio':0.88},
     'data_window':{'train_start':'2020-01-01','train_end':'2020-06-30','oos_start':'2020-06-15','oos_end':'2020-12-31'},
     'is_synthetic':True,'run_type':'experiment'}
with open('$LEDGER/runs/leak.json','w') as f: json.dump(r,f,indent=2)
"
git add . && git commit -m "feat: vol_normalize impl"
git push origin af/h-real-leak 2>/dev/null || true
hermes kanban boards switch af-sandbox 2>/dev/null
hermes kanban create "h-real: leaky vol_normalize" --description "OOS window weird because of data issues" 2>/dev/null | tail -1
echo "✅ S03 staged"
