#!/usr/bin/env bash
# ============================================================================
# Layer 2 — Hermetic end-to-end test of the Cybernetics installers.
# ============================================================================
# Builds a throwaway Ubuntu container and runs the chosen installer inside.
# After install, runs assertions against the result so a regression in any
# stage (clone, deps, symlinks, config seeding) is caught.
#
# Two modes:
#
#   --script setup        Test setup-cybernetics.sh against the LOCAL repo
#                         (bind-mounted into the container). Fast feedback —
#                         no network clone, no GitHub round-trip.
#
#   --script install      Test scripts/install.sh as the public installer.
#                         Two sub-modes:
#                           --source local  (default) copy the local install.sh
#                                            into the container and run it.
#                                            Lets you test pre-push edits.
#                           --source github  pull the script from
#                                            raw.githubusercontent.com
#                                            (the URL baked into the script
#                                            and README). Catches breakage in
#                                            the actual curl-pipe path.
#
# Other flags:
#   --keep        Don't `docker rm` the container after the test. Useful for
#                 stepping in with `docker exec -it ... bash` to debug a
#                 failure.
#   --no-rebuild  Skip the image build step (use a previously built image).
#
# Usage examples:
#   scripts/test/test-installers.sh --script setup
#   scripts/test/test-installers.sh --script install --source local
#   scripts/test/test-installers.sh --script install --source github
#   scripts/test/test-installers.sh --script install --keep
#
# Requires: docker, bash 4+.
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKERFILE="$REPO_ROOT/scripts/test/Dockerfile.install-test"
IMAGE_TAG="cybernetics-install-test:latest"
CONTAINER_NAME="cybernetics-install-test-$$"

# Defaults.
SCRIPT="setup"     # setup | install
SOURCE="local"     # local | github
KEEP=false
REBUILD=true

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'; NC='\033[0m'

usage() {
    sed -n '2,/^# ====/p' "$0" | sed 's/^# \{0,1\}//'
    exit "${1:-0}"
}

# ----------------------------------------------------------------------------
# Arg parsing
# ----------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case $1 in
        --script)     SCRIPT="$2"; shift 2 ;;
        --source)     SOURCE="$2"; shift 2 ;;
        --keep)       KEEP=true;   shift   ;;
        --no-rebuild) REBUILD=false; shift ;;
        -h|--help)    usage 0 ;;
        *) echo "Unknown option: $1"; usage 1 ;;
    esac
done

case "$SCRIPT" in setup|install) ;; *) echo "--script must be 'setup' or 'install'"; exit 1 ;; esac
case "$SOURCE" in local|github) ;; *) echo "--source must be 'local' or 'github'"; exit 1 ;; esac

# ----------------------------------------------------------------------------
# Preflight
# ----------------------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}✗ docker not found.${NC} Install Docker Desktop or colima first."
    exit 1
fi
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}✗ docker daemon not running.${NC} Start Docker Desktop / colima and retry."
    exit 1
fi

# ----------------------------------------------------------------------------
# Build the image (cached on subsequent runs)
# ----------------------------------------------------------------------------
if [ "$REBUILD" = true ]; then
    echo -e "${CYAN}── Building test image ($IMAGE_TAG) ──${NC}"
    docker build -t "$IMAGE_TAG" -f "$DOCKERFILE" "$REPO_ROOT/scripts/test"
fi

