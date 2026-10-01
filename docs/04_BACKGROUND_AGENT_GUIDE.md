# 📱 Part 4: Background Agent Execution & Lifecycle

## 🔋 1. Why Background Management is Required on Android
Android's aggressive battery optimization and Low Memory Killer (LMK) will freeze or terminate background apps (including Termux) unless explicitly told not to.

To allow the user to give a large task to the AI, switch to YouTube/games, and let the agent work uninterrupted, two tools are used:
1. **`termux-wake-lock`**: Prevents the CPU from entering deep sleep state while Termux processes tasks.
2. **`tmux` (Terminal Multiplexer)**: Decouples the terminal session from the active graphical window so processes do not die when the app UI is detached or swiped.

---

## 🎮 2. Commands & Workflow

```
   [start-agent] ───► Acquires wake-lock + launches Claude in Tmux session 'agent-session'
          │
          ▼
   (User minimizes Termux / locks phone / watches YouTube)
          │
          ▼
   [check-agent] ───► Re-attaches to 'agent-session' to inspect live progress
          │
          ▼
   [stop-agent]  ───► Kills tmux session, terminates bridge, releases wake-lock (saves battery)
```

---

## 🛠️ 3. Command Breakdown

### 🚀 `start-agent`
- Calls `termux-wake-lock`.
- Checks if `agent-session` already exists:
  - If yes, reconnects to it.
  - If no, spins up a new tmux session and launches Claude Code with the Groq bridge.

### 🔍 `check-agent`
- Checks for an active `agent-session`.
- Attaches the terminal to the running agent so the user can see live outputs.
- *(Note: If the user simply re-opens Termux without closing tabs, the screen is already visible without needing any command).*

### 🛑 `stop-agent`
- Terminates `agent-session` (`tmux kill-session -t agent-session`).
- Kills any lingering `groq_bridge.js` Node.js processes.
- Calls `termux-wake-unlock` to restore normal phone battery sleep mode.
