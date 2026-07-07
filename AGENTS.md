# AlphaForge Infrastructure — Hermes Agent Rules

## Architecture (hard boundaries)
- **Remote server** runs the Hermes gateway, orchestrator, and Hindsight memory.
- **Local machine** is for development, git, and SSH access.
- **Hermes Pack** (`.hermes-pack/` submodule) provides bootstrap, adapter system, and orchestration profiles.
- **Praxis Truth Kernel** (`ddawnlll/praxis`) is the independent verification layer — called via `tools/praxis-bridge.sh` from hermes-pack.
- Workers MUST produce structured evidence — no free-form agent prose accepted.
- Never commit raw `.env` to the repo — always encrypt first.

## Orchestration
- Control plane: `config/profiles/af-orchestrator.yaml` defines the T1 orchestrator profile.
- Ledger lives in `.alphaforge/orchestrator/`.
- Cron job: `af-orchestrator-tick` fires every 45m.
- **Pre-tick gate:** checks control.yaml mode + activity.
- **Verification:** `praxis verify` (6 gates: SchemaGate → LockGate → EvidenceGate → WiringGate → ExecGate → FinalGate).
- Tri-gate: T1 Proposer → T2 Challenger → T3 Arbiter → T4 Human (only after Praxis PASS).

## Praxis Truth Kernel
- **Repo:** `ddawnlll/praxis` (submodule at `.hermes-pack/tools/praxis/`)
- **CLI:** `praxis verify --plan <planspec.yaml>` — runs all 6 deterministic gates
- **Exit codes:** 0=PASS, 1=HOLD, 2=FAIL, 3=error
- **Purpose:** Verifies agent output against human-approved criteria. NEVER trusts agent claims.
- **Memory policy:** Only orchestrator writes to canonical memory after Praxis PASS + gate verdict.

## Context Capsule System
- Every worker task is packaged into a **Context Capsule** (structured YAML).
- Capsule includes: bounded objective, allowed/forbidden paths, required context, acceptance criteria.
- Workers are NOT given full repo context — only the capsule.
- Workers MUST read all required context before acting.

## Related Repositories
- **Hermes Pack** (upstream): generic orchestration backbone — adapter system, bootstrap, tick loop.
- **Praxis** (upstream): independent Truth Kernel — 6-gate verification pipeline, CLI, Claude Code plugin.
- **AlphaForge Infra** (this repo): AlphaForge-specific deployment, remote config, E2E harness, Mission Control wiring.
- **DesignForge**: standalone design intelligence engine (uses hermes-pack `designforge` adapter).
- **af-sandbox**: E2E test sandbox.
- **Mission Control**: desktop UI (hermes-agent-desktop fork).

## Memory Policy
- **Workers CANNOT write to canonical memory.** Ever.
- **T1/T2/T3** cannot write to memory — they only produce verdicts.
- **Only orchestrator**, after Praxis PASS + full gate verdict, writes verified memory.
- Hindsight retains verified facts only, never agent prose summaries.

## Deploy
- Use `deploy/remote.sh` for first-time remote setup.
- After deploy, run `deploy/check-status.sh` to verify.
