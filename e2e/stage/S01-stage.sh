#!/usr/bin/env bash
# Stage S01: Clean PASS — h-real task done, branch pushed, valid evidence, CI green
set -euo pipefail

SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"
LEDGER="$SANDBOX/.alphaforge/orchestrator"

cd "$SANDBOX"

# 1. Create branch
git checkout -b af/h-real-volnorm 2>/dev/null || git checkout af/h-real-volnorm

# 2. Generate valid evidence
python3 -m toyalpha.run --mode baseline --seed 123 --out "$LEDGER/runs/baseline.json"
python3 -m toyalpha.run --mode vol_normalize --seed 123 --out "$LEDGER/runs/vol_normalize.json"
python3 -m toyalpha.run --mode vol_normalize --seed 123 --negative-control --out "$LEDGER/runs/neg_control.json"

# 3. Create a small code change (valid feature change)
mkdir -p toyalpha/features
cat > toyalpha/features/__init__.py << 'PYEOF'
from .vol import vol_normalize
from .decoy import decoy_feature
PYEOF

git add toyalpha/features/__init__.py
git commit -m "feat: add vol_normalize feature module"

# 4. Push to origin
git push origin af/h-real-volnorm 2>/dev/null || true

# 5. Create kanban task for h-real
hermes kanban boards switch af-sandbox 2>/dev/null
hermes kanban create "h-real: Volatility normalization improves OOS Sharpe by >=10%" \
  --description "Hypothesis h-real: test vol_normalize on SMA-crossover. Evidence: $LEDGER/runs/vol_normalize.json" \
  --assign af-orchestrator \
  --tag hypothesis:h-real 2>/dev/null || true

# 6. Mark task done
hermes kanban complete "$(hermes kanban list 2>/dev/null | grep h-real | head -1 | awk '{print $1}')" 2>/dev/null || true

echo "✅ S01 staged: clean PASS scenario ready"
