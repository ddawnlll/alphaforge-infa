# V7 / AlphaForge — agent rules

## Architecture boundaries (hard)
- AlphaForge (`alphaforge/`): alpha discovery, feature research, hypothesis
  lifecycle, dataset/manifest, research validation, reports, handoff packages.
- Simulation (`simulation/`): economic truth — costs, backtest/simulation
  mechanics, exits, fills/slippage assumptions.
- V7 runtime (`runtime/`, `v7/` policy, exchange, risk): final trade policy,
  execution, exchange connectivity, risk policy. AGENTS NEVER MODIFY THESE
  without explicit human authorization in control.yaml `human_instruction`.

## Deterministic runner
```bash
# Standard experiment (baseline / feature test):
python -m toyalpha.run --mode <mode> --seed <seed> --out .alphaforge/orchestrator/runs/<RUN_ID>.json

# Modes:
#   baseline       — SMA crossover, no feature engineering
#   vol_normalize  — baseline + volatility normalization (h-real)
#   decoy          — baseline + decoy feature (h-null)

# Negative control (trivial zero returns, for reproducibility testing):
python -m toyalpha.run --mode baseline --seed <seed> --negative-control --out <path>

# Determinism check:
diff <(python -m toyalpha.run --mode baseline --seed 123 --out /dev/null --json) \
     <(python -m toyalpha.run --mode baseline --seed 123 --out /dev/null --json)
# → identical JSON output for same seed

# Tests:
python -m pytest lib/tests/ toyalpha/tests/ -v --tb=short
```

All metrics used for decisions MUST come from the JSON these commands emit.
Evidence schema: `run_id, git_commit, config, metrics (non-empty), data_window, is_synthetic (bool)`.

## Orchestration
- Control plane: `.alphaforge/orchestrator/control.yaml` (read it first, always).
- Ledger: hypotheses/, runs/, reports/ under `.alphaforge/orchestrator/`.
- Branch naming: `af/<hypothesis-id>-<slug>`. One hypothesis = one branch.
- Merges to main: PR-only, evidence-gated, orchestrator-approved. No exceptions.
- Tri-gate: A (Proposer) proposes, B (Challenger) CONFIRM/OBJECTs, Arbiter (T3) on deadlock, Human (T4) for constitutional issues.
