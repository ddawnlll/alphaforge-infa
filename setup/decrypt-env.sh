#!/usr/bin/env bash
# Decrypt .env.enc → .env (uses Python)
set -euo pipefail
cd "$(dirname "$0")/.."
python3 setup/decrypt-env.py "$@"
