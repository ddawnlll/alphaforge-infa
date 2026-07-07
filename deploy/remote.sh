#!/usr/bin/env bash
# Remote deployment script for AlphaForge
# Usage: bash deploy/remote.sh [SSH_HOST]
#   SSH_HOST defaults to env var REMOTE_SSH or prompts interactively
set -euo pipefail

# ── Config ──
REMOTE_SSH="${1:-${REMOTE_SSH:-}}"
REPO_URL="https://github.com/ddawnlll/alphaforge-infa.git"
HERMES_HOME_REMOTE="$HOME/.hermes"
LEDGER_DIR=".alphaforge/orchestrator"

# ── Colors ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[deploy]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
die()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── SSH host prompt ──
if [ -z "$REMOTE_SSH" ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  AlphaForge — Remote Deployment"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Enter SSH connection (e.g. user@host or host):"
  read -r REMOTE_SSH
  [ -z "$REMOTE_SSH" ] && die "SSH host required"
fi

# ── Test SSH connection ──
info "Testing SSH connection to $REMOTE_SSH..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new "$REMOTE_SSH" "echo OK" || die "Cannot connect to $REMOTE_SSH"
ok "SSH connection successful"

# ── Phase 1: System dependencies + Hermes install ──
info "Phase 1/5: Installing system dependencies & Hermes..."
ssh "$REMOTE_SSH" bash -s << 'SCRIPT'
  set -e
  # System deps
  sudo apt-get update -qq 2>/dev/null || true
  sudo apt-get install -y -qq curl git python3 python3-pip python3-venv openssl 2>/dev/null || true

  # Install Hermes if missing
  if ! command -v hermes &>/dev/null; then
    echo "Installing Hermes..."
    curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
  fi
  export PATH="$HOME/.hermes/hermes-agent/venv/bin:$PATH"
  echo "hermes: $(hermes --version 2>/dev/null || echo 'unknown')"
SCRIPT
ok "Hermes ready on remote"

# ── Phase 2: Clone / update repo ──
info "Phase 2/5: Cloning repository..."
ssh "$REMOTE_SSH" bash -s << SCRIPT
  set -e
  if [ -d "$HOME/alphaforge-infa" ]; then
    cd "$HOME/alphaforge-infa" && git pull
  else
    git clone "$REPO_URL" "$HOME/alphaforge-infa"
  fi
SCRIPT
ok "Repository ready"

# ── Phase 3: Decrypt .env & install config ──
info "Phase 3/5: Decrypting .env and installing config..."
echo ""
echo -e "${YELLOW}You need the .env.enc password from when the repo was created.${NC}"
echo -e "${YELLOW}Enter it below (or press Ctrl+C to skip and set up .env manually).${NC}"
echo ""

# Copy encrypted env and decrypt remotely
scp ".env.enc" "$REMOTE_SSH:~/alphaforge-infa/.env.enc" 2>/dev/null || warn "No .env.enc found locally — skipping encrypted .env"

ssh -t "$REMOTE_SSH" bash -s << 'SCRIPT'
  set -e
  cd "$HOME/alphaforge-infa"

  # Install cryptography for decrypt
  pip install cryptography 2>/dev/null || pip3 install cryptography 2>/dev/null || true

  # Try decrypt, fallback to manual
  if [ -f ".env.enc" ]; then
  echo "Decrypting .env.enc (you'll need the password)..."
  python3 setup/decrypt-env.py || echo "Decryption failed or cancelled"
  fi

  # If still no .env, prompt manually
  if [ ! -f ".env" ]; then
    echo "Creating .env from example — please edit with real keys:"
    cp setup/env.example .env
    echo "Edit .env now with: nano ~/alphaforge-infa/.env"
  fi

  # Install .env to Hermes home
  mkdir -p "$HOME/.hermes"
  cp .env "$HOME/.hermes/.env" 2>/dev/null || true
  chmod 600 "$HOME/.hermes/.env" 2>/dev/null || true
SCRIPT
ok "Environment configured"

# ── Phase 4: Profiles, Config & Praxis Setup ──
info "Phase 4/5: Setting up profiles, Praxis gates & orchestrator..."
ssh -t "$REMOTE_SSH" bash -s << 'SCRIPT'
  set -e
  export PATH="$HOME/.hermes/hermes-agent/venv/bin:$PATH"

  # Create af-orchestrator profile
  if ! hermes profile list 2>/dev/null | grep -q "af-orchestrator"; then
    hermes profile create af-orchestrator || echo "Profile may already exist"
  fi

  # Deploy profile config
  mkdir -p "$HOME/.hermes/profiles/af-orchestrator"
  cp "$HOME/alphaforge-infa/config/profiles/af-orchestrator.yaml" "$HOME/.hermes/profiles/af-orchestrator/config.yaml"

  # Set memory provider
  hermes config set memory.provider hindsight

  # Hindsight config
  mkdir -p "$HOME/.hermes/hindsight"
  cp "$HOME/alphaforge-infa/config/hindsight/config.json" "$HOME/.hermes/hindsight/config.json"
  mkdir -p "$HOME/.hermes/profiles/af-orchestrator/hindsight"
  cp "$HOME/alphaforge-infa/config/hindsight/config.json" "$HOME/.hermes/profiles/af-orchestrator/hindsight/config.json"

  # Install hindsight dependencies
  pip install hindsight-all 2>/dev/null || pip3 install hindsight-all 2>/dev/null || true

  # ── Praxis Gate Setup ──
  echo "Setting up Praxis evidence gates..."

  # Ensure hermes-pack submodule is up to date
  cd "$HOME/alphaforge-infa"
  git submodule update --init --recursive

  # Create .alphaforge/orchestrator directories
  mkdir -p .alphaforge/orchestrator/{schemas,scripts,evidence,task_contracts,memory,runs,reports,decisions,debates}

  # Install Praxis gate scripts to Hermes scripts directory
  mkdir -p "$HOME/.hermes/scripts"
  cp .alphaforge/orchestrator/scripts/tick-gate.sh "$HOME/.hermes/scripts/af-orchestrator-tick-gate.sh"
  chmod +x "$HOME/.hermes/scripts/af-orchestrator-tick-gate.sh"

  # Create cron job for orchestrator tick (with pre-tick gate script)
  if ! hermes cron list 2>/dev/null | grep -q "af-orchestrator-tick"; then
    hermes cron create \
      --name af-orchestrator-tick \
      --schedule "every 45m" \
      --script "$HOME/.hermes/scripts/af-orchestrator-tick-gate.sh" \
      --workdir "$HOME/alphaforge-infa" \
      --deliver local
    echo "Cron job created: af-orchestrator-tick (every 45m)"
  fi

  # Create e2e-final-test cron (if not exists)
  if ! hermes cron list 2>/dev/null | grep -q "e2e-final-test"; then
    hermes cron create \
      --name e2e-final-test \
      --schedule "every 60m" \
      --workdir "$HOME/alphaforge-infa" \
      --deliver local
    echo "Cron job created: e2e-final-test (every 60m)"
  fi

  # Verify Praxis setup
  echo ""
  echo "Praxis verification:"
  ls -la .alphaforge/orchestrator/schemas/ 2>/dev/null && echo "  ✅ Schemas"
  ls -la .alphaforge/orchestrator/scripts/ 2>/dev/null && echo "  ✅ Gate scripts"
  [ -f .hermes-pack/templates/praxis/praxis-verify.sh ] && echo "  ✅ Praxis verify script"
  [ -f .alphaforge/orchestrator/current_state.md ] && echo "  ✅ current_state.md"

  echo "Profile setup complete"
SCRIPT
ok "Profiles, Praxis gates configured"

# ── Phase 5: Gateway ──
info "Phase 5/5: Starting Hermes gateway..."
ssh -t "$REMOTE_SSH" bash -s << 'SCRIPT'
  set -e
  export PATH="$HOME/.hermes/hermes-agent/venv/bin:$PATH"

  # Ensure hindsight daemon runs
  nohup python -c "
from hindsight.embedded import HindsightEmbedded
import asyncio, os

async def start():
    hs = HindsightEmbedded(
        profile='default',
        llm_provider=os.environ.get('HINDSIGHT_API_LLM_PROVIDER', 'anthropic'),
        llm_api_key=os.environ.get('HINDSIGHT_API_LLM_API_KEY', os.environ.get('ANTHROPIC_API_KEY', '')),
        llm_model=os.environ.get('HINDSIGHT_API_LLM_MODEL', 'claude-sonnet-5'),
        idle_timeout=0,
        log_level='info'
    )
    await hs.start()
    # keep running
    await asyncio.Event().wait()

asyncio.run(start())
" > "$HOME/.hermes/hindsight-daemon.log" 2>&1 &
  echo "Hindsight daemon starting..."

  # Install & start gateway
  hermes gateway install --start-now 2>&1 || hermes gateway run --detach 2>&1 || {
    echo "Gateway start attempted. Check with: hermes gateway status"
  }

  echo "Gateway startup initiated"
SCRIPT
ok "Gateway started on remote"

# ── Summary ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}  ✅ Remote Deployment Complete${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Remote server: $REMOTE_SSH"
echo ""
echo "Commands to verify:"
echo "  ssh $REMOTE_SSH 'hermes gateway status'"
echo "  ssh $REMOTE_SSH 'hermes cron list'"
echo "  ssh $REMOTE_SSH 'hermes profile list'"
echo "  ssh $REMOTE_SSH 'hermes memory status'"
echo ""
echo "To trigger a manual tick:"
echo "  ssh $REMOTE_SSH 'hermes cron run af-orchestrator-tick'"
echo ""
echo "For local connection, use SSH tunnel:"
echo "  ssh -L 8984:localhost:8984 $REMOTE_SSH   # Hindsight API"
echo "  ssh -L 8080:localhost:8080 $REMOTE_SSH   # Gateway API"
echo ""
