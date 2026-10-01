# 🚀 Termux Claude Code + Groq Cloud (100% Free Autonomous AI Agent)

Run Anthropic's official **Claude Code AI Agent** natively on **Android (Termux)** powered by **Groq Cloud's ultra-fast LPU inference (14,400 Requests/Day for Free)** without requiring any paid subscription, cloud desktop, or PC.

---

## ✨ Features (মূল বৈশিষ্ট্যসমূহ)

- 💸 **১০০% সম্পূর্ণ ফ্রি:** কোনো পেইড প্ল্যান বা ক্রেডিট কার্ডের প্রয়োজন নেই।
- ⚡ **১৪,৪০০ ফ্রি রিকোয়েস্ট/দিন:** Groq Cloud-এর সুপারফাস্ট LPU সার্ভার ব্যবহার করে প্রতিদিন হাজার হাজার কাজ করান।
- 🧠 **টপ-টিয়ার মডেলসমূহ:**
  - `openai/gpt-oss-120b` (১২০ বিলিয়ন ডিপ রিজনিং - কঠিন কোড ও এরর ফিক্সিং)
  - `qwen/qwen3.8-27b` (সুপারফাস্ট কোডিং - কোনো ওয়েট টাইম নেই)
  - `openai/gpt-oss-20b` (লাইটওয়েট ও ইনস্ট্যান্ট চ্যাট)
- 📱 **Native Android (Termux):** কোনো Proot/Ubuntu ছাড়াই সরাসরি টার্মাক্সে চলে।
- 🎬 **Background Execution (Tmux):** এজেন্টকে কাজ দিয়ে আপনি সোজা YouTube, গেমস বা যেকোনো কাজ করতে পারবেন।
- 🔄 **ডায়নামিক মডেল সুইচার:** Claude Code-এর ভেতরেই `/model` লিখে রানিং সেশনেই মডেল পরিবর্তন করুন।
- 🔑 **সহজ API Key পরিবর্তন:** `set-key` কমান্ড দিয়ে যেকোনো সময় নতুন API Key বসান।

---

## ⚡ 1-Click Installation (এক ক্লিকে ইনস্টল)

টার্মাক্স সম্পূর্ণ ফ্রেশ বা নতুন ফোনে সেটআপ করতে টার্মিনালে শুধু এই ১টি কমান্ড পেস্ট করুন:

```bash
curl -fsSL https://raw.githubusercontent.com/myabdur212121-afk/termux-claude-groq/main/install.sh | bash
```

