#!/usr/bin/env bash
# Compatible with macOS Bash 3.2 and Linux Bash.
set -euo pipefail

die() { printf 'Fehler: %s\n' "$*" >&2; exit 1; }
usage() {
    cat <<'HELP'
Aufruf: bash Setup-Android-ADB.sh [Optionen]
  --serial SERIENNUMMER  Geraet explizit auswaehlen
  --timeout SEKUNDEN     Wartezeit 0 bis 600 (Standard: 90)
  --tools-directory DIR  Installationsordner fuer platform-tools
  --adb DATEI           Vorhandene native ADB-Datei verwenden, kein Download
  --install-only        Nur ADB bereitstellen, keine Geraeteabfrage
  --setup-fully         Fully installieren/aktualisieren und HA-Dashboard einrichten
  --battery-protection-80  Samsung-Akkuschutz auf 80 % setzen (auch bei --setup-fully)
  --fully-apk DATEI     Lokale offizielle APK statt aktuellem Download verwenden
  --help                Hilfe anzeigen
HELP
}

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
serial=''; timeout=90; tools_dir=''; adb=''; install_only=false
setup_fully=false; fully_apk=''
battery_protection=false
while (( $# )); do
    case "$1" in
        --serial|--timeout|--tools-directory|--adb|--fully-apk)
            (( $# >= 2 )) && [[ -n "$2" ]] || die "Wert fuer $1 fehlt."
            case "$1" in
                --serial) serial=$2 ;;
                --timeout) timeout=$2 ;;
                --tools-directory) tools_dir=$2 ;;
                --adb) adb=$2 ;;
                --fully-apk) fully_apk=$2 ;;
            esac
            shift 2 ;;
        --install-only) install_only=true; shift ;;
        --setup-fully) setup_fully=true; shift ;;
        --battery-protection-80) battery_protection=true; shift ;;
        --help|-h) usage; exit 0 ;;
        *) die "Unbekannte Option: $1 (siehe --help)" ;;
    esac
done
if "$install_only" && { "$setup_fully" || "$battery_protection"; }; then die '--install-only kann nicht mit Geraeteeinrichtung kombiniert werden.'; fi
if [[ -n "$fully_apk" ]] && ! "$setup_fully"; then die '--fully-apk benoetigt --setup-fully.'; fi
[[ "$timeout" =~ ^[0-9]{1,3}$ ]] || die '--timeout muss zwischen 0 und 600 liegen.'
timeout=$((10#$timeout))
(( timeout <= 600 )) || die '--timeout muss zwischen 0 und 600 liegen.'
case "$(uname -s)" in
    Linux) platform=linux ;;
    Darwin) platform=darwin ;;
    *) die 'Dieses Skript unter Linux oder macOS ausfuehren. Fuer Windows die .ps1-Version verwenden.' ;;
esac

if [[ -z "$adb" ]]; then
    tools_dir=${tools_dir:-"$script_dir/tools/$platform"}
    mkdir -p -- "$tools_dir"
    tools_dir=$(cd -- "$tools_dir" && pwd -P)
    adb="$tools_dir/platform-tools/adb"
    if [[ ! -f "$adb" ]]; then
        [[ ! -e "$tools_dir/platform-tools" ]] || die 'Unvollstaendige Platform Tools: Ordner pruefen oder anderen --tools-directory angeben.'
        if [[ "$platform" == linux && "$(uname -m)" != x86_64 ]]; then
            die 'Automatischer Linux-Download nur fuer x86_64. Native ADB-Version der Distribution installieren und mit --adb /pfad/zu/adb angeben.'
        fi
        command -v curl >/dev/null || die 'curl fehlt. Bitte ueber den Paketmanager installieren.'
        command -v unzip >/dev/null || die 'unzip fehlt. Bitte ueber den Paketmanager installieren.'
        staging=$(mktemp -d "$tools_dir/adb-download.XXXXXX")
        printf 'Lade Android Platform Tools von Google herunter ...\n'
        curl --fail --location --connect-timeout 30 --max-time 180 \
            "https://dl.google.com/android/repository/platform-tools-latest-$platform.zip" \
            --output "$staging/platform-tools.zip"
        unzip -q "$staging/platform-tools.zip" -d "$staging"
        [[ -f "$staging/platform-tools/adb" ]] || die "ADB fehlt im Download: $staging"
        chmod u+x "$staging/platform-tools/adb"
        mv -- "$staging/platform-tools" "$tools_dir/platform-tools"
        printf 'Downloadarchiv aufbewahrt: %s/platform-tools.zip\n' "$staging"
    fi
