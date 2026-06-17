"""Env-var compatibility shim for the Hermes → Cybernetics rebrand.

Single source of truth for the rename mapping. Imported as a side effect from
``api/__init__.py`` and ``bootstrap.py`` so every reader (``os.getenv("HERMES_WEBUI_X")``)
keeps working unchanged while users can also set ``CYBERNETICS_WEBUI_X``.

Rules:
  * If only the new name is set, mirror it back to the legacy name so existing
    call sites still see a value.
  * If only the legacy name is set, mirror it forward to the new name (and
    emit a one-shot deprecation warning to stderr).
  * If both are set, prefer the NEW name and warn that the legacy one is shadowed.

The shim is idempotent — importing it more than once is safe.
"""

from __future__ import annotations

import os
import sys
from typing import Iterable

# Prefixes that participate in the rebrand. Order matters only for warning
# emission; the bridge logic is symmetric.
_BRIDGE_PREFIXES: tuple[tuple[str, str], ...] = (
    ("CYBERNETICS_WEBUI_", "HERMES_WEBUI_"),
    ("CYBERNETICS_HOME", "HERMES_HOME"),
)

# Names that are FUNCTIONAL identifiers on the parent agent and must keep
# their HERMES_ prefix regardless of rebrand state. The parent's hermes_cli
# package still reads these by their literal HERMES_ names.
_PARENT_AGENT_NAMES: frozenset[str] = frozenset({
    # Add here if any parent-coupled var must NEVER be promoted.
})

_warned: set[str] = set()


def _warn_once(key: str, msg: str) -> None:
    if key in _warned:
        return
    _warned.add(key)
    try:
        sys.stderr.write(f"[env-compat] {msg}\n")
        sys.stderr.flush()
    except Exception:
        pass


def _bridge_pair(new_prefix: str, legacy_prefix: str) -> None:
    """Mirror values between ``new_prefix*`` and ``legacy_prefix*``."""
    # Snapshot keys first to avoid mutating-while-iterating os.environ
    keys: Iterable[str] = list(os.environ.keys())
    seen_suffixes: set[str] = set()

    for key in keys:
        if key.startswith(new_prefix):
            suffix = key[len(new_prefix):]
            seen_suffixes.add(suffix)
        elif key.startswith(legacy_prefix):
            suffix = key[len(legacy_prefix):]
            seen_suffixes.add(suffix)

    for suffix in seen_suffixes:
        new_key = f"{new_prefix}{suffix}" if new_prefix.endswith("_") else new_prefix
        legacy_key = f"{legacy_prefix}{suffix}" if legacy_prefix.endswith("_") else legacy_prefix
        # Handle the non-prefixed pair (e.g. CYBERNETICS_HOME / HERMES_HOME)
        if not new_prefix.endswith("_"):
            new_key, legacy_key = new_prefix, legacy_prefix
        if legacy_key in _PARENT_AGENT_NAMES:
            continue
        new_val = os.environ.get(new_key)
        legacy_val = os.environ.get(legacy_key)
        if new_val is not None and legacy_val is None:
            os.environ[legacy_key] = new_val
        elif legacy_val is not None and new_val is None:
            os.environ[new_key] = legacy_val
            _warn_once(
                legacy_key,
                f"{legacy_key} is deprecated; please use {new_key} instead.",
            )
        elif new_val is not None and legacy_val is not None and new_val != legacy_val:
            _warn_once(
                legacy_key,
                f"Both {new_key} and {legacy_key} are set with different values; "
                f"using {new_key} (={new_val!r}).",
            )
            os.environ[legacy_key] = new_val


def install() -> None:
    """Idempotently install the env-var bridge."""
    for new_prefix, legacy_prefix in _BRIDGE_PREFIXES:
        _bridge_pair(new_prefix, legacy_prefix)


# Auto-install on import.
install()
