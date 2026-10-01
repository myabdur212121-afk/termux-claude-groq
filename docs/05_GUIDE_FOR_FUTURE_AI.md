# 🤖 Part 5: Direct Briefing for Future AI Assistants

> **Notice for any AI reading this file:** 
> This document is designed to give you instant full-context regarding this user's environment. Read this carefully before providing technical recommendations.

---

## 📌 1. User & Environment Profile
- **User Location:** Bangladesh (some providers like Project IDX / NVIDIA NIM may have regional blocks or payment requirements).
- **Environment:** Android ARM64 Smartphone running Termux.
- **Core Goal:** Running a completely free, high-volume autonomous coding agent (Claude Code) natively on Termux.
- **Active Backend:** **Groq Cloud API** (`https://api.groq.com/openai/v1`).

---

## ⚠️ 2. Crucial Guidelines (DO NOT REPEAT THESE MISTAKES)
1. **DO NOT suggest OpenRouter free models:** OpenRouter's free tier is strictly capped at ~50 requests/day. An agent burns this in minutes and throws `429 Rate Limit`.
2. **DO NOT suggest `npm install -g antomix`:** Antomix v1.4.x has a known bug where its Groq profile falls back to `api.openai.com` with a 401 error.
3. **DO NOT compile Python CLI agents with old C-extensions:** Termux Python is version 3.14+; tools like older `aider-chat` fail on `numpy 1.24` / `ImpImporter`.
4. **DO NOT break `~/.groq_bridge.js`:** The custom Node.js bridge is the translation engine. It handles array-based system and message payloads correctly.

---

## 📂 3. Key File Locations on Device

| File | Purpose |
|---|---|
| `$HOME/.groq_key` | Contains user's active Groq API Key (starts with `gsk_`). |
| `$HOME/.groq_bridge.js` | The active proxy translating Anthropic Messages API -> Groq Cloud. |
| `$PREFIX/bin/cl` | Global launcher script that spawns the bridge and invokes `claude`. |
| `$PREFIX/bin/set-key` | CLI tool to update the Groq key cleanly. |
| `$PREFIX/bin/switch-model` | CLI tool to switch the default model. |
| `$PREFIX/bin/start-agent` | Wrapper to launch background execution via tmux + wake-lock. |
| `$PREFIX/bin/check-agent` | Wrapper to attach to running background agent. |
| `$PREFIX/bin/stop-agent` | Wrapper to terminate session, kill bridge, and unlock battery. |
| `$HOME/.claude.json` | Stores permanent workspace trust (`hasTrustDialogAccepted: true`). |

---

## 🔄 4. How to Add New Models
If Groq releases a new model, update the mapping in `$HOME/.groq_bridge.js` inside the `targetModel` router block.

---

## 🚀 5. Quick Verification Commands
If the user encounters an issue, tell them to run:
- Check bridge status: `node -c ~/.groq_bridge.js`
- Test key validity: `cat ~/.groq_key` (check if it starts with `gsk_`)
- Restart clean agent: `stop-agent && start-agent`
