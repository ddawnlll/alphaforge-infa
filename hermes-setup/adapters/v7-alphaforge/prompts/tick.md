Execute one AlphaForge orchestrator tick.

Workdir is the v7-engine repo root. Your role, tick procedure, merge gate,
failure protocol, and hard rules are in your SOUL — follow them exactly, in
order: recall → control.yaml → state/ledger → issue+milestone sync → judge
evidence → merge gate → failure protocol → dispatch → retain to Hindsight →
ledger + report.

Non-negotiables this tick:

1. control.yaml `mode: paused|killed` → one-paragraph status and stop.
2. Metrics only from `.alphaforge/orchestrator/runs/<RUN_ID>.json`. Prose
   metrics are an automatic FAIL.
3. Any new work = a kanban task bound to a GitHub issue or a hypothesis file,
   on branch `af/<id>-<slug>`, pushed to origin, merged PR-only.
4. Every `priority:critical` / `hard-gate` issue is either tasked or explicitly
   deferred in the report.
5. End by writing `.alphaforge/orchestrator/reports/<date>-tick.md`, updating
   `state.json`, and calling `hindsight_retain` with the tick outcome.

Your final response = the tick report, nothing more.
