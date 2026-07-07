#!/usr/bin/env bash
# Encrypt .env → .env.enc (uses Python)
set -euo pipefail
cd "$(dirname "$0")/.."
python3 setup/encrypt-env.py "$@"
