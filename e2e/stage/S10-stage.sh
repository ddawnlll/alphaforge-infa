#!/usr/bin/env bash
# S10: empty board — no tasks, no open issues
set -euo pipefail
SANDBOX="${SANDBOX_REPO:-/teamspace/studios/this_studio/af-sandbox}"
cd "$SANDBOX"
# No branches, no tasks, no evidence — just reset everything
echo "✅ S10 staged (empty board — nothing to do)"
