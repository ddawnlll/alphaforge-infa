# V7 / AlphaForge — agent rules

## Architecture boundaries (hard)
- AlphaForge: alpha discovery, feature research, hypothesis lifecycle,
  dataset/manifest, research validation, reports, handoff packages.
- Simulation: economic truth — costs, backtest/simulation mechanics, exits,
  fills/slippage assumptions.
- V7 runtime: final trade policy, execution, exchange connectivity, risk
  policy. AGENTS NEVER MODIFY THESE without explicit human authorization.

## Runner (fill in real commands)
- Tests:            `python -m pytest lib/tests/ toyalpha/tests/ -v --tb=short`
- Experiment run:   `python -m toyalpha.run --mode <mode> --seed <seed> --out .alphaforge/orchestrator/runs/<RUN_ID>.json`
- Negative control: `python -m toyalpha.run --mode baseline --seed <seed> --negative-control --out <path>`
All metrics used for decisions MUST come from the JSON these commands emit.

## Orchestration
- Control plane: `.alphaforge/orchestrator/control.yaml` (read it first, always).
- Ledger: hypotheses/, runs/, reports/ under `.alphaforge/orchestrator/`.
- Branch naming: `af/<hypothesis-id>-<slug>`. One hypothesis = one branch.
- Merges to main: PR-only, evidence-gated, orchestrator-approved. No exceptions.
