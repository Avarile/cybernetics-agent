# HERMES → Cybernetics Brand Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all user-facing "Hermes"/"hermes" brand references with "Cybernetics"/"cybernetics" across display text, CLI binary name, Docker user/paths, skill directories, and documentation — without touching Python internals (`HERMES_HOME` env var, function names, module file names).

**Architecture:** Five sequential waves, each committed separately. Wave 1 handles user-visible strings. Wave 2 renames the CLI binary in packaging. Wave 3 updates Docker user and install paths. Wave 4 renames skill/plugin directories and their cross-references. Wave 5 cleans up website and internal docs. Each wave has a grep verification that should return zero hits before the wave is considered done.

**Tech Stack:** Python (pyproject.toml entry points), Bash (Docker shell scripts, install scripts), YAML (docker-compose), Markdown (SKILL.md manifests, docs), git (separate commit per wave).

**Spec:** `docs/design/2026-06-15-hermes-cybernetics-brand-rename-design.md`

---

## Invariants — never touch these

These identifiers must remain unchanged throughout all tasks:

- `HERMES_HOME` env var name (and `HERMES_OPTIONAL_SKILLS`, `HERMES_BUNDLED_SKILLS`, `HERMES_OPTIONAL_MCPS`)
- All Python function names: `get_hermes_home()`, `display_hermes_home()`, `set_hermes_home_override()`, `reset_hermes_home_override()`, `get_hermes_dir()`, `get_default_hermes_root()`
- All Python module files: `hermes_constants.py`, `hermes_cli/` (the directory), `hermes_logging.py`, `hermes_state.py`, `hermes_time.py`, `hermes_bootstrap.py`
- All test files in `tests/hermes_cli/` and files named `test_hermes_*.py`
- `node_modules/hermes-*` (Facebook Hermes JS engine)
- Image assets: `hermes.png`, `hermes-sprite.png`, `hermes-frames/`

---

## Wave 1 — Display Text & System Prompts

### Task 1: Fix user-facing strings in agent/prompt_builder.py and agent/system_prompt.py

**Files:**
- Modify: `agent/prompt_builder.py`
- Modify: `agent/system_prompt.py`

- [ ] **Step 1: Audit current Hermes strings in these two files**

```bash
grep -n '"[Hh]ermes\|~/.hermes\|hermes agent\|Hermes Agent' \
  agent/prompt_builder.py agent/system_prompt.py \
  | grep -v "HERMES_HOME\|get_hermes\|hermes_constants\|hermes_cli\|hermes_log\|import hermes"
```

Expected: several hits referencing "Hermes Agent", "~/.hermes/skills/", etc.

- [ ] **Step 2: Replace user-facing strings in agent/prompt_builder.py**

Target lines (from audit):
- Line ~137: `"the documentation at https://hermes-agent.nousresearch.com/docs is your "` — update display text only, not URL
- Line ~139: `"information. Load the \`hermes-agent\` skill with skill_view(name='hermes-agent')"` → change `hermes-agent` display to `cybernetics-agent`
- Line ~1134: string containing `~/.hermes/skills/` → `~/.cybernetics/skills/`
- Line ~1361: `"or troubleshoot Hermes Agent itself"` → `"or troubleshoot Cybernetics Agent itself"`
- Line ~464: `"the user can send an out-of-band message that Hermes "` → `"...that Cybernetics "`
- Lines ~700, ~727, ~748, ~887, ~888, ~898, ~906, ~913, ~925: Replace `"Hermes"` display name with `"Cybernetics"` in prose strings

For each, use Edit tool to replace the specific string. Preserve surrounding code exactly.

- [ ] **Step 3: Replace user-facing strings in agent/system_prompt.py**

Target lines (from audit):
- Lines ~295-296: `~/.hermes/skills/` path references in comment strings visible to users → `~/.cybernetics/skills/`

Run the audit command again narrowed to system_prompt.py and edit each hit.

- [ ] **Step 4: Verify zero hits remain**

```bash
grep -n '"[Hh]ermes\|~/.hermes\|Hermes Agent' \
  agent/prompt_builder.py agent/system_prompt.py \
  | grep -v "HERMES_HOME\|get_hermes\|hermes_constants\|hermes_cli\|hermes_log\|import hermes\|_HERMES_MD"
```

Expected: zero hits (lines with `_HERMES_MD_NAMES` are Python internals — ignore those).

- [ ] **Step 5: Commit**

```bash
git add agent/prompt_builder.py agent/system_prompt.py
git commit -m "brand(display): replace Hermes with Cybernetics in agent prompt strings"
```

---

### Task 2: Fix user-facing strings in hermes_cli/tips.py and hermes_cli/banner.py

**Files:**
- Modify: `hermes_cli/tips.py`
- Modify: `hermes_cli/banner.py`

- [ ] **Step 1: Audit current Hermes strings**

