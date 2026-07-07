# V7 / AlphaForge — agent rules

## Architecture boundaries (hard)
- AlphaForge (`alphaforge/`): alpha discovery, feature research, hypothesis
  lifecycle, dataset/manifest, research validation, reports, handoff packages.
- Simulation (`simulation/`): economic truth — costs, backtest/simulation
  mechanics, exits, fills/slippage assumptions.
- V7 runtime (`runtime/`, `v7/` policy, exchange, risk): final trade policy,
  execution, exchange connectivity, risk policy. AGENTS NEVER MODIFY THESE
  without explicit human authorization in control.yaml `human_instruction`.
- Constitution files (`MEMORY.md`, `CLAUDE.md`, `AGENTS.md`, `.github/`,
  `Makefile` verification targets): read-only for agents.

## Deterministic runner (real commands)
- Tests (local suite):
  `PYTHONPATH=. python -m pytest lib/tests/ integration/tests/ simulation/tests/ -q --ignore=lib/tests/test_market_data_binance.py`
- Full suite: `make test-all`
- Contract parity: `make check-contracts`
- Import boundaries: `make check-boundaries`
- Experiment run: every experiment task MUST declare its own deterministic
  command that writes JSON to `.alphaforge/orchestrator/runs/<RUN_ID>.json`
  containing at least: `run_id`, `git_commit`, `config`, `metrics`,
  `data_window`, `is_synthetic`. Existing entry points:
  `python train_pipeline.py`, `make pipeline-v0.2`,
  `experiments/run_label_config.py`.
- NOTE: a shared runner wrapper (`python -m alphaforge.orchestrator_run`) does
  NOT exist yet. Building it is standing infrastructure hypothesis `h0-000`
  (priority 0) — until merged, each task card carries its full explicit command.
- Negative control: shuffled-label / permutation run of the same command with
  `--negative-control` semantics; result stored as a second `runs/` JSON.

All metrics used for decisions MUST come from the JSON these commands emit.

## Orchestration
- Control plane: `.alphaforge/orchestrator/control.yaml` (read it first, always).
- Ledger: `hypotheses/`, `runs/`, `reports/` under `.alphaforge/orchestrator/`.
- Work sources: GitHub issues (`gh issue list`; labels `priority:critical`,
  `hard-gate`, `dep:blocked-by`, `domain:*`) and hypothesis YAML files. Nothing
  else generates work.
- Branch naming: `af/<hypothesis-or-issue-id>-<slug>`. One hypothesis = one
  task = one branch. Branches MUST be pushed to origin before judging.
- Merges to main: PR-only, evidence-gated, orchestrator-approved, CI green.
  No exceptions.
- Completion protocol per merged change (v7-engine rules): ACCP-YAML report in
  `reports/`, `v7/docs/roadmap.md` entry, `ai_summary.md` patch when subsystem
  scope changed.
- Memory: `hindsight_retain` every tick outcome; `hindsight_recall` before
  acting on a hypothesis/issue with prior history.
