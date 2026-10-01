# 🚨 Part 2: Chronological Error Log & Troubleshooting Archive

This document records the exact roadblocks encountered during the creation of this environment and how each was systematically solved.

---

### Roadblock 1: Python 3.14 `ImpImporter` Build Error (Aider / Numpy)
- **Symptom:** Running `pip install aider-chat` on Termux failed with:
  ```text
  AttributeError: module 'pkgutil' has no attribute 'ImpImporter'
  ERROR: Failed to build 'numpy' when getting requirements to build wheel
  ```
- **Root Cause:** Termux updated to Python 3.14. Older dependencies (e.g. `numpy 1.24.3`) rely on deprecated CPython APIs (`ImpImporter` removed in 3.14).
- **Resolution:** Moved away from Python CLI compilation towards Node.js-based Anthropic Claude Code engine, bypassing Python C-extension build issues.

---

### Roadblock 2: Android `linux-arm64-android` Bionic Libc Mismatch
- **Symptom:** Running `npm install -g @anthropic-ai/claude-code` followed by `claude` yielded:
  ```text
  [@anthropic-ai/claude-code postinstall] Native binaries for linux-arm64-android are not available on this release channel.
  ```
- **Root Cause:** Anthropic ships Claude Code binaries compiled for standard Linux `glibc` (`linux-arm64`), whereas Termux runs on Android's Bionic `libc`.
- **Resolution:** Used the community-vetted glibc-runner patch wrapper (`ferrumclaudepilgrim/claude-code-android`), which dynamically loads `glibc` inside Termux without requiring a heavyweight PRoot/Ubuntu container.

---

### Roadblock 3: OpenRouter Free Tier Rate Limit (429 Exceeded)
- **Symptom:** Claude Code with OpenRouter free models threw:
  ```text
  API Error: Request rejected (429) · Rate limit exceeded: free-models-per-day.
  ```
- **Root Cause:** OpenRouter caps free accounts at ~50 requests per day. An autonomous coding agent burns 50 requests within 10–15 minutes of terminal inspection and debugging loops.
- **Resolution:** Replaced OpenRouter with **Groq Cloud API**, which provides **14,400 requests per day** and **30 requests per minute** on their free tier.

---

### Roadblock 4: Antomix Proxy 401 OpenAI Fallback Bug
- **Symptom:** Running `antomix claude --profile groq` resulted in:
  ```text
  Destination Error: Incorrect API key provided: $OPENAI_***_KEY.
  ```
- **Root Cause:** The `antomix` npm package has an internal bug in v1.4.x where its built-in `groq` profile defaults to `https://api.openai.com` unless OpenAI keys are supplied.
- **Resolution:** Removed the buggy third-party proxy and built our own custom zero-dependency bridge (`groq_bridge.js`, ~100 lines of pure Node.js HTTP/HTTPS).

---

### Roadblock 5: Claude Code Array-of-Objects System Parsing Bug
- **Symptom:** Claude Code always replied with a hardcoded fallback string (`Hello from Groq!`) regardless of user prompt.
- **Root Cause:** Claude Code formats system prompts and messages as arrays of objects: `system: [{"type": "text", "text": "..."}]` and `content: [{"type": "text", "text": "..."}]`. A simple string cast resulted in `[object Object]` sent to Groq.
- **Resolution:** Implemented recursive mapping inside `groq_bridge.js` to extract text from both string and array payloads seamlessly.

---

### Roadblock 6: Termux System Conflict with `cc` Alias
- **Symptom:** Creating an alias `cc="claude"` broke with:
  ```text
  cc: error: no input files
  ```
- **Root Cause:** `cc` is the system C compiler (symlink to `clang`) in Termux.
- **Resolution:** Created a dedicated binary `$PREFIX/bin/cl` and alias `claude="cl"`, avoiding system compiler name collisions.

---

### Roadblock 7: Continuous "Do You Trust This Folder?" Startup Dialog
- **Symptom:** Claude Code repeatedly prompted: `Quick safety check: Is this a project you created or one you trust?` on every invocation.
- **Root Cause:** Interactive trust state is cached in `~/.claude.json` under `projects`.
- **Resolution:** Pre-configured `~/.claude.json` and `~/.claude/settings.json` with `"hasTrustDialogAccepted": true` and wildcards for `/data/data/com.termux/files/home/*`.
