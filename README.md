# AlphaForge

**Autonomous alpha discovery platform** — hypothesis lifecycle, adversarial tri-gate verification, and research validation powered by [Hermes Agent](https://hermes-agent.nousresearch.com/docs/).

[![GitHub](https://img.shields.io/badge/alphaforge--infa-private-181717?logo=github)]()
[![Mission Control](https://img.shields.io/badge/UI-mission--control--v1-blue)](https://github.com/ddawnlll/hermes-agent-desktop/tree/af/mission-control-v1)
[![Sandbox](https://img.shields.io/badge/E2E-af--sandbox-green)](https://github.com/ddawnlll/af-sandbox)

---

## Architecture: Adversarial Tri-Gate

AlphaForge uses a **4-tier verification pipeline** inspired by multi-agent debate research (Du et al. arXiv:2305.14325, Irving et al. arXiv:1805.00899). Every research decision passes through increasingly rigorous gates before reaching production.

```
                   T4 · HUMAN (Insan Onayı)
                   forbidden path, anayasa değişikliği,
                   canlıya promosyon, 3'lü deadlock
                         ▲
                         │ escalate (nadir)
              ┌──────────┴──────────┐
              │  T3 · ARBITER       │  On-demand judge
              │  SADECE A↔B         │  Opus-class model
              │  uyuşmazlığında     │  Ham kanıttan karar
              └──────┬─────────▲────┘
                     │         │ OBJECT
   ┌─────────────────┴──┐   ┌──┴─────────────────┐
   │ T1 · PROPOSER (A)  │   │ T2 · CHALLENGER (B)│
   │ Claude Sonnet 5    │──▶│ FARKLI model ailesi │
   │ • Tick çalıştırır  │(1)│ • Çürütme görevi    │
   │ • DecisionSet üret │   │   CONFIRM/OBJECT    │
   │ • TEK YAZAR        │(2)│ • A'nın CoT'nu      │
   │   ledger'a yazar   │◀──│   GÖRMEZ            │
   └──────────▲─────────┘   └──────────▲──────────┘
              │                         │
   ┌──────────┴─────────────────────────┴──────────┐
   │ T0 · DETERMINISTIC GATE (script, no LLM)      │
   │ control.yaml mode? · CI yeşil? · runs/ JSON   │
   │ şema? · diff allowed_paths? · branch push?    │
   │ ▶ Herhangi FAIL → LLM'siz red                 │
   └─────────────────────▲─────────────────────────┘
                          │
   ┌──────────────────────┴─────────────────────────┐
   │  KANIT KATMANI                                 │
   │  runs/*.json · CI sonuçları · kanban · GitHub  │
   │  hypotheses/*.yaml · Hindsight memory          │
   └────────────────────────────────────────────────┘
```

### Gate Flow

```
Worker branch bitirdi
   │
   ▼
[T0] script: CI? şema? path? push? ──FAIL──▶ RED (LLM yok)
   │ PASS
   ▼
[T1] A: kanıt okur → verdict PASS + merge önerisi
   │
   ▼
[T2] B: aynı kanıtı bağımsız okur, çürütmeye çalışır
   │
   ├─ CONFIRM ────────────▶ MERGE + log + hindsight retain
   │
   └─ OBJECT ─▶ A'ya 1 tur rebuttal ─▶ B ikna? ─evet─▶ MERGE
                                           │ hayır
                                           ▼
                                [T3] Arbiter: ham kanıttan karar
                                           │ kararsız / anayasal
                                           ▼
                                [T4] "blocked: needs human"
```

### Risk-Kademeli Maliyet

Her kararı 4 LLM'den geçirmek bütçeyi yakar. Çözüm: doğrulama derinliği riske orantılı.

| Risk | Örnek | Yol |
|---|---|---|
| **LOW** | tick raporu, memory retain | Sadece A |
| **MEDIUM** | task dispatch, FAIL/PARTIAL | A + B CONFIRM şart |
| **HIGH** | PASS + merge, deadlock | A + B + Arbiter (anlaşmazlıkta) |
| **CRITICAL** | forbidden path, anayasa | Her zaman insan (T4) |

---

## Repositories

| Repo | Branch | İçerik |
|---|---|---|
| `ddawnlll/alphaforge-infa` | `main` | Orkestratör altyapısı, tri-gate, SOUL, E2E (bu repo) |
| `ddawnlll/af-sandbox` | `main` | E2E test sandbox'ı (planted ground truth) |
| `ddawnlll/hermes-agent-desktop` | `af/mission-control-v1` | Desktop fork + Mission Control UI |

---

## Quick Start

### Prerequisites
- Python 3.11+, uv/pip
- [Hermes Agent](https://hermes-agent.nousresearch.com/docs/) (v0.18+)
- SSH key to remote server
- GitHub access

### 1. Setup

```bash
git clone https://github.com/ddawnlll/alphaforge-infa.git
cd alphaforge-infa
bash setup/bootstrap.sh
```

### 2. Deploy to Remote

```bash
REMOTE_SSH="s_01xxx@ssh.lightning.ai" bash deploy/remote.sh
```

### 3. Profile & Model

```bash
hermes profile use af-orchestrator

# Production: Claude Sonnet 5 (requires Anthropic extra usage)
hermes config set model.provider anthropic
hermes config set model.default claude-sonnet-5

# Test: DeepSeek V4 Flash (free tier)
hermes config set model.provider opencode-go
hermes config set model.default deepseek-v4-flash
```

### 4. Gateway

```bash
hermes gateway install --start-now   # production
hermes gateway run                    # dev/foreground
```

### 5. Start the Loop

```bash
# Edit control.yaml → mode: running
nano hermes-setup/.alphaforge/orchestrator/control.yaml

# Manual tick:
hermes cron run af-orchestrator-tick

# Or wait for automatic (every 45 min)
```

### 6. Monitor

```bash
# Remote health check:
bash deploy/check-status.sh

# Or use Mission Control Desktop:
cd ../hermes-agent-desktop/apps/desktop
npm install && npm run dev
```

---

## Repository Structure

```
alphaforge-infa/
├── README.md
├── AGENTS.md                  # Hermes agent rules (read this first!)
├── .gitignore
│
├── hermes-setup/              # Orchestrator pack (deployed to remote)
│   ├── adapters/v7-alphaforge/
│   │   ├── SOUL.orchestrator.md   # T1 identity + tick procedure (v3 tri-gate)
│   │   ├── SOUL.challenger.md     # T2 identity (read-only critic)
│   │   ├── SOUL.arbiter.md        # T3 identity (on-demand judge)
│   │   ├── AGENTS.adapter.md      # Project-specific rules
│   │   └── prompts/tick.md        # Short cron tick prompt
│   │
│   └── .alphaforge/orchestrator/
│       ├── control.yaml       # Human override plane (mode, budget, paths)
│       ├── state.json         # Tick ledger
│       ├── hypotheses/        # Research hypotheses (seed.yaml + more)
│       ├── runs/              # Evidence JSONs from workers
│       ├── reports/           # Tick reports <date>-tick.md
│       ├── decisions/         # T4 human inbox
│       ├── debates/           # T1↔T2 debate logs
│       └── scripts/           # T0 gate scripts
│           ├── check-schema.sh    # Schema validation (fail-closed)
│           └── check-paths.sh     # Path security gate (fail-closed)
│
├── config/                    # Deployment configs
│   ├── profiles/
│   │   ├── af-orchestrator.yaml    # T1 Proposer
│   │   ├── af-challenger.yaml      # T2 Challenger template
│   │   ├── af-arbiter.yaml         # T3 Arbiter template
│   │   ├── SOUL.challenger.md      # T2 system prompt
│   │   └── SOUL.arbiter.md         # T3 system prompt
│   ├── hindsight/config.json
│   └── mission-control.env.example # Desktop UI remote bridge config
│
├── e2e/                        # E2E test harness (branch: af/e2e-sandbox)
│   ├── run-suite.sh            # Full 10-scenario runner
│   ├── reset.sh                # Sandbox state reset
│   ├── assert.sh               # Scenario assert engine
│   ├── scenarios/S01..S10.yaml # Scenario definitions
│   ├── stage/S01..S10-stage.sh # Scenario staging scripts
│   └── results/                # Generated scorecards
│
├── docs/
│   └── mission-control-wiring.md  # Desktop ↔ Remote connection guide
│
├── setup/                      # Bootstrap scripts
│   ├── bootstrap.sh
│   ├── install-hermes.sh
│   ├── encrypt-env.sh / decrypt-env.sh
│   └── env.example
│
└── deploy/                     # Deployment
    ├── remote.sh               # Full remote deploy
    ├── check-status.sh          # Health check
    └── start-hindsight-daemon.py
```

---

## Tri-Gate Profiles

| Tier | Profil Adı | Model | Rol |
|---|---|---|---|
| **T0** | — | Bash/Python | Deterministic gate script |
| **T1** | `af-orchestrator` | Claude Sonnet 5 / DeepSeek V4 | Proposer, tek yazar |
| **T2** | `af-challenger` | DeepSeek V4 (veya farklı aile) | Adversarial critic, read-only |
| **T3** | `af-arbiter` | Yüksek reasoning model | On-demand judge |
| **T4** | — | Human | Anayasal otorite |

---

## E2E Test Framework

Ayrı bir sandbox repo (`ddawnlll/af-sandbox`) üzerinde orchestrator davranışını test eder. Her senaryonun **known ground truth**'ü vardır.

| ID | Senaryo | Beklenen |
|---|---|---|
| S01 | clean PASS | PR opened, NOT auto-merged, decisions/ entry |
| S02 | prose trap (claims, no evidence) | FAIL evidence-missing, hypothesis updated |
| S03 | leakage trap (oos_start < train_end) | Challenger OBJECT, debates/ entry |
| S04 | too-good trap (Sharpe 9.5, no neg control) | OBJECT / demand control run |
| S05 | synthetic trap (is_synthetic:true) | Labeled synthetic, NOT promoted |
| S06 | forbidden diff (runtime/guard.py) | T0 reject, no LLM override |
| S07 | constitution diff (MEMORY.md) | T0 "requires human (T4)", decisions/ |
| S08 | unpushed branch | Report instructs push-first |
| S09 | budget guard (85% spend) | No new dispatch |
| S10 | empty board | "Nothing to do", no invented tasks |

Kullanım:
```bash
cd e2e
export SANDBOX_REPO=/path/to/af-sandbox
bash run-suite.sh      # Full 10-scenario sweep
```

---

## Mission Control UI

Desktop fork'u: [`ddawnlll/hermes-agent-desktop`](https://github.com/ddawnlll/hermes-agent-desktop) branch `af/mission-control-v1`

```
npm run dev   →   http://localhost:5173
```

Paneller:
- **Mission Control** — tick özeti, bütçe çubuğu, worker durumu, gate akışı, canlı akış
- **Control Plane** — control.yaml düzenleyici (mode, path, budget)
- **Kanban** — Task board
- **Reports** — Tick raporları
- **Decisions** — T4 insan onay kutusu

Bağlantı için `.env`'de `REMOTE_SSH` ve `REMOTE_LEDGER_PATH` ayarla (şablon: `config/mission-control.env.example`).

---

## Remote Server (Lightning AI)

```
Host:       ssh.lightning.ai
Spec:       Tesla T4 GPU, Ubuntu 22.04
Hermes:     v0.18.0
Workdir:    /teamspace/studios/this_studio/
Services:
  ├── Gateway     → port 8530 (Hermes API + cron scheduler)
  ├── Hindsight   → port 9885 (knowledge graph memory)
  ├── Cron        → af-orchestrator-tick (45m), af-sandbox-tick (60m)
  └── Kanban      → af-sandbox (current)
```

```bash
# SSH:
ssh s_01xxx@ssh.lightning.ai

# Environment:
export PATH="$HOME/.hermes/hermes-agent/venv/bin:$PATH"

# Check status:
hermes gateway status
hermes cron list
hermes kanban boards show
```

---

## Authentication

| Sağlayıcı | Env Var | Not |
|---|---|---|
| **Anthropic** | `ANTHROPIC_TOKEN` | OAuth token (`sk-ant-oat...`). Extra usage gerekli: https://claude.ai/settings/usage |
| **OpenCode Go** | `OPENCODE_GO_API_KEY` | DeepSeek ücretsiz. Geçici çözüm |
| **Exa** | `EXA_API_KEY` | Web search MCP |

---

## Security

- `.env` **encrypted** before commit (Fernet, `setup/encrypt-env.sh`)
- remote `.env` profile-specific: `~/.hermes/profiles/af-orchestrator/.env`
- T0 gate scripts are **fail-closed**: error → reject, never "pass silently"
- `runtime/` and `MEMORY.md` changes require T4 human approval

---

## SSH Tunnel (Quick Connect)

Mission Control'ü remote sunucuya bağlamak için tek komut:

```bash
# Terminal 1: SSH tunnel (arka planda kalır)
bash deploy/tunnel.sh

# Terminal 2: Desktop Mission Control
cd apps/desktop
npm run dev
```

Tunnel şu portları forward eder:
| Local Port | Remote Port | Servis |
|---|---|---|
| `localhost:8530` | remote:8530 | Hermes Gateway (RPC, cron, kanban) |
| `localhost:9885` | remote:9885 | Hindsight Memory API |

Alternatif — el ile:
```bash
ssh -L 8530:localhost:8530 -L 9885:localhost:9885 s_01xxx@ssh.lightning.ai
```

## Mission Control → Remote Bağlantısı

Desktop fork'ta `.env` dosyasına şunları ekle:

```env
# SSH tunnel ile (önce bash deploy/tunnel.sh çalıştır)
REMOTE_SSH_HOST=s_01kwwhh24ekngtayqg296bvzzq@ssh.lightning.ai
REMOTE_LEDGER_PATH=/teamspace/studios/this_studio/af-sandbox/.alphaforge/orchestrator
GATEWAY_URL=http://localhost:8530
REMOTE_HINDSIGHT_URL=http://localhost:9885
GITHUB_TOKEN=ghp_xxx   # optional, higher API rate limit
```

Detaylı bağlantı kılavuzu: [`docs/mission-control-wiring.md`](docs/mission-control-wiring.md)
Yeni RemoteBridge implementasyonu: [`docs/remote-bridge.complete.ts`](docs/remote-bridge.complete.ts)
Gateway API client (referans): [`docs/gateway-client.ts`](docs/gateway-client.ts)

## Quick Commands

```bash
# Remote health
bash deploy/check-status.sh

# Tunnel aç
bash deploy/tunnel.sh

# Tick tetikle (tunnel açıkken)
curl -X POST http://localhost:8530/rpc \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"cron.run_job","params":{"name":"e2e-final-test"}}'

# Hindsight sorgula (tunnel açıkken)
curl "http://localhost:9885/recall?q=latest+tick+report"
```
