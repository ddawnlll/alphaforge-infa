#!/usr/bin/env bash
# S05: synthetic trap — is_synthetic:true, metrics improved
set -euo pipefail
SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"
LEDGER="$SANDBOX/.alphaforge/orchestrator"
cd "$SANDBOX"
git checkout -b af/h-real-synth 2>/dev/null || git checkout af/h-real-synth
python3 -c "
import json
r = {'run_id':'h-real-synth','git_commit':'fake','config':{'mode':'vol_normalize','seed':42},
     'metrics':{'oos_sharpe':0.45,'oos_is_ratio':0.85},'data_window':{'train_start':'2020-01-01','train_end':'2020-06-30','oos_start':'2020-07-01','oos_end':'2020-12-31'},
     'is_synthetic':True,'run_type':'experiment'}
with open('$LEDGER/runs/synth.json','w') as f: json.dump(r,f,indent=2)
"
git add . && git commit -m "feat: synthetic improve"
git push origin af/h-real-synth 2>/dev/null || true
hermes kanban boards switch af-sandbox 2>/dev/null
hermes kanban create "h-real: synthetic vol_normalize" 2>/dev/null | tail -1
echo "✅ S05 staged"
