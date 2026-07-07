#!/usr/bin/env bash
# Install Hermes Agent on a Linux server (Ubuntu/Debian)
set -euo pipefail

echo "=========================================="
echo "  Hermes Agent Installer"
echo "=========================================="

# ── Dependencies ──
echo "📦 Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq curl git python3 python3-pip python3-venv openssl jq 2>/dev/null

# Python deps for decrypt
pip3 install cryptography 2>/dev/null || true

# ── Install Hermes via official script ──
echo "🚀 Installing Hermes Agent..."
if command -v hermes &>/dev/null; then
  echo "✓ Hermes already installed: $(hermes --version 2>/dev/null || echo 'version unknown')"
else
  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
  echo "✅ Hermes installed"
fi

# ── Ensure hermes is on PATH ──
if ! grep -q 'hermes' ~/.bashrc 2>/dev/null; then
  echo 'export PATH="$HOME/.hermes/hermes-agent/venv/bin:$PATH"' >> ~/.bashrc
fi

echo ""
echo "✅ Hermes ready. Run the repo setup next:"
echo "   cd alphaforge-infa && bash deploy/remote.sh"
