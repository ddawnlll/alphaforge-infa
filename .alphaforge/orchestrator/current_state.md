# AlphaForge — Current Verified State

> Canonical truth file. Updated ONLY by orchestrator after Praxis PASS + gate verdict.
> Workers MUST read this before acting. Agent claims without reference to this file are suspicious.

## Project Identity
- **Project:** AlphaForge (V7/AlphaForge adapter)
- **Orchestrator profile:** `af-orchestrator` (T1 Proposer)
- **Worker profiles:** `af-worker-1..3`
- **Challenger profile:** `af-challenger` (T2, read-only)
- **Arbiter profile:** `af-arbiter` (T3, on-demand)
- **Ledger:** `.alphaforge/orchestrator/`
- **Adapter:** `v7-alphaforge` (in hermes-pack)

## Domain Boundaries
- `alphaforge/` — discovery, research, hypothesis lifecycle
- `simulation/` — simulation and economic truth
- `lib/` — shared library code
- `runtime/` — **FORBIDDEN** (V7 runtime, orchestrator only)
- `exchange/` — **FORBIDDEN** (exchange integration)
- `risk/` — **FORBIDDEN** (risk management)

## Active Hypotheses
_Updated by orchestrator each tick._

## Evidence Gate (Praxis) Configuration
- **Pre-tick gate:** control.yaml mode + activity check
- **T0 gate:** Praxis deterministic verification (schema, paths, memory, lineage, controls, metrics, branch, budget)
- **T1:** Proposer reads evidence → PASS/FAIL/ESCALATE
- **T2:** Challenger blind audit (read-only, different model family)
- **T3:** Arbiter (on disagreement, raw evidence only)
- **T4:** Human (constitutional changes, critical risk, deadlock)

## Memory Policy
- **Workers CANNOT write to canonical memory.** Period.
- **Only orchestrator** writes to `.hermes/` after gate verdict.
- **Hindsight** retains verified research results only (evidence-bundle sourced).

## Verified Facts
_(Appended by orchestrator after PASS verdict)_

## Active Runs
_(Tracked in state.json and evidence/ directory)_
