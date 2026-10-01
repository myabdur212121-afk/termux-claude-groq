#!/bin/bash
# Tool to switch default model for Claude Code & Groq Bridge

echo ""
echo "=================================================="
echo "          🤖 Groq AI Model Selector"
echo "=================================================="
echo "  1) openai/gpt-oss-120b  (🔥 120B Deep Reasoning - Best for complex code & math)"
echo "  2) qwen/qwen3.8-27b     (⚡ 27B Super Fast - Highest rate limit, no waiting)"
echo "  3) openai/gpt-oss-20b   (🚀 20B Lightweight - Ultra fast chat)"
echo "=================================================="
read -p "Select Model [1-3]: " choice

case $choice in
    1)
        SELECTED="openai/gpt-oss-120b"
        ;;
    2)
        SELECTED="qwen/qwen3.8-27b"
        ;;
    3)
        SELECTED="openai/gpt-oss-20b"
        ;;
    *)
        echo "❌ Invalid choice! No changes made."
        exit 1
        ;;
esac

sed -i '/export ANTHROPIC_MODEL=/d' "$HOME/.bashrc" 2>/dev/null || true
echo "export ANTHROPIC_MODEL=\"$SELECTED\"" >> "$HOME/.bashrc"

echo ""
echo "✅ Default model switched to: $SELECTED"
echo "💡 Tip: You can also change models inside Claude Code by typing /model"
echo ""
