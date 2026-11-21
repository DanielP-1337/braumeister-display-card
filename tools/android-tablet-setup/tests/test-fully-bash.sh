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
    'shell dumpsys package de.ozerov.fully') echo 'versionName=1.61.4' ;;
    'install -r '*)
        if [[ "${FULLY_TEST_CASE:-}" == install_failure ]]; then echo 'Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE]'; exit 1; fi
        echo Success ;;
    'shell getprop ro.build.version.sdk') echo 36 ;;
    'shell appops set --uid de.ozerov.fully MANAGE_EXTERNAL_STORAGE allow') ;;
    'shell appops get --uid de.ozerov.fully MANAGE_EXTERNAL_STORAGE')
        if [[ "${FULLY_TEST_CASE:-}" == permission_failure ]]; then echo default; else echo 'MANAGE_EXTERNAL_STORAGE: allow'; fi ;;
    'shell am force-stop de.ozerov.fully') ;;
    'push '*) [[ "$*" == *'/sdcard/fully-once-settings.json' ]] || exit 91 ;;
    'shell am start -W -n de.ozerov.fully/.MainActivity') echo 'Status: ok' ;;
    *) printf 'Unexpected command: %s\n' "$*" >&2; exit 92 ;;
esac
MOCK
chmod +x "$fixture/adb"
run() {
    : > "$FULLY_TEST_LOG"
    bash "$fixture/scripts/setup-fully.sh" "$fixture/adb" TEST123 "$fixture/test.apk" > "$fixture/output.log" 2>&1
}
run
grep -q 'Importdatei verarbeitet' "$fixture/output.log"
grep -q '^install -r ' "$FULLY_TEST_LOG"
grep -q '^push ' "$FULLY_TEST_LOG"
for scenario in conflict install_failure permission_failure; do
    export FULLY_TEST_CASE=$scenario
    if run; then echo "Unexpected success: $scenario" >&2; exit 1; fi
    if grep -q '^push ' "$FULLY_TEST_LOG"; then echo 'Pushed settings after failure' >&2; exit 1; fi
done
printf 'PASS: Fully install/import, conflict, signature failure, permission failure. Fixtures: %s\n' "$fixture"
