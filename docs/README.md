# 📚 Documentation & Engineering Archive Index

This directory contains the modular architecture decision records (ADRs) and engineering breakdown for the **Termux Claude Code + Groq Cloud** project.

---

### 📑 Modular Breakdown:

1. **[01_PROJECT_OVERVIEW.md](./01_PROJECT_OVERVIEW.md)**
   - Core objectives, phone constraints, why Groq Cloud was selected, Bangladesh regional factors.

2. **[02_CHRONOLOGICAL_ERRORS.md](./02_CHRONOLOGICAL_ERRORS.md)**
   - Complete technical error log: Python 3.14 build errors, Android Bionic libc mismatch, OpenRouter 429 rate limit, Antomix 401 bug, trust prompt loop.

3. **[03_SYSTEM_ARCHITECTURE.md](./03_SYSTEM_ARCHITECTURE.md)**
   - Flowchart, bi-directional translation mechanics (`groq_bridge.js`), dynamic model routing, key lookup hierarchy.

4. **[04_BACKGROUND_AGENT_GUIDE.md](./04_BACKGROUND_AGENT_GUIDE.md)**
   - Background execution lifecycle, Android wake-lock mechanics, Tmux management (`start-agent`, `check-agent`, `stop-agent`).

5. **[05_GUIDE_FOR_FUTURE_AI.md](./05_GUIDE_FOR_FUTURE_AI.md)**
   - Master technical briefing and instructions for any future AI assistant assisting the user.