> **নোট:** ইনস্টলেশনের সময় আপনার ফ্রি Groq API Key চাইবে। Key পেতে [console.groq.com/keys](https://console.groq.com/keys)-এ গিয়ে ফ্রি সাইন-ইন করে Key কপি করে নিন।

---

## 🎮 How to Use (কীভাবে ব্যবহার করবেন)

### ১. সাধারণ মোডে চালানো
টার্মিনালে সরাসরি লিখুন:
```bash
claude
```

### ২. ব্যাকগ্রাউন্ড মোডে চালানো (Best for Long Coding / Rendering)
এজেন্টকে দীর্ঘ কোনো কাজ দিয়ে ব্যাকগ্রাউন্ডে চালাতে:
```bash
start-agent
```
*(এরপর হোম বাটনে চাপ দিয়ে YouTube দেখুন বা ফোন লক করে রাখুন)*

- **কাজের অগ্রগতি দেখতে:**
  ```bash
  check-agent
  ```
- **কাজ শেষ হলে সম্পূর্ণ বন্ধ ও ব্যাটারি সেভ করতে:**
  ```bash
  stop-agent
  ```

---

## 🔄 How to Switch Models (মডেল পরিবর্তনের নিয়ম)

### অপশন ১: Claude Code-এর ভেতর থেকে
Claude Code চলার সময় সরাসরি চ্যাটে লিখুন:
```text
/model
```
- **`opus`** সিলেক্ট করলে 👉 **120B Reasoning Model** চলবে (কঠিন লজিক ও বাগ ফিক্সিং)।
- **`sonnet`** সিলেক্ট করলে 👉 **Qwen 27B Superfast Model** চলবে (ঝড়োগতির কোডিং)।
- **`haiku`** সিলেক্ট করলে 👉 **20B Lightweight Model** চলবে।

### অপশন ২: টার্মিনাল মেনু থেকে
টার্মিনালে লিখুন:
```bash
switch-model
```
এবং ১, ২ বা ৩ নম্বর বেছে নিন।

---

## 🔑 Update API Key (কী পরিবর্তন করা)

ভবিষ্যতে কখনো Groq API Key পরিবর্তন করতে চাইলে টার্মিনালে লিখুন:

```bash
set-key gsk_your_new_api_key_here
```
*(অথবা শুধু `set-key` লিখে Enter দিয়ে নতুন Key পেস্ট করুন)*

---

## 🛠️ Project Structure (প্রজেক্টের ফাইলসমূহ)

```text
termux-claude-groq/
├── install.sh         # ১-ক্লিকে সম্পূর্ণ পরিবেশ সেটআপ করার স্ক্রিপ্ট
├── groq_bridge.js     # Anthropic Messages API -> Groq Cloud স্মার্ট অনুবাদক
├── set-key.sh         # Groq API Key ম্যানেজমেন্ট স্ক্রিপ্ট
├── switch-model.sh    # টার্মিনাল মডেল সিলেক্টর
├── docs/              # পূর্ণাঙ্গ ইঞ্জিনিয়ারিং ডকুমেন্টেশন ও ADR
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_CHRONOLOGICAL_ERRORS.md
│   ├── 03_SYSTEM_ARCHITECTURE.md
│   ├── 04_BACKGROUND_AGENT_GUIDE.md
│   └── 05_GUIDE_FOR_FUTURE_AI.md
└── README.md          # ডকুমেন্টেশন ও গাইড
```

---

## 📚 Complete Engineering Documentation (`docs/`)
এই প্রজেক্টের পেছনে প্রতিটি সমস্যা, এরর সমাধান এবং সিস্টেম আর্কিটেকচারের বিস্তারিত ইতিহাস `docs/` ফোল্ডারে সংরক্ষিত আছে:
- 📖 [01. Project Overview & Background](docs/01_PROJECT_OVERVIEW.md)
- 🚨 [02. Roadblocks & Errors Log (কি কি সমস্যা হয়েছিল ও সমাধান)](docs/02_CHRONOLOGICAL_ERRORS.md)
- 🏗️ [03. System Architecture & Bridge Protocol](docs/03_SYSTEM_ARCHITECTURE.md)
- 📱 [04. Android Background & Tmux Execution](docs/04_BACKGROUND_AGENT_GUIDE.md)
- 🤖 [05. Master Briefing for Future AI Assistants](docs/05_GUIDE_FOR_FUTURE_AI.md)

---

## 🤝 Troubleshooting & Tips

1. **Rate Limit নোটিশ আসলে:** ১২০B মডেলের প্রতি মিনিটে ৮,০০০ টোকেনের লিমিট থাকে। খুব দ্রুত বড় কোড লিখলে ৭-৮ সেকেন্ড বিরতি নিতে পারে। বিরতি ছাড়া একটানা কাজ করতে `/model sonnet` দিয়ে Qwen মডেলে সুইচ করুন।
2. **ফোল্ডার ট্রাস্ট:** স্ক্রিপ্টটি স্বয়ংক্রিয়ভাবে টার্মাক্সের হোম ডিরেক্টরি পার্মানেন্টলি ট্রাস্ট করে রাখে, তাই বারবার অনুমতি চাওয়া বন্ধ থাকে।

---

### 💖 Credits & License
- Powered by [Anthropic Claude Code](https://code.claude.com/)
- High-Speed Inference by [Groq Cloud](https://groq.com/)
- Termux Native binary by [ferrumclaudepilgrim](https://github.com/ferrumclaudepilgrim/claude-code-android)
- Open-Source under MIT License.
