# AlphaForge Infrastructure

**AlphaForge** — autonomous alpha discovery, hypothesis lifecycle, and research validation framework powered by Hermes Agent orchestration.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Remote Server (Lightning AI)                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Hermes Agent                                    │   │
│  │  ├── Profiles: af-orchestrator                   │   │
│  │  ├── Memory: Hindsight (local knowledge graph)   │   │
│  │  ├── Cron: af-orchestrator-tick (every 45m)      │   │
│  │  ├── Kanban: alphaforge board                    │   │
│  │  └── Gateway: running (API + messaging)          │   │
│  │                                                  │   │
│  │  AlphaForge Ledger                                │   │
│  │  ├── Hypotheses → seed.yaml                      │   │
│  │  ├── Runs → experimental evidence JSONs          │   │
│  │  └── Reports → tick reports                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         ▲
         │ SSH tunnel / Gateway API
         ▼
┌─────────────────────────────────────────────────────────┐
│  Local Machine (Windows)                                │
│  - Hermes CLI / Desktop                                 │
│  - Git workflow                                          │
│  - SSH to remote                                         │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- [Hermes Agent](https://hermes-agent.nousresearch.com/docs/)
- SSH access to remote server
- GitHub access (this repo)

### 1. Clone & Decrypt

```bash
git clone https://github.com/ddawnlll/alphaforge-infa.git
cd alphaforge-infa
bash setup/decrypt-env.sh    # will prompt for password
```

### 2. Deploy to Remote

```bash
bash deploy/remote.sh                    # interactive
# or one-shot:
REMOTE_SSH="user@host" bash deploy/remote.sh
```

### 3. Verify

```bash
bash deploy/check-status.sh
```

## Repository Structure

```
alphaforge-infa/
├── README.md              # This file
├── AGENTS.md              # Hermes agent rules for this repo
├── .gitignore
│
├── setup/                 # Bootstrap & configuration
│   ├── bootstrap.sh       # Main orchestrator bootstrap
│   ├── install-hermes.sh  # Hermes installation script
│   ├── decrypt-env.sh     # Decrypt .env from encrypted storage
│   ├── encrypt-env.sh     # Encrypt .env before commit
│   └── env.example        # Template with placeholders
│
├── config/                # All config files for deployment
│   ├── profiles/
│   │   └── af-orchestrator.yaml
│   ├── hindsight/
│   │   └── config.json
│   └── hermes-config.yaml
│
├── deploy/                # Deployment scripts
│   ├── remote.sh          # Full remote setup
│   └── check-status.sh    # Health check
│
└── hermes-setup/          # Orchestrator pack (from bootstrap)
    ├── .alphaforge/
    ├── templates/
    ├── adapters/
    ├── bootstrap.sh
    └── AGENTS.md
```

## Config Overview

| Component | Details |
|-----------|---------|
| **LLM Provider** | Anthropic Claude Sonnet 5 |
| **Worker Provider** | OpenCode Go / DeepSeek V4 Flash |
| **Memory** | Hindsight (local, knowledge graph) |
| **Orchestrator Schedule** | Every 45 minutes |
| **Kanban Board** | `alphaforge` |
| **Merge Policy** | PR-only, evidence-gated |

## Security

- `.env` is **encrypted** before commit — decrypt with `setup/decrypt-env.sh`
- API keys are stored in `.env` only, never in config files
- Remote server uses SSH key authentication