```bash
grep -n '"[Hh]ermes\|~/.hermes\|hermes-agent' \
  hermes_cli/tips.py hermes_cli/banner.py \
  | grep -v "HERMES_HOME\|get_hermes\|import hermes"
```

Expected: many hits — tips.py has ~20 strings with `"Hermes"` and `"~/.hermes/"`, banner.py has `"Hermes Agent v{VERSION}"` and PyPI package name `"hermes-agent"`.

- [ ] **Step 2: Replace all user-facing strings in hermes_cli/tips.py**

Full list of replacements (apply each with Edit tool):

```
"Hermes runs on 21 messaging platforms…"     → "Cybernetics runs on 21 messaging platforms…"
"Hermes loads project context from .hermes.md…" → "Cybernetics loads project context from .hermes.md…"
"~/.hermes/checkpoints/"                     → "~/.cybernetics/checkpoints/"
"~/.hermes/scripts/"                         → "~/.cybernetics/scripts/"
"~/.hermes/skills/.hub/audit.log"            → "~/.cybernetics/skills/.hub/audit.log"
"~/.hermes/interrupt_debug.log"              → "~/.cybernetics/interrupt_debug.log"
"~/.hermes/.env"                             → "~/.cybernetics/.env"   (all occurrences)
"~/.hermes/hooks/<name>/"                    → "~/.cybernetics/hooks/<name>/"
"~/.hermes/BOOT.md"                          → "~/.cybernetics/BOOT.md"
"~/.hermes/dashboard-themes/"               → "~/.cybernetics/dashboard-themes/"
"~/.hermes/dashboard-plugins/"              → "~/.cybernetics/dashboard-plugins/"
"~/.hermes/cache/piper-voices/"             → "~/.cybernetics/cache/piper-voices/"
"~/.hermes/skills/"                          → "~/.cybernetics/skills/"
"~/.hermes/plugins/"                         → "~/.cybernetics/plugins/"
"~/.hermes/skills/.hub/quarantine/"         → "~/.cybernetics/skills/.hub/quarantine/"
```

Use `replace_all=true` where a string appears multiple times identically across the file.

- [ ] **Step 3: Replace user-facing strings in hermes_cli/banner.py**

Target lines:
- Line ~235: `package: str = "hermes-agent"` — this is a PyPI package name lookup for update checks. Change the default to `"cybernetics-agent"` to match the new package name set in Task 4's pyproject.toml rename.
- Line ~327: `repo_dir = hermes_home / "hermes-agent"` → `repo_dir = hermes_home / "cybernetics-agent"`
- Line ~353: `repo_dir = hermes_home / "hermes-agent"` → `repo_dir = hermes_home / "cybernetics-agent"`
- Line ~479: `f"Hermes Agent v{VERSION} ({RELEASE_DATE})"` → `f"Cybernetics Agent v{VERSION} ({RELEASE_DATE})"`

- [ ] **Step 4: Verify zero hits**

```bash
grep -n '"[Hh]ermes\|~/.hermes' hermes_cli/tips.py hermes_cli/banner.py \
  | grep -v "HERMES_HOME\|get_hermes\|import hermes"
```

Expected: zero hits.

- [ ] **Step 5: Commit**

```bash
git add hermes_cli/tips.py hermes_cli/banner.py
git commit -m "brand(display): replace Hermes with Cybernetics in tips and banner"
```

---

### Task 3: Fix user-facing strings in hermes_cli/gateway.py, doctor.py, default_soul.py, and remaining cli files

**Files:**
- Modify: `hermes_cli/gateway.py`
- Modify: `hermes_cli/doctor.py`
- Modify: `hermes_cli/default_soul.py`
- Modify: `hermes_cli/goals.py`
- Modify: `hermes_cli/auth.py` (docstring)

- [ ] **Step 1: Audit remaining hermes_cli/ display strings**

```bash
grep -rn '"[Hh]ermes\|~/.hermes\| hermes \| hermes$' hermes_cli/ \
  | grep -v "HERMES_HOME\|get_hermes\|hermes_constants\|hermes_cli\|hermes_log\|from hermes\|import hermes\|hermes_home\|_hermes_"
```

- [ ] **Step 2: Fix hermes_cli/gateway.py**

Replace user-visible display strings (leave internal Python logic strings untouched):

```
"Hermes Agent Gateway - Messaging Platform Integration"  → "Cybernetics Agent Gateway - Messaging Platform Integration"
"  3. Hermes will store the returned account_id/token"  → "  3. Cybernetics will store the returned account_id/token"
'signal-cli link -n "HermesAgent"'                      → 'signal-cli link -n "CyberneticsAgent"'
"Set these env vars in ~/.hermes/.env"                  → "Set these env vars in ~/.cybernetics/.env"
"~/.hermes/logs/gateway.log"   (all occurrences)        → "~/.cybernetics/logs/gateway.log"
"~/.hermes/.env"               (all occurrences)        → "~/.cybernetics/.env"
"~/.hermes/plugins/"                                    → "~/.cybernetics/plugins/"
```

