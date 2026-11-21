#!/usr/bin/env bash
# Isolated smoke tests: no downloads, USB access, or changes to the real report.
set -euo pipefail
source_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
fixture=$(mktemp -d)
mkdir "$fixture/bin"
mkdir "$fixture/scripts"
export TEST_FULLY_ARGS="$fixture/fully-args.txt"
cat > "$fixture/scripts/setup-fully.sh" <<'MOCK'
#!/usr/bin/env bash
printf 'layout=%s mode=%s\n' "$4" "$5" > "$TEST_FULLY_ARGS"
[[ "${TEST_FULLY_FAIL:-}" != yes ]]
MOCK
cp "$source_dir/Setup-Android-ADB.sh" "$fixture/Setup-Android-ADB.sh"
cat > "$fixture/bin/uname" <<'MOCK'
#!/usr/bin/env bash
case "$1" in -s) echo "${TEST_OS:-Linux}" ;; -m) echo x86_64 ;; esac
MOCK
cat > "$fixture/bin/adb" <<'MOCK'
#!/usr/bin/env bash
case "$1" in
    version) echo 'Mock ADB'; exit 0 ;;
    start-server) exit 0 ;;
    devices)
        echo 'List of devices attached'
        case "${TEST_CASE:-success}" in
            missing) ;;
            unauthorized) printf 'TEST123\tunauthorized\n' ;;
            permissions) printf 'TEST123\tno permissions (udev rules)\n' ;;
            multiple) printf 'TEST123\tdevice\nSECOND\tdevice\n' ;;
            *) printf 'TEST123\tdevice\n' ;;
        esac
        exit 0 ;;
esac
[[ "$1" == -s && "$2" == TEST123 && "$3" == shell ]] || exit 2
if [[ "$4" == settings ]]; then
    if [[ "$5" == put ]]; then
        [[ "${TEST_MANUFACTURER:-}" == samsung && "${TEST_CASE:-}" != unsupported_battery ]] || exit 90
        echo "$8" > "$TEST_BATTERY_STATE/$7"
    elif [[ "${TEST_CASE:-}" == unsupported_battery ]]; then
        echo null
    else
        cat "$TEST_BATTERY_STATE/$7"
    fi
    exit 0
fi
if [[ "$4" == dumpsys ]]; then
    if [[ "${TEST_CASE:-}" == battery_failure ]]; then
        printf 'mProtectBatteryMode: 0\nmMaximumProtectionThreshold: 95\n'
    else
        printf 'mProtectBatteryMode: %s\nmMaximumProtectionThreshold: %s\n' "$(cat "$TEST_BATTERY_STATE/protect_battery")" "$(cat "$TEST_BATTERY_STATE/battery_protection_threshold")"
    fi
    exit 0
fi
[[ "$4" == getprop ]] || exit 2
[[ "${TEST_CASE:-}" != property_failure ]] || exit 1
case "$5" in
    ro.product.manufacturer) echo "${TEST_MANUFACTURER:-Amazon}" ;;
    ro.product.model) echo "${TEST_MODEL:-KFTUWI}" ;;
    ro.build.version.name) [[ "${TEST_CASE:-}" == empty_version ]] || echo 'Fire OS 8.3.3.8 (RS8338/3344)'; exit 0 ;;
    ro.build.version.release) echo 11 ;;
    ro.build.version.sdk) echo 30 ;;
    ro.build.display.id) echo RS8338.3344N ;;
    *) exit 2 ;;
esac
MOCK
chmod +x "$fixture/bin/uname" "$fixture/bin/adb"
export PATH="$fixture/bin:$PATH"
run() { bash "$fixture/Setup-Android-ADB.sh" --adb "$fixture/bin/adb" --timeout 0 "$@" > "$fixture/output.txt" 2>&1; }
report="$fixture/Android-Geraeteinformationen.txt"
export TEST_BATTERY_STATE="$fixture"
for os in Linux Darwin; do
    export TEST_OS=$os TEST_CASE=success
    run
    grep -q 'Amazon Fire HD 10 (2023, 13. Generation)' "$report"
    grep -q 'Fire OS 8.3.3.8' "$report"
    grep -q 'Android: *11' "$report"
    cp "$report" "$fixture/baseline.txt"
    run --install-only
    cmp "$report" "$fixture/baseline.txt"
    for scenario in missing unauthorized permissions multiple property_failure; do
        export TEST_CASE=$scenario
        if run; then echo "Unexpected success: $scenario" >&2; exit 1; fi
        cmp "$report" "$fixture/baseline.txt"
    done
    export TEST_CASE=multiple
    run --serial TEST123
    export TEST_CASE=empty_version
    run
    grep -q 'Nicht vom Geraet gemeldet' "$report"
    export TEST_MANUFACTURER=samsung TEST_MODEL=SM-X210
    run
    grep -Fq 'Samsung Galaxy Tab A9+ (Wi-Fi)' "$report"
    if grep -Eq 'Fire OS:|Amazon-Tablet' "$report" "$fixture/output.txt"; then exit 1; fi
    echo 0 > "$fixture/protect_battery"
    echo 95 > "$fixture/battery_protection_threshold"
    run --battery-protection-80
    grep -q 'Akkuschutz: Maximum, 80 %' "$report"
    export TEST_CASE=battery_failure
    if run --battery-protection-80; then echo 'Unverified battery mode accepted' >&2; exit 1; fi
    export TEST_CASE=unsupported_battery
    run --battery-protection-80
    grep -q 'uebersprungen' "$report"
    export TEST_CASE=empty_version
    export TEST_MANUFACTURER=Example TEST_MODEL=UnknownTablet
    run
    grep -q 'Modell: *Example UnknownTablet' "$report"
    if grep -Eq 'Fire OS:|Amazon-Tablet' "$report" "$fixture/output.txt"; then exit 1; fi
    run --battery-protection-80
    grep -q 'uebersprungen' "$report"
    unset TEST_MANUFACTURER TEST_MODEL
done
if run --timeout 601; then echo 'Invalid timeout accepted' >&2; exit 1; fi
if run --serial; then echo 'Missing option value accepted' >&2; exit 1; fi
if run --setup-fully; then echo 'Implicit layout accepted' >&2; exit 1; fi
if run --fully-layout invalid; then echo 'Invalid layout accepted' >&2; exit 1; fi
if run --fully-layout; then echo 'Missing layout value accepted' >&2; exit 1; fi
if run --install-only --fully-layout compact; then echo 'Conflicting layout flags accepted' >&2; exit 1; fi
for layout in compact fullscreen; do
    run --fully-layout "$layout"
    grep -q "layout=$layout mode=layout" "$TEST_FULLY_ARGS"
    grep -q "Fully-Darstellung: $layout" "$report"
    run --setup-fully --fully-layout "$layout"
    grep -q "layout=$layout mode=setup" "$TEST_FULLY_ARGS"
done
export TEST_FULLY_FAIL=yes
if run --fully-layout compact; then echo 'Failed import accepted' >&2; exit 1; fi
if grep -q 'Fully-Darstellung:' "$report"; then echo 'Failed import reported as successful' >&2; exit 1; fi
printf 'PASS: Linux/macOS simulation, report, selection, error cases. Fixtures: %s\n' "$fixture"
