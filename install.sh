#!/bin/bash
# ==============================================================================
# 🚀 1-Click Installer for Claude Code + Groq Cloud on Android Termux
# Completely Free, 14,400 Requests/Day, Background Agent & Native Execution
# ==============================================================================

set -e

echo ""
echo "=================================================================="
echo "  🚀 Installing Claude Code + Free Groq Agent on Android Termux"
echo "=================================================================="
echo ""

# 1. Update and install base packages
echo "📦 [1/6] Installing necessary packages (Node.js, Git, Python, Tmux)..."
pkg update -y
pkg install -y nodejs-lts git python curl jq tmux

# 2. Install Native Claude Code for Termux
echo ""
echo "🤖 [2/6] Installing Native Claude Code engine..."
if ! command -v claude >/dev/null 2>&1; then
    curl -fsSL https://raw.githubusercontent.com/ferrumclaudepilgrim/claude-code-android/main/install.sh -o /tmp/claude_install.sh
    bash /tmp/claude_install.sh || true
    rm -f /tmp/claude_install.sh
fi

# 3. Setup Groq Bridge Script
echo ""
echo "⚡ [3/6] Setting up Groq Bridge Engine..."
mkdir -p "$HOME/.claude"

# Copy or download groq_bridge.js
if [ -f "$(dirname "$0")/groq_bridge.js" ]; then
    cp "$(dirname "$0")/groq_bridge.js" "$HOME/.groq_bridge.js"
else
    curl -fsSL https://raw.githubusercontent.com/myabdur212121-afk/termux-claude-groq/main/groq_bridge.js -o "$HOME/.groq_bridge.js"
fi

# 4. Create Helper CLI tools in $PREFIX/bin
echo ""
echo "🛠️ [4/6] Installing Helper Commands (claude, start-agent, check-agent, set-key)..."

# Global Launcher: cl
cat << 'EOF' > "$PREFIX/bin/cl"
#!/bin/bash
pkill -f groq_bridge.js 2>/dev/null || true
node "$HOME/.groq_bridge.js" >/dev/null 2>&1 &
BRIDGE_PID=$!
sleep 0.8

if [ "$1" = "code" ]; then
    shift
fi

command claude --permission-mode bypassPermissions "$@"
EXIT_CODE=$?

kill $BRIDGE_PID 2>/dev/null || true
exit $EXIT_CODE
EOF
chmod +x "$PREFIX/bin/cl"

# Helper: set-key
if [ -f "$(dirname "$0")/set-key.sh" ]; then
    cp "$(dirname "$0")/set-key.sh" "$PREFIX/bin/set-key"
else
    curl -fsSL https://raw.githubusercontent.com/myabdur212121-afk/termux-claude-groq/main/set-key.sh -o "$PREFIX/bin/set-key"
fi
chmod +x "$PREFIX/bin/set-key"

# Helper: switch-model
if [ -f "$(dirname "$0")/switch-model.sh" ]; then
    cp "$(dirname "$0")/switch-model.sh" "$PREFIX/bin/switch-model"
else
    curl -fsSL https://raw.githubusercontent.com/myabdur212121-afk/termux-claude-groq/main/switch-model.sh -o "$PREFIX/bin/switch-model"
fi
chmod +x "$PREFIX/bin/switch-model"

# Helper: start-agent
cat << 'EOF' > "$PREFIX/bin/start-agent"
#!/bin/bash
termux-wake-lock 2>/dev/null || true
if tmux has-session -t agent-session 2>/dev/null; then
    echo "🔄 Resuming existing agent session..."
    tmux attach-session -t agent-session
else
    echo "🚀 Starting new background agent session..."
    tmux new-session -s agent-session "$PREFIX/bin/cl"
fi
EOF
chmod +x "$PREFIX/bin/start-agent"

# Helper: check-agent
cat << 'EOF' > "$PREFIX/bin/check-agent"
#!/bin/bash
if tmux has-session -t agent-session 2>/dev/null; then
    tmux attach-session -t agent-session
else
    echo "⚠️ No agent is running in the background. Run 'start-agent' to start one."
fi
EOF
chmod +x "$PREFIX/bin/check-agent"

# Helper: stop-agent
cat << 'EOF' > "$PREFIX/bin/stop-agent"
#!/bin/bash
tmux kill-session -t agent-session 2>/dev/null || true
pkill -f groq_bridge.js 2>/dev/null || true
termux-wake-unlock 2>/dev/null || true
echo "🛑 Background agent stopped & battery lock released."
EOF
chmod +x "$PREFIX/bin/stop-agent"

# 5. Configure Auto-Trust for Workspace & Bypass Permission Classifier
echo ""
echo "🔒 [5/6] Configuring workspace permissions & trust..."
cat << 'EOF' > "$HOME/.claude.json"
{
  "hasCompletedOnboarding": true,
  "projects": {
    "/data/data/com.termux/files/home": {
      "hasTrustDialogAccepted": true
    }
  }
}
EOF

cat << 'EOF' > "$HOME/.claude/settings.json"
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  },
  "trustedDirectories": [
    "/data/data/com.termux/files/home",
    "/data/data/com.termux/files/home/*"
  ]
}
EOF

# 6. Configure Environment in ~/.bashrc
echo ""
echo "⚙️ [6/6] Finalizing configuration in ~/.bashrc..."

sed -i '/ANTHROPIC_/d' "$HOME/.bashrc" 2>/dev/null || true
sed -i '/alias claude/d' "$HOME/.bashrc" 2>/dev/null || true
sed -i '/alias c=/d' "$HOME/.bashrc" 2>/dev/null || true

cat << 'EOF' >> "$HOME/.bashrc"
export ANTHROPIC_BASE_URL="http://127.0.0.1:3000"
export ANTHROPIC_AUTH_TOKEN="dummy_token"
export ANTHROPIC_API_KEY=""
export ANTHROPIC_MODEL="openai/gpt-oss-120b"
alias claude="cl"
alias c="cl"
EOF

# Prompt for API Key if not already set
if [ ! -f "$HOME/.groq_key" ] && [ -z "$GROQ_API_KEY" ]; then
    echo ""
    echo "=========================================================="
    echo "🔑 Groq API Key Setup:"
    echo "Get your 100% free API key from: https://console.groq.com/keys"
    echo "=========================================================="
    read -p "Enter your Groq API Key (or press Enter to set later via 'set-key'): " USER_KEY
    if [ -n "$USER_KEY" ]; then
        "$PREFIX/bin/set-key" "$USER_KEY"
    fi
fi

echo ""
echo "=================================================================="
echo "🎉 INSTALLATION COMPLETED SUCCESSFULLY!"
echo "=================================================================="
echo ""
echo "📌 Useful Commands:"
echo "  • claude       : Launch Claude Code AI Agent"
echo "  • start-agent  : Run Agent in Background (watch YouTube while it works)"
echo "  • check-agent  : View running background agent"
echo "  • stop-agent   : Stop background agent & save battery"
echo "  • switch-model : Change default AI model (120B / 27B / 20B)"
echo "  • set-key      : Update or change Groq API Key"
echo ""
echo "🚀 Type 'claude' to start coding now!"
echo "=================================================================="
echo ""