**Do NOT change** these internal strings (they are process-matching logic, not display text):
```python
"hermes_cli.main gateway"      # process name match — internal
"hermes_cli.main --profile"    # process name match — internal
"hermes_cli/main.py gateway"   # process name match — internal
"hermes.exe gateway"           # process name match — internal
"hermes-gateway.exe"           # process name match — internal
"hermes_home="                 # env var check — internal
```

- [ ] **Step 3: Fix hermes_cli/doctor.py**

```
"Diagnoses issues with Hermes Agent setup."   (module docstring)  → "Diagnoses issues with Cybernetics Agent setup."
"Check ~/.hermes/config.yaml is writable."    → "Check ~/.cybernetics/config.yaml is writable."
"~/.hermes/.env"      (all display occurrences)  → "~/.cybernetics/.env"
"~/.hermes/config.yaml"                          → "~/.cybernetics/config.yaml"
"(check ~/.hermes/.env or run 'cybernetics setup')"  (already has cybernetics — verify OK)
```

Note: line 20 has `_DHH = display_hermes_home()` — `display_hermes_home()` is a Python internal (not renamed), but the variable `_DHH` is fine as-is. The variable is only used for display and already returns the right path.

- [ ] **Step 4: Fix hermes_cli/default_soul.py**

```bash
grep -n '"[Hh]ermes\|~/.hermes' hermes_cli/default_soul.py \
  | grep -v "HERMES_HOME\|get_hermes\|import hermes"
```

Replace any display strings found.

- [ ] **Step 5: Fix hermes_cli/goals.py and hermes_cli/auth.py**

```
# goals.py line ~702:
"model in ~/.hermes/config.yaml:\n"  → "model in ~/.cybernetics/config.yaml:\n"

# auth.py module docstring line ~6:
"is persisted in ~/.hermes/auth.json"  → "is persisted in ~/.cybernetics/auth.json"
```

- [ ] **Step 6: Check tests for assertions on display strings that will break**

```bash
grep -rn '"Hermes\|Hermes Agent\|~/.hermes' tests/ \
  | grep -v "HERMES_HOME\|get_hermes\|hermes_constants\|hermes_cli\b\|hermes_log\|test_hermes_\|test_nous_hermes" \
  | grep "assert\|==\|in result\|in output\|in text" | head -30
```

For any test that asserts a display string containing "Hermes", update the expected string to "Cybernetics".

- [ ] **Step 7: Verify Wave 1 complete**

```bash
grep -rn '"[Hh]ermes\|~/.hermes' agent/ hermes_cli/ \
  | grep -v "HERMES_HOME\|get_hermes\|hermes_constants\|hermes_cli\b\|hermes_log\|from hermes\|import hermes\|_HERMES_MD\|hermes_home\b\|_hermes_\|hermes_state\|hermes_time\|hermes_boot"
```

Expected: zero hits.

- [ ] **Step 8: Commit**

```bash
git add hermes_cli/gateway.py hermes_cli/doctor.py hermes_cli/default_soul.py \
        hermes_cli/goals.py hermes_cli/auth.py
git commit -m "brand(display): replace Hermes with Cybernetics in gateway, doctor, and cli display strings"
```

---

## Wave 2 — CLI Binary Name

### Task 4: Rename CLI entry points in pyproject.toml

**Files:**
- Modify: `pyproject.toml` (lines 272-275, the `[project.scripts]` section)

- [ ] **Step 1: Check current entry points**

```bash
grep -A5 "\[project.scripts\]" pyproject.toml
```

Expected output:
```toml
[project.scripts]
hermes = "hermes_cli.main:main"

hermes-acp = "acp_adapter.entry:main"
```

- [ ] **Step 2: Replace entry point names**

In `pyproject.toml`, change the `[project.scripts]` section to:

```toml
[project.scripts]
cybernetics = "hermes_cli.main:main"

cybernetics-acp = "acp_adapter.entry:main"
```

The Python module paths (`hermes_cli.main:main`, `acp_adapter.entry:main`) stay unchanged — only the binary name on the left changes.

- [ ] **Step 3: Update the package name in pyproject.toml**

Line 9: `name = "hermes-agent"` → `name = "cybernetics-agent"`

Also update any self-referential `"hermes-agent[...]"` strings in the optional extras/dependencies sections. These are PyPI package references that will be true once the package is republished under the new name:
```
"hermes-agent[cron]"  →  "cybernetics-agent[cron]"
```
(Apply to all ~15 occurrences in the extras sections.)

- [ ] **Step 4: Verify**

```bash
grep -n "hermes" pyproject.toml | grep -v "HERMES_HOME\|hermes_cli\|hermes_log\|hermes_state\|hermes_time\|hermes_boot\|hermes_const\|# "
```

