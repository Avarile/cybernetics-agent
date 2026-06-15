"""Single source of truth for user-facing brand strings.

Env-overridable so the same binary can be re-skinned without recompiling:
    CYBERNETICS_BRAND        — full display name (default: "Cybernetics Agent")
    CYBERNETICS_BRAND_SHORT  — single-word form used in compound phrases
                               like "Update Cybernetics" (default: "Cybernetics")

The CLI binary name (``cybernetics``) is intentionally NOT exported here —
it is pinned to ``pyproject.toml`` console_scripts and to runtime process /
systemd unit detection in ``hermes_cli/gateway.py``. Changing it at runtime
would silently break gateway pid discovery.
"""

import os

BRAND_NAME: str = os.environ.get("CYBERNETICS_BRAND", "Cybernetics Agent")
BRAND_SHORT: str = os.environ.get("CYBERNETICS_BRAND_SHORT", "Cybernetics")
