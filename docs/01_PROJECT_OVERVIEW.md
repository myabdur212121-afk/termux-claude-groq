# 📖 Part 1: Project Overview & Context

## 🎯 1. The Core Objective
The goal of this project is to create a **100% Free, Autonomous Agentic AI Environment** running natively on an **Android Phone via Termux** (ARM64 architecture) without needing a PC, root permissions, or paid subscriptions.

### Why this setup was built:
1. **Autonomous Execution:** The user required an AI agent (like Claude Code) that can navigate directories, read/edit source files, execute bash/python scripts, debug compiler errors, and render headless libraries (such as Manim / ManimGL) autonomously.
2. **True Unlimited Free Access:** Traditional free AI services hit aggressive rate limits (e.g. 50 requests/day). Agentic loops burn 50+ requests in 10 minutes. This project connects the agent to **Groq Cloud's LPU infrastructure** granting **14,400 free requests per day**.
3. **Native Phone Experience:** Operates completely on-device in Termux with background execution support (Tmux + Wake Lock) so the user can multitask (e.g., watch YouTube) while the AI works.

---

## 🌍 2. Environmental & Regional Context
- **User Location:** Bangladesh.
- **Hardware:** Android ARM64 Smartphone.
- **Runtime:** Termux (Android Bionic Libc).
- **Network Constraints:** Certain cloud tools (such as Google Project IDX, NVIDIA NIM APIs) face regional restrictions, waitlists, or payment card requirements in Bangladesh.
- **Provider Chosen:** **Groq Cloud** ([console.groq.com](https://console.groq.com/)) — completely open, no region locks, zero credit card requirements, instant free API keys.

---

## 💡 3. What Was Built
1. **`install.sh`**: A one-line bootstrap installer that sets up the full stack from scratch.
2. **`groq_bridge.js`**: A zero-dependency local Node.js proxy translating Anthropic Messages API protocol into Groq Cloud OpenAI-compatible endpoints with dynamic model routing.
3. **`set-key.sh`**: A CLI utility to update Groq API keys instantly without opening source code.
4. **`switch-model.sh`**: Interactive CLI to toggle between 120B reasoning and 27B high-speed models.
5. **Background Process Management**: Seamless tmux wrappers (`start-agent`, `check-agent`, `stop-agent`).
