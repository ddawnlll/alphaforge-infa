# AlphaForge Infrastructure — Hermes Agent Rules

## Architecture (hard boundaries)
- **Remote server** runs the Hermes gateway, orchestrator, and Hindsight memory.
- **Local machine** is for development, git, and SSH access.
- Never commit raw `.env` to the repo — always encrypt first.

## Orchestration
- Control plane: `config/profiles/af-orchestrator.yaml` defines the orchestrator profile.
- Ledger lives in `hermes-setup/.alphaforge/orchestrator/`.
- Cron job: `af-orchestrator-tick` fires every 45m.

## Deploy
- Use `deploy/remote.sh` for first-time remote setup.
- Use `setup/install-hermes.sh` for standalone Hermes installs.
- After deploy, run `deploy/check-status.sh` to verify.

## Memory
- Hindsight (local mode) — knowledge graph + multi-strategy recall.
- Config at `config/hindsight/config.json`.
- LLM provider: Anthropic Claude Sonnet 5 (via `HINDSIGHT_API_LLM_*` env vars).

## DesignForge (Design Intelligence Engine)
- Located at `designforge/` — fully integrated into this repo.
- "URL ver → 10 saniyede redesign blueprint" engine.
- Uses tri-gate for design quality: Designer (T1) → Challenger (T2) → Design Judge (T3/VLM).
- 8 Hermes skills for outreach pipeline (leads → drafts, NO auto-send).
- See `designforge/AGENTS.md` for DesignForge-specific rules.
