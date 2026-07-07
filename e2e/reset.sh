#!/usr/bin/env bash
# Reset af-sandbox to pristine state (idempotent)
set -euo pipefail

SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"

# Reset control.yaml to paused
sed -i 's/mode:.*/mode: paused/' "$SANDBOX/.alphaforge/orchestrator/control.yaml" 2>/dev/null || true

# Reset state.json
cat > "$SANDBOX/.alphaforge/orchestrator/state.json" << 'EOF'
{
  "tick": 0,
  "active_branches": {},
  "spend_today_usd": 0,
  "last_tick_at": null,
  "board": "af-sandbox"
}
EOF

# Clean runs, reports, decisions, debates
rm -f "$SANDBOX/.alphaforge/orchestrator/runs/"*.json
rm -f "$SANDBOX/.alphaforge/orchestrator/reports/"*.md
rm -f "$SANDBOX/.alphaforge/orchestrator/decisions/"*.md
rm -f "$SANDBOX/.alphaforge/orchestrator/debates/"*.md

# Reset hypotheses
cp "$SANDBOX/.alphaforge/orchestrator/hypotheses/seed.yaml" "$SANDBOX/.alphaforge/orchestrator/hypotheses/seed.yaml.bak" 2>/dev/null || true
cat > "$SANDBOX/.alphaforge/orchestrator/hypotheses/seed.yaml" << 'YAML'
hypotheses:
  - id: "h-real"
    family: "feature_engineering"
    statement: "Volatility normalization improves SMA-crossover OOS Sharpe by >=10%."
    prediction: "OOS Sharpe vol_normalize > baseline * 1.10"
    priority: 1
    status: "open"
  - id: "h-null"
    family: "feature_engineering"
    statement: "Decoy feature produces no measurable improvement."
    prediction: "OOS Sharpe decoy <= baseline + 0.05"
    priority: 2
    status: "open"
YAML

# Clean git branches (delete all af/ branches)
git -C "$SANDBOX" checkout main 2>/dev/null || true
git -C "$SANDBOX" branch -D af/h-real-volnorm 2>/dev/null || true
git -C "$SANDBOX" branch -D af/h-null-decoy 2>/dev/null || true
git -C "$SANDBOX" branch -D af/268-prune 2>/dev/null || true

echo "✅ Sandbox reset to pristine state"