# ----------------------------------------------------------------------------
# Cleanup on exit (unless --keep)
# ----------------------------------------------------------------------------
cleanup() {
    if [ "$KEEP" = true ]; then
        echo
        echo -e "${YELLOW}Container kept for debugging:${NC} $CONTAINER_NAME"
        echo "Inspect with:  docker exec -it $CONTAINER_NAME bash"
        echo "Remove with:   docker rm -f $CONTAINER_NAME"
    else
        docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

# ----------------------------------------------------------------------------
# Compose the install + assertion command that will run inside the container.
# ----------------------------------------------------------------------------
read -r -d '' ASSERTIONS <<'ASSERT_EOF' || true
set -e
fail=0
ok()   { printf '  \033[0;32mok\033[0m    %s\n' "$1"; }
bad()  { printf '  \033[0;31mFAIL\033[0m  %s\n' "$1"; fail=1; }
warn() { printf '  \033[0;33mwarn\033[0m  %s\n' "$1"; }
have() { command -v "$1" >/dev/null 2>&1; }

echo "── Post-install assertions ──"

# 1. Primary command on PATH. Accept either brand so this harness keeps
#    working through the rebrand transition. PRIMARY is whichever exists.
PRIMARY=""
if   have cybernetics; then PRIMARY="cybernetics"
elif have hermes;      then PRIMARY="hermes"
fi
if [ -n "$PRIMARY" ]; then ok "primary command on PATH: $PRIMARY ($(command -v "$PRIMARY"))"
else bad "neither 'cybernetics' nor 'hermes' is on PATH"; fi

# 2. --version succeeds
if [ -n "$PRIMARY" ]; then
    if "$PRIMARY" --version >/tmp/ver.txt 2>&1; then
        ok "'$PRIMARY --version' ran: $(head -1 /tmp/ver.txt)"
    else
        bad "'$PRIMARY --version' failed: $(cat /tmp/ver.txt)"
    fi
fi

# 3. Secondary command (if both should be available). Promised in cybernetics
#    rebrand: cybernetics is primary, hermes is a legacy alias. If only one of
#    the two is present, that's a warning (not a hard fail) so the harness
#    works against both pre- and post-rebrand installers.
if have cybernetics && have hermes; then
    ok "both 'cybernetics' and 'hermes' available"
elif [ -n "$PRIMARY" ]; then
    warn "only '$PRIMARY' available; legacy/secondary alias missing"
fi

# 4. Config dir exists with expected children. Probe both names; whichever
#    the installer chose, we check the layout there.
CYB=""
if   [ -d "${HERMES_HOME:-}" ]                  ; then CYB="$HERMES_HOME"
elif [ -d "$HOME/.cybernetics" ]                ; then CYB="$HOME/.cybernetics"
elif [ -d "$HOME/.hermes" ]                     ; then CYB="$HOME/.hermes"
fi
if [ -n "$CYB" ]; then
    ok "config dir: $CYB"
    for child in config.yaml .env skills sessions logs cron; do
        if [ -e "$CYB/$child" ]; then ok "$CYB/$child"
        else bad "$CYB/$child missing"; fi
    done
else
    bad "no config dir found (~/.cybernetics or ~/.hermes)"
fi

# 5. SOUL.md present (header content is brand-dependent, so we just check
#    the file exists rather than its exact wording).
if [ -n "$CYB" ] && [ -f "$CYB/SOUL.md" ]; then
    ok "SOUL.md present ($(head -1 "$CYB/SOUL.md"))"
elif [ -n "$CYB" ]; then
    bad "$CYB/SOUL.md missing"
fi

# 6. PATH was wired into shell rc so future shells work
if grep -q '\.local/bin' "$HOME/.bashrc" 2>/dev/null \
   || grep -q '\.local/bin' "$HOME/.profile" 2>/dev/null; then
    ok "~/.local/bin entry added to shell rc"
else
    bad "no PATH entry in ~/.bashrc or ~/.profile"
fi

echo
if [ $fail -eq 0 ]; then
    printf '\033[0;32m✓ All assertions passed.\033[0m\n'
else
    printf '\033[0;31m✗ Some assertions failed.\033[0m\n'
fi
exit $fail
ASSERT_EOF

# ----------------------------------------------------------------------------
# Build the per-mode install command.
# ----------------------------------------------------------------------------
case "$SCRIPT:$SOURCE" in
    setup:*)
        # Bind-mount the repo, run whichever setup-*.sh ships with it (we
        # accept either setup-cybernetics.sh or the legacy setup-hermes.sh).
        # --skip-setup flag isn't supported by either; we just answer the
        # final wizard prompt with 'n'.
        if [ -f "$REPO_ROOT/setup-cybernetics.sh" ]; then
            SETUP_NAME="setup-cybernetics.sh"
        elif [ -f "$REPO_ROOT/setup-hermes.sh" ]; then
            SETUP_NAME="setup-hermes.sh"
        else
            echo -e "${RED}✗ No setup-*.sh found in $REPO_ROOT.${NC}"
            exit 1
        fi
        echo -e "${CYAN}Using:${NC} $SETUP_NAME"
        INSTALL_CMD="set -e
cd /repo
echo n | ./$SETUP_NAME
"
        MOUNT_ARGS=(-v "$REPO_ROOT:/repo:ro")
        WORKDIR_ARGS=(-w "/repo")
        ;;
    install:local)
        # Copy install.sh into the container and run it. The script will
        # git-clone from GitHub, so we still need network.
        INSTALL_CMD='set -e
sudo cp /repo/scripts/install.sh /tmp/install.sh
sudo chown tester /tmp/install.sh
chmod +x /tmp/install.sh
/tmp/install.sh --skip-setup --skip-browser --non-interactive
'
        MOUNT_ARGS=(-v "$REPO_ROOT:/repo:ro")
        WORKDIR_ARGS=()
        ;;
    install:github)
        # Pure curl-pipe path — exactly what end users will type.
        INSTALL_CMD='set -e
curl -fsSL https://raw.githubusercontent.com/Avarile/cybernetics-agent/main/scripts/install.sh \
    | bash -s -- --skip-setup --skip-browser --non-interactive
'
        MOUNT_ARGS=()
        WORKDIR_ARGS=()
        ;;
esac

# ----------------------------------------------------------------------------
# Run
# ----------------------------------------------------------------------------
echo -e "${CYAN}── Running $SCRIPT installer (source: $SOURCE) ──${NC}"
echo

# Stream output live, then run assertions.
docker run --rm=false --name "$CONTAINER_NAME" \
    "${MOUNT_ARGS[@]}" "${WORKDIR_ARGS[@]}" \
    "$IMAGE_TAG" bash -lc "$INSTALL_CMD"

install_rc=$?
if [ $install_rc -ne 0 ]; then
    echo
    echo -e "${RED}✗ Installer exited with code $install_rc${NC}"
    exit $install_rc
fi

echo
echo -e "${CYAN}── Verifying installed state ──${NC}"
docker exec "$CONTAINER_NAME" bash -lc "$ASSERTIONS"
