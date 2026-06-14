#!/usr/bin/env bash
# ============================================================================
# Layer 1 — Static lint for the installer scripts.
# ============================================================================
# Runs `bash -n` (syntax) + `shellcheck` (lint) over every installer script.
# Fast (seconds). Run this before the hermetic Docker test.
#
# Usage:
#   scripts/test/lint-installers.sh
#
# Requires: bash, shellcheck (optional — skip if missing)
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; NC='\033[0m'

# Test whichever dev-installer file is checked in (rebrand may be in flight).
SETUP_SCRIPT=""
for candidate in setup-cybernetics.sh setup-hermes.sh; do
    if [ -f "$candidate" ]; then SETUP_SCRIPT="$candidate"; break; fi
done

SCRIPTS=(
    "${SETUP_SCRIPT:-setup-cybernetics.sh}"
    "scripts/install.sh"
    "scripts/test/test-installers.sh"
    "scripts/test/lint-installers.sh"
)

fail=0

echo "── bash -n (syntax) ──"
for s in "${SCRIPTS[@]}"; do
    if [ ! -f "$s" ]; then
        echo -e "  ${YELLOW}skip${NC}  $s (not found)"
        continue
    fi
    if bash -n "$s" 2>&1; then
        echo -e "  ${GREEN}ok${NC}    $s"
    else
        echo -e "  ${RED}FAIL${NC}  $s"
        fail=1
    fi
done

echo
echo "── shellcheck (lint) ──"
if ! command -v shellcheck >/dev/null 2>&1; then
    echo -e "  ${YELLOW}skip${NC}  shellcheck not installed"
    echo "         Install:  brew install shellcheck  (or apt install shellcheck)"
else
    for s in "${SCRIPTS[@]}"; do
        if [ ! -f "$s" ]; then continue; fi
        # SC1091 = "can't follow source" — expected for runtime-resolved paths.
        # SC2086 = "double quote to prevent globbing" — we hit a lot of these
        # in legitimate word-splitting contexts (npm flag arrays, etc.).
        if shellcheck -e SC1091,SC2086 -S warning "$s"; then
            echo -e "  ${GREEN}ok${NC}    $s"
        else
            echo -e "  ${RED}FAIL${NC}  $s (see findings above)"
            fail=1
        fi
    done
fi

echo
if [ $fail -eq 0 ]; then
    echo -e "${GREEN}✓ All static checks passed.${NC}"
else
    echo -e "${RED}✗ Some checks failed (see above).${NC}"
fi
exit $fail