Expected: zero hits (only comments and Python module paths with `hermes_cli` should remain).

- [ ] **Step 5: Commit**

```bash
git add pyproject.toml
git commit -m "brand(binary): rename hermes CLI entry points to cybernetics in pyproject.toml"
```

---

### Task 5: Update install scripts and docs referencing the hermes binary

**Files:**
- Modify: `scripts/install.sh`
- Modify: `setup-cybernetics.sh`
- Modify: `AGENTS.md`
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Audit binary references in install scripts**

```bash
grep -n "\bhermes\b" scripts/install.sh setup-cybernetics.sh \
  | grep -v "HERMES_HOME\|HERMES_UID\|HERMES_GID\|hermes_agent\|hermes_cli\|hermes-agent\b"
```

Focus on lines where `hermes` is used as a CLI command (e.g., `hermes setup`, `which hermes`, `hermes update`).

- [ ] **Step 2: Update scripts/install.sh**

Key replacements (use exact context from Step 1 output to avoid false matches):
```
which hermes           →  which cybernetics
hermes setup           →  cybernetics setup
hermes update          →  cybernetics update
"hermes command ready" →  "cybernetics command ready"
/usr/local/bin/hermes  →  /usr/local/bin/cybernetics   (any symlink paths)
```

**Do NOT change** these (they are path/variable identifiers, not display commands):
- `HERMES_BIN=` variable assignments (internal install logic)
- `/opt/hermes/` paths (Docker paths — handled in Wave 3)
- `hermes-agent` package name refs in pip install lines

Note: `install.sh` currently creates a legacy `hermes` symlink for backward compat. Since we're doing a clean break, remove that block (around lines 1581-1590 in the current file where it says "Legacy alias"):
```bash
# DELETE this block:
cat > "$command_link_dir/hermes" <<EOF
...
EOF
chmod +x "$command_link_dir/hermes"
log_success "Installed hermes alias → ..."
```

- [ ] **Step 3: Update setup-cybernetics.sh binary references**

```bash
grep -n "\bhermes\b" setup-cybernetics.sh | grep -v "HERMES_HOME\|hermes_cli\|hermes_agent"
```

Replace any `hermes` CLI command references with `cybernetics`.

- [ ] **Step 4: Update AGENTS.md and CONTRIBUTING.md**

```bash
grep -n "\bhermes\b\|Hermes" AGENTS.md CONTRIBUTING.md \
  | grep -v "HERMES_HOME\|hermes_cli\|hermes_log"
```

Replace `hermes` CLI command usage examples and "Hermes" display names. URLs pointing to the old repo can be noted in comments but not changed unless the repo has moved.

- [ ] **Step 5: Verify**

```bash
grep -rn "\bhermes\b" scripts/install.sh setup-cybernetics.sh AGENTS.md CONTRIBUTING.md \
  | grep -v "HERMES_HOME\|HERMES_UID\|HERMES_GID\|hermes_cli\|hermes_log\|hermes-agent\b\|# "
```

Expected: zero hits.

- [ ] **Step 6: Commit**

```bash
git add scripts/install.sh setup-cybernetics.sh AGENTS.md CONTRIBUTING.md
git commit -m "brand(binary): update hermes CLI command references to cybernetics in install scripts and docs"
```

---

## Wave 3 — Docker User & Paths

### Task 6: Update Dockerfile

**Files:**
- Modify: `Dockerfile`
- Modify: `scripts/test/Dockerfile.install-test` (if it contains hermes user refs)

- [ ] **Step 1: Audit Dockerfile**

```bash
grep -n "hermes\|Hermes" Dockerfile | grep -v "HERMES_HOME\|HERMES_UID\|HERMES_GID\|hermes_cli\|hermes_log\|hermes_agent\b\|hermes-ink\|@hermes\|node_modules"
```

Expected hits:
- `useradd ... hermes` (line ~89)
- `/opt/hermes` paths (WORKDIR, COPY, RUN chown)
- `chown=hermes:hermes` flags
- `/opt/hermes/.playwright`
- `main-hermes` s6 service name references

- [ ] **Step 2: Replace Docker user and paths in Dockerfile**

Apply these replacements (use Edit tool for each):

```
RUN useradd -u 10000 -m -d /opt/data hermes
→ RUN useradd -u 10000 -m -d /opt/data cybernetics

WORKDIR /opt/hermes
→ WORKDIR /opt/cybernetics

ENV PLAYWRIGHT_BROWSERS_PATH=/opt/hermes/.playwright
→ ENV PLAYWRIGHT_BROWSERS_PATH=/opt/cybernetics/.playwright

COPY --chown=hermes:hermes . .
→ COPY --chown=cybernetics:cybernetics . .

chown -R hermes:hermes /opt/hermes/.venv ...
→ chown -R cybernetics:cybernetics /opt/cybernetics/.venv ...

chmod -R a+rX /opt/hermes
→ chmod -R a+rX /opt/cybernetics

/opt/hermes/.hermes_build_sha
→ /opt/cybernetics/.cybernetics_build_sha

chown hermes:hermes /opt/hermes/.hermes_build_sha
→ chown cybernetics:cybernetics /opt/cybernetics/.cybernetics_build_sha

/opt/hermes/ (all remaining occurrences)
→ /opt/cybernetics/
```

