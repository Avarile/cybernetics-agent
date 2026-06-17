"""Cybernetics WebUI -- API modules."""

# Side effect: install the env-var bridge so HERMES_WEBUI_* and
# CYBERNETICS_WEBUI_* are kept in sync before any module reads them.
from api import _env_compat as _env_compat  # noqa: F401
