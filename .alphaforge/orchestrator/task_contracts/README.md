# This directory holds task contract YAML files.
# Each file defines a single bounded task for a Hermes worker.
#
# File naming: <hypothesis-id>-<task-seq>.yaml
#
# The orchestrator reads these to build Context Capsules for workers.
# Example:
#
# task_id: AF-HYP-0042
# hypothesis_id: scalp-vol-breakout-017
# risk_level: high
# objective: "Test whether scalp breakout alpha improves OOS profit factor without leakage"
# allowed_paths: [alphaforge/, simulation/, lib/]
# forbidden_paths: [runtime/, exchange/, risk/, MEMORY.md]
# required_context:
#   - .alphaforge/orchestrator/current_state.md
#   - .alphaforge/orchestrator/hypotheses/scalp-vol-breakout-017.yaml
# acceptance:
#   - "runner JSON exists"
#   - "CI passes"
#   - "OOS window > train_end"
#   - "negative control included"
# output_required:
#   - evidence_bundle.json
#   - diff.patch
#   - test_output.txt