**Do NOT change:** `hermes-ink` (it's a UI package name, not the user), `@hermes` (npm scope, unrelated), `node_modules` paths.

- [ ] **Step 3: Check scripts/test/Dockerfile.install-test**

```bash
grep -n "hermes\|Hermes" scripts/test/Dockerfile.install-test \
  | grep -v "HERMES_HOME\|hermes_cli\|hermes-agent\b"
```

Apply same user/path replacements if any are found.

- [ ] **Step 4: Verify**

```bash
grep -n "hermes\|Hermes" Dockerfile \
  | grep -v "HERMES_HOME\|HERMES_UID\|HERMES_GID\|hermes_cli\|hermes-ink\|@hermes\|node_modules\|hermes-agent\b\|# "
```

Expected: zero hits.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile scripts/test/Dockerfile.install-test
git commit -m "brand(docker): rename hermes user and /opt/hermes paths to cybernetics in Dockerfile"
```

---

### Task 7: Update Docker shell scripts and docker-compose files

**Files:**
- Rename+Modify: `docker/hermes-exec-shim.sh` → `docker/cybernetics-exec-shim.sh`
- Modify: `docker/main-wrapper.sh`
- Modify: `docker/stage2-hook.sh`
- Modify: `docker-compose.yml`
- Modify: `docker-compose.windows.yml`

- [ ] **Step 1: Rename and update docker/hermes-exec-shim.sh**

```bash
git mv docker/hermes-exec-shim.sh docker/cybernetics-exec-shim.sh
```

Then edit `docker/cybernetics-exec-shim.sh`:
```
# Header comment: /opt/hermes/bin/hermes   →  /opt/cybernetics/bin/cybernetics
# All `hermes` user references              →  `cybernetics`
# /opt/hermes/                             →  /opt/cybernetics/
# HERMES_DOCKER_EXEC_AS_ROOT               →  CYBERNETICS_DOCKER_EXEC_AS_ROOT
# "hermes-shim:"                           →  "cybernetics-shim:"
# s6-setuidgid hermes "$REAL"              →  s6-setuidgid cybernetics "$REAL"
```

Full replacement map for this file:
```bash
REAL=/opt/hermes/.venv/bin/hermes       → REAL=/opt/cybernetics/.venv/bin/cybernetics
echo "hermes-shim: $REAL not found"     → echo "cybernetics-shim: $REAL not found"
# supervised processes (uid 10000) and for `docker exec --user hermes`
                                         → # supervised processes (uid 10000) and for `docker exec --user cybernetics`
case "${HERMES_DOCKER_EXEC_AS_ROOT:-}"  → case "${CYBERNETICS_DOCKER_EXEC_AS_ROOT:-}"
exec "$S6_SUID" hermes "$REAL" "$@"     → exec "$S6_SUID" cybernetics "$REAL" "$@"
"re-run with --user hermes or set HERMES_DOCKER_EXEC_AS_ROOT=1"
                                         → "re-run with --user cybernetics or set CYBERNETICS_DOCKER_EXEC_AS_ROOT=1"
```

- [ ] **Step 2: Update docker/main-wrapper.sh**

```
# /opt/hermes/docker/main-wrapper.sh        →  # /opt/cybernetics/docker/main-wrapper.sh
drop() { ... s6-setuidgid hermes ...        →  drop() { ... s6-setuidgid cybernetics ...
"$(id -u hermes)"                           →  "$(id -u cybernetics)"
"[hermes] ERROR: container started with..." →  "[cybernetics] ERROR: container started with..."
"--user hermes"                             →  "--user cybernetics"
_hermes_orig_cwd="${HERMES_ORIG_CWD:-$PWD}" → _hermes_orig_cwd="${HERMES_ORIG_CWD:-$PWD}"  # Keep HERMES_ORIG_CWD (internal env var)
. /opt/hermes/.venv/bin/activate            →  . /opt/cybernetics/.venv/bin/activate
drop hermes                                 →  drop cybernetics
drop hermes "$@"                            →  drop cybernetics "$@"
"# Hermes subcommand pass-through."         →  "# Cybernetics subcommand pass-through."
```

- [ ] **Step 3: Update docker/stage2-hook.sh**

This file is dense with `hermes` user and path references. Apply these:

```
INSTALL_DIR="/opt/hermes"          →  INSTALL_DIR="/opt/cybernetics"
as_hermes()                        →  as_cybernetics()  (rename function + all call sites)
s6-setuidgid hermes                →  s6-setuidgid cybernetics
"$(id -u hermes)"                  →  "$(id -u cybernetics)"
"[stage2] Changing hermes UID"     →  "[stage2] Changing cybernetics UID"
usermod -u ... hermes              →  usermod -u ... cybernetics
groupmod ... hermes                →  groupmod ... cybernetics
usermod -aG ... hermes             →  usermod -aG ... cybernetics
"hermes already in group"          →  "cybernetics already in group"
"Added hermes to group"            →  "Added cybernetics to group"
"Warning: usermod -aG ... hermes"  →  "Warning: usermod -aG ... cybernetics"
chown ... hermes                   →  chown ... cybernetics
HERMES_UID                         →  CYBERNETICS_UID   (all occurrences)
HERMES_GID                         →  CYBERNETICS_GID   (all occurrences)
"[stage2] ERROR: ... non-hermes"   →  "[stage2] ERROR: ... non-cybernetics"
"/opt/hermes"                      →  "/opt/cybernetics"   (all remaining)
```

Also update the s6 service directory reference if present:
```
main-hermes   →  main-cybernetics   (in s6 service names only, not in Python module refs)
```

- [ ] **Step 4: Update docker-compose.yml**

```
# docker-compose.yml for Hermes Agent           →  # docker-compose.yml for Cybernetics Agent
# Set HERMES_UID / HERMES_GID to the host user  →  # Set CYBERNETICS_UID / CYBERNETICS_GID to the host user
image: hermes-agent                             →  image: cybernetics-agent
container_name: hermes                          →  container_name: cybernetics
container_name: hermes-dashboard               →  container_name: cybernetics-dashboard
~/.hermes:/opt/data                            →  ~/.cybernetics:/opt/data
HERMES_UID=${HERMES_UID:-10000}               →  CYBERNETICS_UID=${CYBERNETICS_UID:-10000}
HERMES_GID=${HERMES_GID:-10000}               →  CYBERNETICS_GID=${CYBERNETICS_GID:-10000}
# example: - ~/.hermes/google-chat-sa.json    →  # example: - ~/.cybernetics/google-chat-sa.json
```

- [ ] **Step 5: Update docker-compose.windows.yml**

```
HERMES_UID=10000    →  CYBERNETICS_UID=10000
HERMES_GID=10000    →  CYBERNETICS_GID=10000
```

Apply same image/container_name changes as docker-compose.yml.

- [ ] **Step 6: Update s6 service directory reference in docker/**

```bash
ls docker/s6-rc.d/
```

If there's a `main-hermes` directory:
```bash
git mv docker/s6-rc.d/main-hermes docker/s6-rc.d/main-cybernetics
git mv docker/s6-rc.d/user/contents.d/main-hermes docker/s6-rc.d/user/contents.d/main-cybernetics
```

Update any files inside that reference the service name.

- [ ] **Step 7: Verify**

```bash
grep -rn "hermes\|Hermes" docker/ docker-compose.yml docker-compose.windows.yml \
  | grep -v "HERMES_HOME\|hermes_cli\|hermes_log\|hermes_agent\b\|hermes-ink\|@hermes\|node_modules\|# "
```

Expected: zero hits (only internal Python module ref comments should remain).

- [ ] **Step 8: Commit**

```bash
git add docker/ docker-compose.yml docker-compose.windows.yml
git commit -m "brand(docker): rename hermes user, /opt/hermes paths, and HERMES_UID/GID to cybernetics"
```

---

## Wave 4 — Skill & Plugin Directories

### Task 8: Rename skill and plugin directories and their internal manifests

**Files:**
- Rename: `skills/autonomous-ai-agents/hermes-agent/` → `cybernetics-agent/`
- Rename: `skills/software-development/hermes-agent-skill-authoring/` → `cybernetics-agent-skill-authoring/`
- Rename: `optional-skills/devops/hermes-s6-container-supervision/` → `cybernetics-s6-container-supervision/`
- Rename: `plugins/hermes-achievements/` → `cybernetics-achievements/`

- [ ] **Step 1: Rename the directories**

```bash
git mv skills/autonomous-ai-agents/hermes-agent \
        skills/autonomous-ai-agents/cybernetics-agent

git mv skills/software-development/hermes-agent-skill-authoring \
        skills/software-development/cybernetics-agent-skill-authoring

git mv optional-skills/devops/hermes-s6-container-supervision \
        optional-skills/devops/cybernetics-s6-container-supervision

git mv plugins/hermes-achievements plugins/cybernetics-achievements
```

- [ ] **Step 2: Update SKILL.md in skills/autonomous-ai-agents/cybernetics-agent/**

```bash
grep -n "hermes\|Hermes" skills/autonomous-ai-agents/cybernetics-agent/SKILL.md
```

Replace in the manifest frontmatter and body:
```yaml
name: hermes-agent      →  name: cybernetics-agent
author: Hermes Agent    →  author: Cybernetics Agent
tags: [hermes, ...]     →  tags: [cybernetics, ...]
homepage: https://github.com/NousResearch/hermes-agent  →  (update if repo moved)
related_skills: [...]   →  (check if hermes-agent-skill-authoring ref needs updating)
```

In body text:
```
"Hermes Agent is an open-source AI agent framework by Nous Research"
→ "Cybernetics Agent is an open-source AI agent framework"
```

- [ ] **Step 3: Update SKILL.md in skills/software-development/cybernetics-agent-skill-authoring/**

```bash
grep -n "hermes\|Hermes" skills/software-development/cybernetics-agent-skill-authoring/SKILL.md
```

Apply same frontmatter and body text replacements.

- [ ] **Step 4: Update SKILL.md in optional-skills/devops/cybernetics-s6-container-supervision/**

```bash
grep -n "hermes\|Hermes" optional-skills/devops/cybernetics-s6-container-supervision/SKILL.md
```

Replace:
```yaml
name: hermes-s6-container-supervision  →  name: cybernetics-s6-container-supervision
author: Hermes Agent                   →  author: Cybernetics Agent
```

Body text:
```
"Hermes Agent Docker image"  →  "Cybernetics Agent Docker image"
```

- [ ] **Step 5: Update plugins/cybernetics-achievements/ internal references**

```bash
grep -rn "hermes-achievements\|Hermes Agent\|hermes_achievements" \
  plugins/cybernetics-achievements/ | head -20
```

In `dashboard/plugin_api.py`:
```python
"""Hermes Achievements dashboard plugin backend.
Mounted at /api/plugins/hermes-achievements/ by Hermes dashboard."""
→
"""Cybernetics Achievements dashboard plugin backend.
Mounted at /api/plugins/cybernetics-achievements/ by Cybernetics dashboard."""
```

In `README.md`:
```
hermes-achievements   →  cybernetics-achievements   (all occurrences in URLs and paths)
~/.hermes/plugins/    →  ~/.cybernetics/plugins/
Hermes is installed   →  Cybernetics is installed
hermes dashboard      →  cybernetics dashboard
```

In `docs/achievements-*.md`:
```
/api/plugins/hermes-achievements/   →  /api/plugins/cybernetics-achievements/
~/.hermes/plugins/hermes-achievements/  →  ~/.cybernetics/plugins/cybernetics-achievements/
Owner: hermes-achievements plugin   →  Owner: cybernetics-achievements plugin
```

- [ ] **Step 6: Verify renamed dirs**

```bash
grep -rn "hermes-agent\|hermes-achievements\|hermes-s6\|hermes-agent-skill" \
  skills/ optional-skills/ plugins/
```

Expected: zero hits.

- [ ] **Step 7: Commit**

```bash
git add skills/ optional-skills/ plugins/
git commit -m "brand(skills): rename hermes-agent and hermes-* skill/plugin dirs to cybernetics-*"
```

---

### Task 9: Update cross-references to renamed skill/plugin directories

**Files:**
- Modify: `toolsets.py` (if it hardcodes skill paths)
- Modify: `skill_usage.py` (`PROTECTED_BUILTIN_SKILLS`)
- Modify: `agent/skill_bundles.py` (if it references these paths)
- Modify: `scripts/build_skills_index.py` (if it has hardcoded names)

- [ ] **Step 1: Find all cross-references**

```bash
grep -rn "hermes-agent\|hermes-achievements\|hermes-s6\|hermes-agent-skill" \
  toolsets.py skill_usage.py agent/skill_bundles.py \
  scripts/build_skills_index.py scripts/build_model_catalog.py 2>/dev/null
```

- [ ] **Step 2: Update each file found**

For any hit in `skill_usage.py` PROTECTED_BUILTIN_SKILLS:
```python
"hermes-agent"                    →  "cybernetics-agent"
"hermes-achievements"             →  "cybernetics-achievements"
"hermes-s6-container-supervision" →  "cybernetics-s6-container-supervision"
"hermes-agent-skill-authoring"    →  "cybernetics-agent-skill-authoring"
```

Apply same replacements in `toolsets.py`, `agent/skill_bundles.py`, and `scripts/build_skills_index.py`.

- [ ] **Step 3: Verify**

```bash
grep -rn "hermes-agent\|hermes-achievements\|hermes-s6\|hermes-agent-skill" \
  toolsets.py skill_usage.py agent/ scripts/ 2>/dev/null
```

Expected: zero hits.

- [ ] **Step 4: Commit**

```bash
git add toolsets.py skill_usage.py agent/skill_bundles.py scripts/
git commit -m "brand(skills): update cross-references to renamed cybernetics-* skill dirs"
```

---

## Wave 5 — Documentation & Website

### Task 10: Update website documentation

**Files:**
- Modify: all `website/docs/**/*.md` files containing "Hermes" or "hermes"
- Modify: all `website/i18n/zh-Hans/**/*.md` files containing "Hermes" or "hermes"

- [ ] **Step 1: Audit website docs**

```bash
grep -rl "Hermes\|hermes" website/ \
  | grep "\.md$" \
  | grep -v node_modules \
  | sort
```

Note the count. Expected: ~80 files.

- [ ] **Step 2: Bulk replace in website/docs/**

Run these replacements across all files (verify each with grep before applying):

```bash
# Preview the scope of each replacement before running
grep -rl "Hermes Agent" website/docs/ | wc -l
grep -rl "hermes-agent" website/docs/ | wc -l
```

Replacements to apply file-by-file using Edit tool (or sed for bulk):
```
Hermes Agent           →  Cybernetics Agent
hermes-agent           →  cybernetics-agent     (in prose and URLs that are ours)
build-a-hermes-plugin  →  build-a-cybernetics-plugin  (doc content only, not filename unless sidebar is also updated)
use-soul-with-hermes   →  use-soul-with-cybernetics   (doc content only)
Hermes plugin          →  Cybernetics plugin
```

**Do NOT change:**
- External URLs pointing to the old GitHub repo (unless the repo has actually moved)
- `HERMES_HOME` references in environment variable documentation

- [ ] **Step 3: Bulk replace in website/i18n/zh-Hans/**

Same replacements applied to all zh-Hans translated docs. The brand names "Hermes Agent" → "Cybernetics Agent" remain in English even in translated docs (proper names are typically kept).

- [ ] **Step 4: Verify website docs**

```bash
grep -rn "Hermes\|hermes" website/ \
  | grep -v "HERMES_HOME\|node_modules\|hermes_cli\|hermes_log\|# " \
  | grep -v "github.com.*hermes\|nousresearch.*hermes"  # external URLs OK
```

Expected: zero non-URL hits.

- [ ] **Step 5: Commit**

```bash
git add website/
git commit -m "brand(docs): replace Hermes with Cybernetics in website documentation"
```

---

### Task 11: Update internal docs and .plans files

**Files:**
- Modify: `docs/**/*.md` (excluding the spec file and plan file themselves)
- Modify: `.plans/*.md` (other plan files that mention Hermes)

- [ ] **Step 1: Audit internal docs**

```bash
grep -rl "Hermes\|hermes" docs/ .plans/ \
  | grep "\.md$" \
  | grep -v "2026-06-15-hermes-cybernetics-brand-rename"  # exclude this spec and plan
```

- [ ] **Step 2: Replace brand names in internal docs**

```
Hermes Agent   →  Cybernetics Agent
hermes-agent   →  cybernetics-agent
~/.hermes      →  ~/.cybernetics
```

Leave `HERMES_HOME` references (they're env var documentation).

- [ ] **Step 3: Final full-repo verification**

```bash
grep -rn "Hermes\|hermes" \
  agent/ hermes_cli/ docker/ skills/ optional-skills/ plugins/ \
  docs/ .plans/ website/ \
  pyproject.toml setup-cybernetics.sh scripts/install.sh AGENTS.md CONTRIBUTING.md \
  | grep -v \
    "HERMES_HOME\|HERMES_UID\|HERMES_GID\|HERMES_OPTIONAL\|HERMES_BUNDLED\|HERMES_ORIG_CWD" \
  | grep -v \
    "hermes_cli\b\|hermes_log\|hermes_state\|hermes_time\|hermes_boot\|hermes_const" \
  | grep -v \
    "get_hermes\|set_hermes\|reset_hermes\|display_hermes\|_hermes_\|_HERMES_MD" \
  | grep -v \
    "from hermes\|import hermes\|hermes_home\b" \
  | grep -v \
    "node_modules/hermes\|hermes-ink\|@hermes\|hermes-estree\|hermes-parser\|hermes-tui" \
  | grep -v \
    "github.com.*hermes\|nousresearch.*hermes" \
  | grep -v "# "
```

Expected: zero hits. Any remaining hits are either:
1. A missed display string (fix it)
2. A Python internal that should stay (add to the grep exclusion)
3. An external URL (add to the grep exclusion)

- [ ] **Step 4: Commit**

```bash
git add docs/ .plans/
git commit -m "brand(docs): replace Hermes with Cybernetics in internal docs and plans"
```

---

## Post-Wave Checklist

After all 5 waves are committed:

- [ ] Run the full-repo verification from Task 11 Step 3 — confirm zero unexpected hits
- [ ] Run the test suite to catch any broken test assertions: `pytest tests/ -x -q 2>&1 | head -50`
- [ ] Reinstall the package locally to confirm the new binary name: `pip install -e . && which cybernetics`
- [ ] Verify the old binary is gone: `which hermes` should return nothing (or only system-level hermes if installed separately)
