#!/usr/bin/env bash
# Check AlphaForge deployment status on remote
set -euo pipefail

REMOTE_SSH="${1:-${REMOTE_SSH:-}}"

if [ -z "$REMOTE_SSH" ]; then
  echo "Usage: REMOTE_SSH=user@host bash deploy/check-status.sh"
  echo "   or: bash deploy/check-status.sh user@host"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AlphaForge — Status Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh "$REMOTE_SSH" bash -s << 'SCRIPT'
  export PATH="$HOME/.hermes/hermes-agent/venv/bin:$PATH"

  echo ""
  echo "1️⃣  Hermes Version:"
  hermes --version 2>/dev/null || echo "  NOT FOUND"

  echo ""
  echo "2️⃣  Profiles:"
  hermes profile list 2>/dev/null || echo "  N/A"

  echo ""
  echo "3️⃣  Gateway Status:"
  hermes gateway status 2>/dev/null || echo "  NOT RUNNING"

  echo ""
  echo "4️⃣  Memory Provider:"
  hermes memory status 2>/dev/null || echo "  N/A"

  echo ""
  echo "5️⃣  Cron Jobs:"
  hermes cron list 2>/dev/null || echo "  NONE"

  echo ""
  echo "6️⃣  Hindsight Daemon:"
  if pgrep -f "hindsight.*embedded" > /dev/null 2>&1; then
    echo "  ✅ Running"
  else
    echo "  ❌ Not running"
  fi

  echo ""
  echo "7️⃣  Control Plane Mode:"
  if [ -f "$HOME/hermes-setup/.alphaforge/orchestrator/control.yaml" ]; then
    grep 'mode:' "$HOME/hermes-setup/.alphaforge/orchestrator/control.yaml"
  else
    echo "  control.yaml not found"
  fi

  echo ""
SCRIPT

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Done"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
