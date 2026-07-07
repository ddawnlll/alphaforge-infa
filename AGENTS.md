# AlphaForge Infrastructure — Hermes Agent Rules

## Architecture (hard boundaries)
- **Remote server** runs the Hermes gateway, orchestrator, and Hindsight memory.
- **Local machine** is for development, git, and SSH access.
- **Hermes Pack** (`.hermes-pack/` submodule) provides the generic orchestration backbone: bootstrap, adapter system, tri-gate templates, Praxis evidence gate, tick loop, evidence gates. This repo is a deployable AlphaForge-specific instance.
- **Praxis** deterministic evidence gate runs on EVERY worker output before any LLM gate (T1/T2/T3).
- Workers MUST produce structured `evidence_bundle.json` — no free-form agent prose accepted.
- Never commit raw `.env` to the repo — always encrypt first.

## Orchestration
- Control plane: `config/profiles/af-orchestrator.yaml` defines the T1 orchestrator profile.
- Ledger lives in `.alphaforge/orchestrator/`.
- Cron job: `af-orchestrator-tick` fires every 45m.
- **Pre-tick gate:** `.alphaforge/orchestrator/scripts/tick-gate.sh` (checks control.yaml mode + activity)
- **Praxis T0 gate:** `.alphaforge/orchestrator/scripts/praxis-verify.sh` (runs after worker completion)
- Tri-gate: T1 Proposer → T2 Challenger → T3 Arbiter → T4 Human (only after Praxis PASS)

## Hermes Pack Integration
- [Hermes Pack](https://github.com/ddawnlll/hermes-pack) is the generic orchestration backbone, pinned as a git submodule at `.hermes-pack/`.
- Contains the shared bootstrap, templates, adapter system, Praxis schemas/checks/prompts, and the `v7-alphaforge` adapter.
- To re-bootstrap (e.g. after cloning fresh):
  ```bash
  git submodule update --init
  bash .hermes-pack/bootstrap.sh . --adapter v7-alphaforge
  ```

## Praxis Evidence Gate
- **Purpose:** Deterministically verify worker output before any LLM cost.
- **Invoked by:** `.alphaforge/orchestrator/scripts/praxis-verify.sh <run_id>`
- **Validates:** schema compliance, forbidden paths, data lineage, memory integrity, negative controls, metrics sanity, branch push, budget.
- **Output:** `gate_result.json` with PASS/FAIL verdict and next_action.
- **Fail-closed:** Any check error → FAIL. Never "pass silently."
- **Canonical implementations:** `hermes-pack/templates/praxis/` (wrappers in this repo call those).
- **Schemas:** `.alphaforge/orchestrator/schemas/*.schema.json` (canonical for this deployment).

## Context Capsule System
- Every worker task is packaged into a **Context Capsule** (structured YAML/JSON).
- Capsule includes: bounded objective, allowed/forbidden paths, required_context, acceptance criteria.
- Workers are NOT given full repo context — only the capsule.
- Workers MUST read all `required_context` before acting.
- Workers output structured `evidence_bundle.json` — not free prose.

## Related Repositories
- **Hermes Pack** (upstream): generic orchestration backbone — adapter system, tri-gate templates, Praxis gate, bootstrap, tick loop, evidence gates.
- **AlphaForge Infra** (this repo): AlphaForge-specific deployment, remote config, E2E harness, Mission Control wiring. Uses Hermes Pack's `v7-alphaforge` adapter.
- **DesignForge**: standalone design intelligence engine (uses hermes-pack `designforge` adapter)
- **af-sandbox**: E2E test sandbox
- **Mission Control**: desktop UI (hermes-agent-desktop fork)

## Memory Policy
- **Workers CANNOT write to canonical memory.** Ever. Period.
- **T1/T2/T3** cannot write to memory — they only produce verdicts.
- **Only orchestrator**, after Praxis PASS + full gate verdict, writes verified memory.
- Hindsight retains evidence-bundle-sourced facts only, never agent prose summaries.

## Deploy
- Use `deploy/remote.sh` for first-time remote setup.
- After deploy, run `deploy/check-status.sh` to verify.

## Memory
- Hindsight (local mode) — knowledge graph + multi-strategy recall.
- Config at `config/hindsight/config.json`.
- LLM provider: Anthropic Claude Sonnet 5 (via `HINDSIGHT_API_LLM_*` env vars).
