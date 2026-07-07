# AlphaForge Infrastructure — Hermes Agent Rules

## Architecture (hard boundaries)
- **Remote server** runs the Hermes gateway, orchestrator, and Hindsight memory.
- **Local machine** is for development, git, and SSH access.
- **Hermes Pack** (`.hermes-pack/` submodule) provides the generic orchestration backbone: bootstrap, adapter system, tri-gate templates, tick loop, evidence gates. This repo is a deployable AlphaForge-specific instance.
- Never commit raw `.env` to the repo — always encrypt first.

## Orchestration
- Control plane: `config/profiles/af-orchestrator.yaml` defines the T1 orchestrator profile.
- Ledger lives in `.alphaforge/orchestrator/`.
- Cron job: `af-orchestrator-tick` fires every 45m.
- Tri-gate: T1 Proposer → T2 Challenger → T3 Arbiter → T4 Human.

## Hermes Pack Integration
- [Hermes Pack](https://github.com/ddawnlll/hermes-pack) is the generic orchestration backbone, pinned as a git submodule at `.hermes-pack/`.
- Contains the shared bootstrap, templates, adapter system, and the `v7-alphaforge` adapter.
- To re-bootstrap (e.g. after cloning fresh):
  ```bash
  git submodule update --init
  bash .hermes-pack/bootstrap.sh . --adapter v7-alphaforge
  ```

## Related Repositories
- **Hermes Pack** (upstream): generic orchestration backbone — adapter system, tri-gate templates, bootstrap, tick loop, evidence gates.
- **AlphaForge Infra** (this repo): AlphaForge-specific deployment, remote config, E2E harness, Mission Control wiring. Uses Hermes Pack's `v7-alphaforge` adapter.
- **DesignForge**: standalone design intelligence engine (uses hermes-pack `designforge` adapter)
- **af-sandbox**: E2E test sandbox
- **Mission Control**: desktop UI (hermes-agent-desktop fork)

## Deploy
- Use `deploy/remote.sh` for first-time remote setup.
- After deploy, run `deploy/check-status.sh` to verify.

## Memory
- Hindsight (local mode) — knowledge graph + multi-strategy recall.
- Config at `config/hindsight/config.json`.
- LLM provider: Anthropic Claude Sonnet 5 (via `HINDSIGHT_API_LLM_*` env vars).
