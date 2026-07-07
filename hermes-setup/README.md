# Hermes Orchestrator Pack

A generic, reusable bootstrap and orchestration package for [Hermes Agent](https://github.com/NousResearch/hermes-agent).
Turns any codebase into a hypothesis-driven, evidence-gated, autonomous improvement loop.

## Architecture

```
hermes-orchestrator-pack/
  bootstrap.ts                  # Generic bootstrap script (TypeScript, Bun)
  templates/                    # Generic template files (tick prompts, SOULs, configs)
  adapters/                     # Project-specific adapters
    v7-alphaforge/              # V7/AlphaForge adapter
```

## How it works

1. A **bootstrap** creates Hermes profiles, a project ledger, and a cron tick.
2. The **orchestrator** runs on a cron schedule, reads hypotheses from the ledger, dispatches work via Kanban, and judges results.
3. **Workers** execute bounded hypothesis-testing tasks on isolated branches.
4. **Evidence** must come from deterministic runner JSON — never agent prose.
5. The **tick gate** pre-flight checks whether work is needed before waking the LLM.

## Installation

### Prerequisites

- [Bun](https://bun.sh) installed (v1.x)
- [Hermes Agent](https://github.com/NousResearch/hermes-agent) installed on PATH
- API keys for your LLM providers (set in Hermes `.env`)

### Quick start (dry-run)

```bash
cd hermes-orchestrator-pack
bun bootstrap.ts --dry-run /path/to/your/repo --adapter v7-alphaforge
```

This prints what would be created without touching anything.

### Real bootstrap

```bash
bun bootstrap.ts /path/to/your/repo --adapter v7-alphaforge
```

This will:
1. Install Hermes profiles (`af-orchestrator`, `af-worker-1..N`)
2. Install the tick gate script (`~/.hermes/scripts/`)
3. Create the project ledger (control.yaml, state.json, hypotheses/, runs/, reports/)
4. Set up the Kanban board
5. Register the cron tick (default: paused)

## Adapter system

Adapters customise the bootstrap for your project. Each adapter lives in `adapters/<name>/`:

```
adapters/<name>/
  project.yaml          # Project configuration (name, paths, providers, etc.)
  AGENTS.adapter.md     # Project-specific AGENTS.md (architecture boundaries, runner commands)
  hypotheses.seed.yaml  # Initial hypothesis families
```

### Creating a new adapter

1. Create `adapters/<name>/project.yaml`:

```yaml
project:
  name: "MyProject"
  objective: "Improve the project in measurable ways."
  board_name: "myproject-board"
  board_desc: "MyProject orchestration"

hermes:
  profile_orchestrator: "myproject-orch"
  profile_worker_prefix: "myproject-worker"
  worker_count: 3
  tick_name: "myproject-tick"
  tick_schedule: "every 45m"
  delivery: "local"
  provider:
    orchestrator: "anthropic"
    orchestrator_model: "claude-opus-4"
    worker: "openrouter"
    worker_model: "deepseek/deepseek-v4-flash"

paths:
  ledger: ".orchestrator"

boundaries:
  allowed:
    - "src/"
    - "tests/"
  forbidden:
    - "vendor/"
    - "node_modules/"

merge_policy: "pr_only"
max_parallel_workers: 3
max_llm_spend_per_day_usd: 25
```

2. (Optional) Create `AGENTS.adapter.md` — if absent, a generic starter is used.
3. (Optional) Create `hypotheses.seed.yaml` — initial hypothesis families.

### Environment overrides

Provider/model values can be overridden at runtime:

```bash
HERMES_ORCH_MODEL="claude-sonnet-4" bun bootstrap.ts /repo --adapter v7-alphaforge
```

## Controls

| Control | File | Action |
|---------|------|--------|
| Pause | `$LEDGER/control.yaml` → `mode: paused` | Orchestrator reads, writes one-paragraph report, stops |
| Resume | `$LEDGER/control.yaml` → `mode: running` | Next tick proceeds normally |
| Kill | `$LEDGER/control.yaml` → `mode: killed` | Blocks all tasks, reports, stops |
| Human directive | `human_instruction: "..."` | Treated as top priority next tick |
| Emergency stop | `hermes cron pause <tick-name>` | Master off switch |

## Project ledger

```
<repo>/<ledger-dir>/
  control.yaml    # Human override / control plane
  state.json      # Tick counter, active branches, spend
  hypotheses/     # YAML hypothesis files
  runs/           # Deterministic runner JSON output
  reports/        # Tick reports
```

## Verification checklist

- [ ] `bun bootstrap.ts --help` prints usage
- [ ] `bun bootstrap.ts --dry-run <dir> --adapter <name>` works without API keys
- [ ] Dry-run prints what would be created
- [ ] `control.yaml` defaults to `mode: paused`
- [ ] No `.alphaforge` references in generic templates
- [ ] No hardcoded model IDs in generic files
- [ ] V7 paths live only in `adapters/v7-alphaforge/`
- [ ] `grep -R ".alphaforge" .` shows hits only in adapters/
- [ ] `grep -R "claude-fable-5" .` shows no hits

## Commands

```bash
# Help
bun bootstrap.ts --help

# Dry-run (no API keys needed)
bun bootstrap.ts --dry-run /path/to/repo --adapter v7-alphaforge

# Real bootstrap
bun bootstrap.ts /path/to/repo --adapter v7-alphaforge

# Pause orchestration
hermes cron pause <tick-name>

# Manual tick (test)
hermes cron run <tick-name>
```

## Known limitations

- Provider/model names are configured in the adapter but not validated at bootstrap time.
- The tick gate (`templates/scripts/tick-gate.sh`) is a shell script — Hermes cron requires `.sh` scripts for the `--script` flag.
- Hermes CLI flags (`--script`, `--deliver`, `--workdir`) confirmed working with Hermes v0.18.0.
