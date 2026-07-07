# AlphaForge Infrastructure — Hermes Agent Rules

## Architecture (hard boundaries)
- **Remote server** runs the Hermes gateway, orchestrator, and Hindsight memory.
- **Local machine** is for development, git, and SSH access.
- **Hermes Pack** (`.hermes-pack/` submodule) provides the shared bootstrap + adapter system.
- Never commit raw `.env` to the repo — always encrypt first.

## Orchestration
- Control plane: `config/profiles/af-orchestrator.yaml` defines the T1 orchestrator profile.
- Ledger lives in `.alphaforge/orchestrator/`.
- Cron job: `af-orchestrator-tick` fires every 45m.
- Tri-gate: T1 Proposer → T2 Challenger → T3 Arbiter → T4 Human.

## Hermes Pack Integration
- [Hermes Pack](https://github.com/ddawnlll/hermes-pack) is a git submodule at `.hermes-pack/`.
- Contains the shared bootstrap, templates, and the `v7-alphaforge` adapter.
- To re-bootstrap (e.g. after cloning fresh):
  ```bash
  git submodule update --init
  bash .hermes-pack/bootstrap.sh . --adapter v7-alphaforge
  ```

## Related Repositories
- **AlphaForge Infra** (this repo): orchestrator infra, tri-gate, SOUL, E2E tests
- **Hermes Pack**: shared bootstrap & adapter system for multi-project Hermes setups
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
