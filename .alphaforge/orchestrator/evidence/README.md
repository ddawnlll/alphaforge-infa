# This directory holds evidence bundles produced by workers.
# Each run gets its own subdirectory: <run_id>/
#
# Structure:
#   evidence/<run_id>/
#     evidence_bundle.json   # Structured worker output (required by Praxis)
#     diff.patch             # Git diff of changes (required by Praxis)
#     test_output.txt        # Test runner output (required by Praxis)
#     gate_result.json       # Praxis verification result (produced by praxis-verify.sh)
#     uncertainty.md         # Optional: worker's uncertainty notes
