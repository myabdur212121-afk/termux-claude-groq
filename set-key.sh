#!/bin/bash
# Tool to easily set or change the Groq API key in Termux

KEY="$1"

if [ -z "$KEY" ]; then
    echo "=============================================="
    echo "       🔑 Set Your Free Groq API Key"
    echo "=============================================="
    echo "Get your free API key at: https://console.groq.com/keys"
    echo ""
    read -p "Enter Groq API Key (starts with gsk_): " KEY
fi

KEY=$(echo "$KEY" | tr -d '[:space:]')

if [ -z "$KEY" ] || [[ ! "$KEY" =~ ^gsk_ ]]; then
    echo ""
    echo "❌ Invalid API key format! Groq keys must start with 'gsk_'."
    echo "Example: gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

# Save to ~/.groq_key
echo "$KEY" > "$HOME/.groq_key"
chmod 600 "$HOME/.groq_key"

# Update in ~/.bashrc if present
sed -i '/export GROQ_API_KEY=/d' "$HOME/.bashrc" 2>/dev/null || true
echo "export GROQ_API_KEY=\"$KEY\"" >> "$HOME/.bashrc"

echo ""
echo "✅ Groq API Key updated successfully!"
echo "✨ You can now run 'claude' or 'start-agent' anytime."
echo ""
