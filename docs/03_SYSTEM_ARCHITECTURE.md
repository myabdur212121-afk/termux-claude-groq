# 🏗️ Part 3: System Architecture & Bridge Mechanics

## 📐 1. Architecture Flowchart

```
┌────────────────────────────────────────────────────────┐
│               Android / Termux User Space              │
│                                                        │
│   ┌────────────────────┐         ┌──────────────────┐  │
│   │ Claude Code CLI    │ ──────► │ groq_bridge.js   │  │
│   │ (Anthropic Schema) │ :3000   │ (Local Node.js)  │  │
│   └────────────────────┘         └────────┬─────────┘  │
│                                           │            │
└───────────────────────────────────────────┼────────────┘
                                            │ HTTPS (Encrypted)
                                            ▼
                       ┌──────────────────────────────┐
                       │       Groq Cloud LPU         │
                       │ api.groq.com/openai/v1       │
                       │ (14,400 Free Requests/Day)   │
                       └──────────────────────────────┘
```

---

## 🔄 2. The Bridge Translation Layer (`groq_bridge.js`)

Claude Code expects an Anthropic Messages API (`/v1/messages`), while Groq Cloud exposes an OpenAI-compatible Chat Completions API (`/openai/v1/chat/completions`).

`groq_bridge.js` acts as an in-memory bi-directional translator:

### Request Ingestion (Anthropic -> OpenAI format)
1. **System Prompt Transformation:** Flattens array-based or string-based `system` blocks into `{ role: "system", content: "..." }`.
2. **Message Array Normalization:** Extracts text strings out of complex nested arrays (`content: [{type: 'text', text: '...'}]`).
3. **Dynamic Model Routing:** Automatically inspects the requested model name:

| Requested Alias in Claude Code | Forwarded Groq Cloud Model | Best Use Case |
|---|---|---|
| `opus` or `120b` | **`openai/gpt-oss-120b`** | Complex coding, deep reasoning, bug triage |
| `sonnet` or `qwen` | **`qwen/qwen3.8-27b`** | High-speed code generation (no TPM wait) |
| `haiku` or `20b` | **`openai/gpt-oss-20b`** | Lightweight, instant conversational turns |

### Response Translation (OpenAI -> Anthropic format)
Wraps Groq's completion choice into an Anthropic response object:
```json
{
  "id": "msg_timestamp",
  "type": "message",
  "role": "assistant",
  "content": [{ "type": "text", "text": "Model output" }],
  "model": "model_id",
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 10, "output_tokens": 20 }
}
```

---

## 🔑 3. Key Lookup Hierarchy
To avoid hardcoding sensitive secrets into git:
1. First checks `process.env.GROQ_API_KEY`.
2. If empty, reads from `$HOME/.groq_key` (persisted securely with 600 permissions).
3. If no key is found, returns HTTP 401 with a friendly instruction to run `set-key`.
