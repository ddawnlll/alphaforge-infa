#!/usr/bin/env bash
# AlphaForge Remote Tunnel — Mission Control bağlantısı
# Kullanım:  bash deploy/tunnel.sh
# Bu script remote sunucuya SSH tunnel açar ve portları forward eder.
# Çalıştıktan sonra Mission Control local'deki portlara bağlanır.

set -euo pipefail

REMOTE_SSH="${REMOTE_SSH:-s_01kwwhh24ekngtayqg296bvzzq@ssh.lightning.ai}"

# Forward edilecek portlar:
#   8530 → Hermes Gateway (RPC API, cron, kanban)
#   9885 → Hindsight Memory (recall/retain API)
#   9090 → AlphaForge Ledger HTTP (opsiyonel, future)

LOCAL_GATEWAY="${LOCAL_GATEWAY:-8530}"
LOCAL_HINDSIGHT="${LOCAL_HINDSIGHT:-9885}"

echo "🔌 AlphaForge Remote Tunnel"
echo "   SSH:        $REMOTE_SSH"
echo "   Gateway:    localhost:$LOCAL_GATEWAY → remote:8530"
echo "   Hindsight:  localhost:$LOCAL_HINDSIGHT → remote:9885"
echo ""
echo "   Press Ctrl+C to disconnect."
echo ""

ssh -N \
  -L "${LOCAL_GATEWAY}:localhost:8530" \
  -L "${LOCAL_HINDSIGHT}:localhost:9885" \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o ExitOnForwardFailure=yes \
  "$REMOTE_SSH"

echo "❌ Tunnel closed."
