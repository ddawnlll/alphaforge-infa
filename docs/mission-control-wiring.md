# AlphaForge ↔ Mission Control UI — Wiring Guide

## Repositories

| Repo | Branch | Purpose |
|---|---|---|
| `ddawnlll/alphaforge-infa` | `main` | Orchestrator infra, tri-gate, SOUL, E2E |
| `ddawnlll/hermes-agent-desktop` | `af/mission-control-v1` | Desktop fork with Mission Control UI |

## How They Connect

### 1. Ledger Data Flow
```
Remote Server (Lightning AI)
  /teamspace/studios/this_studio/
    ├── af-sandbox/.alphaforge/orchestrator/    ← sandbox ledger
    ├── hermes-setup/.alphaforge/orchestrator/   ← production ledger
    └── .hermes/kanban/boards/af-sandbox/        ← kanban board

Desktop Mission Control
  lib/ledger-reader.ts  →  SSH tunnel →  remote files
  lib/kanban-bridge.ts  →  SSH tunnel →  remote kanban.db
  lib/hindsight-bridge.ts → HTTP →  remote Hindsight (port 9885)
  lib/github-bridge.ts  →  HTTPS →  github.com/ddawnlll/af-sandbox
```

### 2. Remote Bridge Config
`lib/remote-bridge.ts` reads from `.env`:
```
REMOTE_SSH=s_01kwwhh24ekngtayqg296bvzzq@ssh.lightning.ai
REMOTE_LEDGER_PATH=/teamspace/studios/this_studio/af-sandbox/.alphaforge/orchestrator
REMOTE_HINDSIGHT_URL=http://localhost:9885
```

### 3. Route Mapping (Desktop routes.ts)
```
/mission-control    → MissionControl (tick summary, budget, workers, gate flow, live ticker)
/control-plane      → ControlPlane (control.yaml form editor)
/decisions          → Decisions (T4 human inbox)
/kanban             → Kanban (board view)
/reports            → Reports (tick reports list)
/hypotheses        → Hypotheses (hypothesis registry)
/runs              → Runs (evidence browser)
/memory            → Memory (Hindsight recall UI)
```

## Wiring Steps

### Remote Server Setup (DONE ✅)
- [x] Gateway running (PID: 1532305)
- [x] Hindsight running (port 9885)
- [x] Cron jobs pinned
- [x] Kanban board `af-sandbox`

### Desktop Fork Setup
- [ ] Clone: `git clone https://github.com/ddawnlll/hermes-agent-desktop`
- [ ] Checkout: `git checkout af/mission-control-v1`
- [ ] Install: `cd apps/desktop && npm install`
- [ ] Configure `.env` with remote SSH and ledger paths
- [ ] Run: `npm run dev` (or standalone: `npm run standalone`)

### Verification
```bash
# After starting the desktop app:
# 1. Mission Control should show live sandbox data
# 2. Control Plane should read/write control.yaml via SSH
# 3. Kanban should show sandbox board tasks
# 4. Reports should list tick reports
```

## File Map (Desktop Fork)

```
apps/desktop/src/
├── app/
│   ├── mission-control/        # Route: /mission-control
│   │   ├── index.tsx           # Main dashboard
│   │   ├── tick-summary.tsx    # Recent tick card
│   │   ├── budget-bar.tsx      # Daily spend bar
│   │   ├── worker-status.tsx   # Active workers
│   │   ├── gate-flow.tsx       # T0-T4 flow stats
│   │   └── live-ticker.tsx     # Event feed
│   ├── control-plane/          # Route: /control-plane
│   │   ├── index.tsx           # control.yaml form
│   │   ├── human-instruction.tsx
│   │   └── path-editor.tsx
│   ├── kanban/                 # Route: /kanban
│   │   └── index.tsx
│   └── reports/                # Route: /reports
│       └── index.tsx
├── lib/
│   ├── ledger-reader.ts        # Reads control.yaml, state.json, hypotheses
│   ├── kanban-bridge.ts        # Reads kanban.db via remote-bridge
│   ├── hindsight-bridge.ts     # Hindsight recall API
│   ├── github-bridge.ts        # gh issue list, milestones
│   ├── tick-parser.ts          # Parses reports/<date>-tick.md
│   └── remote-bridge.ts        # SSH tunnel abstraction
└── standalone/
    ├── main.tsx                 # Standalone dev mode
    ├── sample-data.ts           # Mock data for dev
    └── standalone.html          # Entry point
```