fi
[[ -x "$adb" ]] || die "ADB ist nicht ausfuehrbar: $adb"
"$adb" version || die 'ADB konnte nicht gestartet werden. Betriebssystem/Architektur und Laufzeitbibliotheken pruefen.'
printf 'ADB-Pfad: %s\n' "$adb"
if "$install_only"; then
    printf 'Platform Tools bereit. Geraetepruefung uebersprungen.\n'
    exit 0
fi

cat <<'GUIDE'

Am Android-Tablet (Menues unterscheiden sich je nach Hersteller):
1. Einstellungen > Ueber das Tablet / Tablet-Info > Softwareinformationen oeffnen.
2. Buildnummer siebenmal antippen, falls Entwickleroptionen noch fehlen.
   Bei Amazon Fire: Geraeteoptionen > Ueber das Fire-Tablet > Seriennummer.
3. USB-Debugging / ADB unter Entwickleroptionen aktivieren.
4. USB-Datenkabel anschliessen, Tablet entsperren und RSA-Dialog bestaetigen.

GUIDE
"$adb" start-server || die 'Der ADB-Server konnte nicht gestartet werden.'
deadline=$((SECONDS + timeout))
last_status=''
while :; do
    lines=$("$adb" devices -l) || die 'Die Geraeteliste konnte nicht gelesen werden.'
    count=0; target=''; status=missing
    while read -r device state rest; do
        [[ -n "$device" ]] || continue
        case "$state" in
            device|unauthorized|offline|recovery|sideload|bootloader|no) ;;
            *) continue ;;
        esac
        [[ -z "$serial" || "$device" == "$serial" ]] || continue
        count=$((count + 1)); target=$device; status=$state
    done <<< "${lines//$'\r'/}"
    if (( count > 1 )); then
        printf '%s\n' "$lines"
        die 'Mehrere Geraete gefunden. Erneut mit --serial SERIENNUMMER starten.'
    fi
    [[ "$status" != device ]] || break
    if [[ "$status" != "$last_status" ]]; then
        case "$status" in
            missing) printf 'Kein passendes Geraet: USB-Datenkabel, Port und USB-Debugging pruefen.\n' ;;
            unauthorized) printf 'Freigabe fehlt: Tablet entsperren und RSA-Dialog bestaetigen.\n' ;;
            offline) printf 'Geraet offline: USB-Kabel neu verbinden.\n' ;;
            no) die 'USB-Zugriffsrechte fehlen. Unter Linux udev-Regeln und Gruppenmitgliedschaft pruefen (siehe Anleitung).' ;;
            *) printf 'Geraetestatus: %s. Tablet normal starten.\n' "$status" ;;
        esac
        last_status=$status
    fi
    (( SECONDS < deadline )) || die 'Keine einsatzbereite Verbindung innerhalb der Wartezeit. Kabel, USB-Freigabe und unter Linux udev-Regeln pruefen; danach erneut starten.'
    sleep 2
done

get_property() {
    local value
    value=$("$adb" -s "$target" shell getprop "$1") || { printf 'Systemeigenschaft %s konnte nicht gelesen werden.\n' "$1" >&2; return 1; }
    printf '%s' "${value//$'\r'/}"
}
manufacturer=$(get_property ro.product.manufacturer)
model=$(get_property ro.product.model)
fire_os=$(get_property ro.build.version.name)
android=$(get_property ro.build.version.release)
api=$(get_property ro.build.version.sdk)
build=$(get_property ro.build.display.id)
model_name="$manufacturer $model"
manufacturer_key=$(printf '%s' "$manufacturer" | tr '[:upper:]' '[:lower:]')
# https://developer.amazon.com/docs/device-specs/ft-identify-tablet-devices
if [[ "$manufacturer_key" == amazon && "$model" == KFTUWI ]]; then
    model_name='Amazon Fire HD 10 (2023, 13. Generation)'
