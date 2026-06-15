# Design: HERMES → Cybernetics Brand Rename

**Date:** 2026-06-15
**Branch:** dev
**Status:** Approved

## Summary

Replace all user-facing "Hermes"/"hermes" brand references with "Cybernetics"/"cybernetics" across display text, CLI binary name, Docker user/paths, skill directories, and documentation.

## Invariants (never touched)

| Item | Reason |
|---|---|
| `HERMES_HOME` env var name | Machine-level interface — breaking change for all users |
| `get_hermes_home()` and all other Python internal function names | Internal identifiers — no user impact |
| `hermes_constants.py`, `hermes_cli/`, `hermes_logging.py`, `hermes_state.py`, `hermes_time.py`, `hermes_bootstrap.py` | Python module names — kept for internal consistency |
| `tests/hermes_cli/`, `test_hermes_*.py` test files | Not user-facing; consistent with internal module names |
| `node_modules/hermes-*` | Facebook's Hermes JS engine, unrelated project |
| `.idea/hermes-agent.iml` | IDE artifact |
| Image assets (`hermes.png`, `hermes-frames/`) | Brand images requiring design work |
| `HERMES_OPTIONAL_SKILLS`, `HERMES_BUNDLED_SKILLS`, `HERMES_OPTIONAL_MCPS` | Same as HERMES_HOME — machine-level env var interface |

## Wave 1 — Display Text & System Prompts

**Goal:** All user-visible strings say "Cybernetics", not "Hermes".

**Target files:**
- `agent/prompt_builder.py`
- `agent/system_prompt.py`
- `hermes_cli/default_soul.py`
- `hermes_cli/doctor.py`
- `hermes_cli/banner.py`
- `hermes_cli/tips.py`
- `hermes_cli/gateway.py`
- `hermes_cli/config.py`
- `hermes_cli/setup.py`
- `hermes_cli/auth.py`
- `hermes_cli/goals.py`
- `hermes_cli/models.py`
- Any other file with `"Hermes"` / `"hermes"` in a `print()`, `logger.*()`, `raise`, `help=`, or f-string user message

**Replacement rules:**
- `"Hermes"` (display name) → `"Cybernetics"`
- `"hermes agent"` → `"cybernetics agent"`
- `"~/.hermes"` in user-facing strings → `"~/.cybernetics"`
- Leave `HERMES_HOME`, `get_hermes_home()`, module import names untouched

**Verification:** After changes, this returns zero hits:
```
grep -rn '"[Hh]ermes' agent/ hermes_cli/ \
  | grep -v "HERMES_HOME" \
  | grep -v "get_hermes" \
  | grep -v "hermes_constants" \
  | grep -v "hermes_logging"
```

## Wave 2 — CLI Binary Name

**Goal:** The command users type is `cybernetics`, not `hermes`. Clean break — no alias or shim.

**Target files:**
- `setup.py` or `pyproject.toml` — entry_points / console_scripts section
- `scripts/install.sh`
- `setup-cybernetics.sh`
- `AGENTS.md`, `CONTRIBUTING.md`
- Any inline script or doc referencing `hermes setup`, `hermes chat`, `which hermes`

**Changes:**
- `hermes = cli:main` → `cybernetics = cli:main`
- `hermes-acp = ...` → `cybernetics-acp = ...`
- `hermes-agent = ...` → `cybernetics-agent = ...` (the binary entry point, distinct from skill dir)
- All references to the `hermes` CLI command in documentation and install scripts

**Verification:**
```
python -m build --no-isolation 2>&1 | grep -i "cybernetics"
# resulting dist/ wheel should expose cybernetics binary
```

## Wave 3 — Docker User & Paths

**Goal:** Docker images run as user `cybernetics`, install to `/opt/cybernetics/`.

**Target files:**
- `docker/hermes-exec-shim.sh` → rename to `docker/cybernetics-exec-shim.sh`
- `docker/main-wrapper.sh`
- `docker/stage2-hook.sh`
- `docker-compose.yml`
- `docker-compose.windows.yml`
- Any `Dockerfile` in the repo

**Changes:**
- OS user: `hermes` → `cybernetics` (all `s6-setuidgid hermes`, `id -u hermes`, `--user hermes`)
- Install path: `/opt/hermes/` → `/opt/cybernetics/`
- Env var: `HERMES_DOCKER_EXEC_AS_ROOT` → `CYBERNETICS_DOCKER_EXEC_AS_ROOT` (user-facing Docker flag, distinct from `HERMES_HOME`)
- Shim self-reference: `hermes-shim:` log prefix → `cybernetics-shim:`
- File rename: `docker/hermes-exec-shim.sh` → `docker/cybernetics-exec-shim.sh`

