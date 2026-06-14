# Cybernetics Agent ☤

**A self-improving personal AI agent.** It's an agent with a built-in learning loop — it creates skills from experience, improves them during use, nudges itself to persist knowledge, searches its own past conversations, and builds a deepening model of who you are across sessions. Run it on a $5 VPS, a GPU cluster, or serverless infrastructure that costs nearly nothing when idle. It's not tied to your laptop — talk to it from Telegram while it works on a cloud VM.

Use any model you want — [OpenRouter](https://openrouter.ai) (200+ models), [NovitaAI](https://novita.ai) (AI-native cloud for Model API, Agent Sandbox, and GPU Cloud), [NVIDIA NIM](https://build.nvidia.com) (Nemotron), [Xiaomi MiMo](https://platform.xiaomimimo.com), [z.ai/GLM](https://z.ai), [Kimi/Moonshot](https://platform.moonshot.ai), [MiniMax](https://www.minimax.io), [Hugging Face](https://huggingface.co), OpenAI, or your own endpoint. Switch with `cybernetics model` — no code changes, no lock-in.

<table>
<tr><td><b>A real terminal interface</b></td><td>Full TUI with multiline editing, slash-command autocomplete, conversation history, interrupt-and-redirect, and streaming tool output.</td></tr>
<tr><td><b>Lives where you do</b></td><td>Telegram, Discord, Slack, WhatsApp, Signal, and CLI — all from a single gateway process. Voice memo transcription, cross-platform conversation continuity.</td></tr>
<tr><td><b>A closed learning loop</b></td><td>Agent-curated memory with periodic nudges. Autonomous skill creation after complex tasks. Skills self-improve during use. FTS5 session search with LLM summarization for cross-session recall. <a href="https://github.com/plastic-labs/honcho">Honcho</a> dialectic user modeling. Compatible with the <a href="https://agentskills.io">agentskills.io</a> open standard.</td></tr>
<tr><td><b>Scheduled automations</b></td><td>Built-in cron scheduler with delivery to any platform. Daily reports, nightly backups, weekly audits — all in natural language, running unattended.</td></tr>
<tr><td><b>Delegates and parallelizes</b></td><td>Spawn isolated subagents for parallel workstreams. Write Python scripts that call tools via RPC, collapsing multi-step pipelines into zero-context-cost turns.</td></tr>
<tr><td><b>Runs anywhere, not just your laptop</b></td><td>Six terminal backends — local, Docker, SSH, Singularity, Modal, and Daytona. Daytona and Modal offer serverless persistence — your agent's environment hibernates when idle and wakes on demand, costing nearly nothing between sessions. Run it on a $5 VPS or a GPU cluster.</td></tr>
<tr><td><b>Research-ready</b></td><td>Batch trajectory generation, trajectory compression for training the next generation of tool-calling models.</td></tr>
</table>

---

## Quick Install

### Linux, macOS, WSL2 — one-liner

```bash
curl -fsSL https://raw.githubusercontent.com/Avarile/cybernetics-agent/main/scripts/install.sh | bash
```

### Windows (PowerShell) — one-liner

```powershell
iex (irm https://raw.githubusercontent.com/Avarile/cybernetics-agent/main/scripts/install.ps1)
```

### Manual / dev install (git clone)

```bash
git clone https://github.com/Avarile/cybernetics-agent.git
cd cybernetics-agent
./setup-cybernetics.sh
```

Either path installs `uv`, creates a `.venv` with Python 3.11, installs the project with extras, and symlinks `~/.local/bin/cybernetics` (with `hermes` as a legacy alias) so the command is on your `PATH`.

After installation:

```bash
source ~/.bashrc    # reload shell (or: source ~/.zshrc)
cybernetics         # start chatting!
```

---

## Getting Started

```bash
cybernetics              # Interactive CLI — start a conversation
cybernetics model        # Choose your LLM provider and model
cybernetics tools        # Configure which tools are enabled
cybernetics config set   # Set individual config values
cybernetics gateway      # Start the messaging gateway (Telegram, Discord, etc.)
cybernetics setup        # Run the full setup wizard (configures everything at once)
cybernetics update       # Update to the latest version
cybernetics doctor       # Diagnose any issues
```

---

## CLI vs Messaging Quick Reference

Cybernetics has two entry points: start the terminal UI with `cybernetics`, or run the gateway and talk to it from Telegram, Discord, Slack, WhatsApp, Signal, or Email. Once you're in a conversation, many slash commands are shared across both interfaces.

| Action                         | CLI                                           | Messaging platforms                                                                        |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Start chatting                 | `cybernetics`                                 | Run `cybernetics gateway setup` + `cybernetics gateway start`, then send the bot a message |
| Start fresh conversation       | `/new` or `/reset`                            | `/new` or `/reset`                                                                         |
| Change model                   | `/model [provider:model]`                     | `/model [provider:model]`                                                                  |
| Set a personality              | `/personality [name]`                         | `/personality [name]`                                                                      |
| Retry or undo the last turn    | `/retry`, `/undo`                             | `/retry`, `/undo`                                                                          |
| Compress context / check usage | `/compress`, `/usage`, `/insights [--days N]` | `/compress`, `/usage`, `/insights [days]`                                                  |
| Browse skills                  | `/skills` or `/<skill-name>`                  | `/<skill-name>`                                                                            |
| Interrupt current work         | `Ctrl+C` or send a new message                | `/stop` or send a new message                                                              |
| Platform-specific status       | `/platforms`                                  | `/status`, `/sethome`                                                                      |

---

## Contributing

Quick start for contributors:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv venv .venv --python 3.11
source .venv/bin/activate
uv pip install -e ".[all,dev]"
scripts/run_tests.sh
```

---

## License

MIT — see [LICENSE](LICENSE).
