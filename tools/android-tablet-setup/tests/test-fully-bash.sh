#!/usr/bin/env bash
# Simulated ADB workflow; never accesses a tablet or the network.
set -euo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
fixture=$(mktemp -d)
mkdir "$fixture/scripts"
cp "$root/scripts/setup-fully.sh" "$fixture/scripts/"
cp "$root/fully-ha-settings.json" "$fixture/"
touch "$fixture/test.apk"
export FULLY_TEST_LOG="$fixture/commands.log"
export FULLY_TEST_IMPORT="$fixture/import.json"
cat > "$fixture/adb" <<'MOCK'
#!/usr/bin/env bash
set -eu
[[ "$1" == -s && "$2" == TEST123 ]] || exit 90
shift 2
printf '%s\n' "$*" >> "$FULLY_TEST_LOG"
case "$*" in
    'shell if [ -e '*EXISTS*)
        if [[ "${FULLY_TEST_CASE:-}" == conflict ]]; then echo EXISTS; else echo ABSENT; fi ;;
    'shell if [ -e '*PENDING*) echo CONSUMED ;;
    'shell dumpsys package de.ozerov.fully')
        if [[ "${FULLY_TEST_CASE:-}" != missing_app ]]; then echo 'versionName=1.61.4'; fi ;;
    'install -r '*)
        if [[ "${FULLY_TEST_CASE:-}" == install_failure ]]; then echo 'Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE]'; exit 1; fi
        echo Success ;;
    'shell getprop ro.build.version.sdk') echo 36 ;;
    'shell appops set --uid de.ozerov.fully MANAGE_EXTERNAL_STORAGE allow') ;;
    'shell appops get --uid de.ozerov.fully MANAGE_EXTERNAL_STORAGE')
        if [[ "${FULLY_TEST_CASE:-}" == permission_failure ]]; then echo default; else echo 'MANAGE_EXTERNAL_STORAGE: allow'; fi ;;
    'shell am force-stop de.ozerov.fully') ;;
    'push '*)
        [[ "$3" == /sdcard/fully-once-settings.json ]] || exit 91
        cp -- "$2" "$FULLY_TEST_IMPORT"
        printf '%s\n' "$2" > "$FULLY_TEST_IMPORT.path" ;;
    'shell am start -W -n de.ozerov.fully/.MainActivity') echo 'Status: ok' ;;
    *) printf 'Unexpected command: %s\n' "$*" >&2; exit 92 ;;
esac
MOCK
chmod +x "$fixture/adb"
run() {
    : > "$FULLY_TEST_LOG"
    local apk="$fixture/test.apk"
    if [[ "${2:-setup}" == layout ]]; then apk=''; fi
    bash "$fixture/scripts/setup-fully.sh" "$fixture/adb" TEST123 "$apk" "${1:-compact}" "${2:-setup}" > "$fixture/output.log" 2>&1
}
for layout in compact fullscreen; do
    for mode in setup layout; do
        run "$layout" "$mode"
        grep -q 'Importdatei verarbeitet' "$fixture/output.log"
        grep -Fq "const layout = '$layout';" "$FULLY_TEST_IMPORT"
        grep -q '^push ' "$FULLY_TEST_LOG"
        [[ ! -e "$(cat "$FULLY_TEST_IMPORT.path")" ]] || { echo 'Temporary import not removed' >&2; exit 1; }
        if [[ "$mode" == setup ]]; then
            grep -q '^install -r ' "$FULLY_TEST_LOG"
            grep -q '"startURL"' "$FULLY_TEST_IMPORT"
            grep -q '"launchOnBoot"' "$FULLY_TEST_IMPORT"
            grep -Eq '"screenBrightness"[[:space:]]*:[[:space:]]*"204"' "$FULLY_TEST_IMPORT"
        else
            if grep -q '^install ' "$FULLY_TEST_LOG" || grep -Eq '"(startURL|screenOrientation|launchOnBoot|fullscreen|screenBrightness)"[[:space:]]*:' "$FULLY_TEST_IMPORT"; then
                echo 'Layout-only mode changed app or other settings' >&2; exit 1
            fi
        fi
    done
done
for scenario in conflict install_failure permission_failure; do
    export FULLY_TEST_CASE=$scenario
    if run; then echo "Unexpected success: $scenario" >&2; exit 1; fi
    if grep -q '^push ' "$FULLY_TEST_LOG"; then echo 'Pushed settings after failure' >&2; exit 1; fi
done
export FULLY_TEST_CASE=missing_app
if run compact layout; then echo 'Layout accepted without Fully' >&2; exit 1; fi
unset FULLY_TEST_CASE
if run invalid; then echo 'Invalid layout accepted' >&2; exit 1; fi
if [[ -s "$FULLY_TEST_LOG" ]]; then echo 'Device accessed with invalid layout' >&2; exit 1; fi
printf 'PASS: Both layouts, setup/layout-only imports, cleanup, missing app and failure cases. Fixtures: %s\n' "$fixture"