fi
# https://www.samsung.com/de/support/model/SM-X210NZAAEUB/
if [[ "$manufacturer_key" == samsung && "$model" == SM-X210 ]]; then
    model_name='Samsung Galaxy Tab A9+ (Wi-Fi)'
fi
show_fire_os=false
if [[ "$manufacturer_key" == amazon || "$fire_os" == 'Fire OS '* ]]; then
    show_fire_os=true
fi
[[ "$fire_os" == 'Fire OS '* ]] || fire_os='Nicht vom Geraet gemeldet'
android=${android:-'Nicht vom Geraet gemeldet'}

report="$script_dir/Android-Geraeteinformationen.txt"
# Write beside the destination, then replace only after a complete write.
report_temp=$(mktemp "$script_dir/.adb-report.XXXXXX")
trap 'rm -f -- "$report_temp"' EXIT
{
    printf 'ADB-Geraeteinformationen\n'
    printf 'Ausgelesen (UTC): %s\n' "$(date -u '+%Y-%m-%d %H:%M:%S')"
    printf 'Hersteller:      %s\n' "$manufacturer"
    printf 'Modell:          %s\n' "$model_name"
    printf 'Modellkennung:   %s\n' "$model"
    printf 'Seriennummer:    %s\n' "$target"
    if "$show_fire_os"; then printf 'Fire OS:         %s\n' "$fire_os"; fi
    printf 'Android:         %s\n' "$android"
    printf 'API-Level:       %s\n' "$api"
    printf 'Build-ID:        %s\n' "$build"
} > "$report_temp"
mv -f -- "$report_temp" "$report"
printf '\nADB-Verbindung erfolgreich.\n'
cat -- "$report"
printf '\nGeraeteinformationen gespeichert: %s\n' "$report"
if "$battery_protection" || "$setup_fully"; then
    battery_result='Akkuschutz 80 %: uebersprungen (keine unterstuetzte Samsung-Schnittstelle).'
    if [[ "$manufacturer_key" == samsung ]]; then
        old_mode=$("$adb" -s "$target" shell settings get global protect_battery)
        old_limit=$("$adb" -s "$target" shell settings get global battery_protection_threshold)
        battery_service=$("$adb" -s "$target" shell dumpsys battery)
        old_mode=${old_mode//$'\r'/}; old_limit=${old_limit//$'\r'/}
        if [[ "$old_mode" =~ ^[0-4]$ && "$old_limit" =~ ^(80|85|90|95)$ && "$battery_service" == *mMaximumProtectionThreshold:* ]]; then
            "$adb" -s "$target" shell settings put global protect_battery 1
            "$adb" -s "$target" shell settings put global battery_protection_threshold 80
            sleep 2
            mode=$("$adb" -s "$target" shell settings get global protect_battery)
            limit=$("$adb" -s "$target" shell settings get global battery_protection_threshold)
            battery_service=$("$adb" -s "$target" shell dumpsys battery)
            [[ "${mode//$'\r'/}" == 1 && "${limit//$'\r'/}" == 80 ]] || die 'Akkuschutz geschrieben, aber nicht bestaetigt. Einstellungen am Tablet pruefen.'
            printf '%s\n' "$battery_service" | grep -Eq '^[[:space:]]*mProtectBatteryMode:[[:space:]]*1[[:space:]]*$' || die 'Akkudienst bestaetigt Maximum-Modus nicht.'
            printf '%s\n' "$battery_service" | grep -Eq '^[[:space:]]*mMaximumProtectionThreshold:[[:space:]]*80[[:space:]]*$' || die 'Akkudienst bestaetigt 80-%-Limit nicht.'
            battery_result='Akkuschutz: Maximum, 80 % (Einstellungen und Akkudienst bestaetigt).'
        fi
    fi
    printf '%s\n' "$battery_result"
    printf '%s\n' "$battery_result" >> "$report"
fi
if "$setup_fully"; then
    bash "$script_dir/scripts/setup-fully.sh" "$adb" "$target" "$fully_apk"
fi