**Caveat:** Existing built images have Linux user `hermes` baked in. New builds will use `cybernetics`. Expected with clean break.

**Verification:**
```
grep -rn "hermes" docker/ docker-compose.yml docker-compose.windows.yml
# should return zero hits (excluding comments that document the old name)
```

## Wave 4 — Skill & Plugin Directories

**Goal:** User-invocable skill names use "cybernetics", not "hermes".

**Directory renames:**
```
skills/autonomous-ai-agents/hermes-agent/                    → cybernetics-agent/
skills/software-development/hermes-agent-skill-authoring/    → cybernetics-agent-skill-authoring/
plugins/hermes-achievements/                                 → cybernetics-achievements/
optional-skills/devops/hermes-s6-container-supervision/      → cybernetics-s6-container-supervision/
```

**Also update:**
- `SKILL.md` manifests inside each renamed directory (name, description fields)
- `toolsets.py` if it hardcodes any of these skill paths
- `skill_usage.py` — `PROTECTED_BUILTIN_SKILLS` entries if they reference these names
- `agent/skill_bundles.py` if it references these paths
- `scripts/build_skills_index.py` references
- Website docs that reference these skill names by path

**Verification:**
```
grep -rn "hermes-agent\|hermes-achievements\|hermes-s6" \
  skills/ optional-skills/ plugins/ toolsets.py skill_usage.py agent/
# should return zero hits
```

## Wave 5 — Documentation & Website

**Goal:** All public-facing documentation says "Cybernetics", not "Hermes".

**Target files (~80 files):**
- `website/docs/**/*.md`
- `website/i18n/zh-Hans/**/*.md`
- `docs/**/*.md` (internal design docs, excluding this spec file itself)
- `.plans/*.md`

**Replacement rules:**
- `Hermes Agent` → `Cybernetics Agent`
- `hermes-agent` → `cybernetics-agent` (in docs prose and URLs)
- `Hermes plugin` → `Cybernetics plugin`
- `build-a-hermes-plugin` → `build-a-cybernetics-plugin` (doc slugs/filenames if referenced)
- `use-soul-with-hermes` → `use-soul-with-cybernetics`

**Note:** Doc file renames (e.g. `build-a-hermes-plugin.md` → `build-a-cybernetics-plugin.md`) should only be done if the website nav/sidebar config is also updated in the same commit. Otherwise update content only.

**Verification:**
```
grep -rn "Hermes\|hermes" website/ docs/ AGENTS.md CONTRIBUTING.md .plans/ \
  | grep -v "HERMES_HOME" \
  | grep -v "hermes_constants\|hermes_cli\|hermes_logging"
# should return zero hits
```

## Execution Order & Commit Strategy

Each wave is a separate commit on `dev`. This allows bisecting if anything breaks.

| Order | Wave | Commit message |
|---|---|---|
| 1 | Display text | `brand(display): replace Hermes with Cybernetics in user-facing strings` |
| 2 | CLI binary | `brand(binary): rename hermes CLI entry points to cybernetics` |
| 3 | Docker | `brand(docker): rename hermes user and /opt/hermes paths to cybernetics` |
| 4 | Skills/plugins | `brand(skills): rename hermes-agent and hermes-* skill dirs to cybernetics-*` |
| 5 | Docs | `brand(docs): replace Hermes with Cybernetics in website and documentation` |

## Out of Scope

- `HERMES_HOME`, `HERMES_OPTIONAL_SKILLS`, `HERMES_BUNDLED_SKILLS`, `HERMES_OPTIONAL_MCPS` env var names
- Python function names: `get_hermes_home()`, `display_hermes_home()`, `set_hermes_home_override()`, etc.
- Python module files: `hermes_constants.py`, `hermes_cli/`, `hermes_logging.py`, `hermes_state.py`, `hermes_time.py`, `hermes_bootstrap.py`
- Test directory `tests/hermes_cli/` and `test_hermes_*.py` files
- `node_modules/hermes-*` (Facebook Hermes JS engine)
- Image assets: `hermes.png`, `hermes-sprite.png`, `hermes-frames/`
