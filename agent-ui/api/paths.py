"""Shared path helpers for Cybernetics WebUI.

Keep low-level filesystem defaults here instead of in ``api.config`` so modules
that need the default Cybernetics home can import them without triggering config's
larger startup side effects.
"""

import os
from pathlib import Path

HOME = Path.home()


def _hermes_home_has_webui_state(base: Path) -> bool:
    """Return True when *base* holds real WebUI state under its ``webui/`` dir.

    Used only on Windows to detect a pre-v0.51.134 install at the legacy
    ``%USERPROFILE%\\.hermes`` location so we don't strand the user's existing
    sessions/pins/settings when the default moved to ``%LOCALAPPDATA%\\hermes``
    (#2905).

    We intentionally check ONLY WebUI-owned artifacts (the ``webui/`` subtree),
    NOT agent-owned files like ``config.yaml`` / ``auth.json``.  The agent has
    defaulted to ``%LOCALAPPDATA%\\hermes`` on Windows since before #2897, so a
    long-time agent user who never ran WebUI at the legacy location would have a
    stray ``auth.json`` there — keying on that would wrongly divert a *fresh*
    WebUI install to the legacy dir.  Only ``webui/`` state is what actually
    gets stranded by the move, so it is the correct and narrow signal.
    Cheap stat-only checks; never raises.
    """
    try:
        if not base.is_dir():
            return False
        markers = (
            base / "webui" / "sessions",        # WebUI session store
            base / "webui" / "settings.json",   # WebUI UI settings + pins
            base / "webui",                     # WebUI state dir at all
        )
        return any(m.exists() for m in markers)
    except OSError:
        return False


def _platform_default_hermes_home() -> Path:
    """Return the platform-aware default agent home when HERMES_HOME is unset.

    Parent project migrated from ~/.hermes to ~/.cybernetics. On POSIX the new
    default is ~/.cybernetics; on Windows it is %LOCALAPPDATA%/cybernetics. In
    both cases the legacy ~/.hermes (resp. %LOCALAPPDATA%/hermes) is preferred
    only when the new location has no WebUI state but the legacy one does, so
    existing installs are never stranded. Explicit HERMES_HOME (or
    CYBERNETICS_HOME / HERMES_WEBUI_STATE_DIR) overrides take precedence
    upstream and are unaffected.
    """
    if os.name == "nt":
        local_app_data = os.getenv("LOCALAPPDATA", "").strip()
        if local_app_data:
            new_home = Path(local_app_data) / "cybernetics"
            legacy_home_v2 = Path(local_app_data) / "hermes"
            legacy_home_v1 = HOME / ".hermes"
            for candidate in (legacy_home_v2, legacy_home_v1):
                if (
                    candidate != new_home
                    and not _hermes_home_has_webui_state(new_home)
                    and _hermes_home_has_webui_state(candidate)
                ):
                    return candidate
            return new_home
    new_posix = HOME / ".cybernetics"
    legacy_posix = HOME / ".hermes"
    if (
        not _hermes_home_has_webui_state(new_posix)
        and _hermes_home_has_webui_state(legacy_posix)
    ):
        return legacy_posix
    return new_posix
