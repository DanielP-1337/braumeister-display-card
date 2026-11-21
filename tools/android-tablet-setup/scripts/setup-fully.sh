#!/usr/bin/env bash
set -euo pipefail
adb=$1; serial=$2; apk=${3:-}
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)
settings="$root/fully-ha-settings.json"
package=de.ozerov.fully
die() { printf 'Fehler: %s\n' "$*" >&2; exit 1; }
device() { "$adb" -s "$serial" "$@"; }
[[ -s "$settings" ]] || die 'fully-ha-settings.json fehlt oder ist leer.'
for remote_file in /sdcard/fully-once-settings.json /sdcard/fully-auto-settings.json; do
    exists=$(device shell "if [ -e $remote_file ]; then echo EXISTS; else echo ABSENT; fi")
    [[ "${exists//$'\r'/}" == ABSENT ]] || die "Importdatei vorhanden oder Status unklar: $remote_file. Vor erneutem Setup pruefen."
done
before=$(device shell dumpsys package "$package")
before_version=$(printf '%s\n' "$before" | sed -n 's/.*versionName=\([^[:space:]]*\).*/\1/p' | head -n 1)
printf 'Fully vorher: %s\n' "${before_version:-nicht installiert}"
if [[ -z "$apk" ]]; then
    command -v curl >/dev/null || die 'curl fehlt.'
    mkdir -p "$root/tools"
    download_dir=$(mktemp -d "$root/tools/fully-download.XXXXXX")
    curl --fail --location --connect-timeout 30 --max-time 60 \
        'https://www.fully-kiosk.com/docs/en/getting-started/downloads' --output "$download_dir/downloads.html"
    apk_url=$(grep -Eo 'https://www\.fully-kiosk\.com/files/[0-9]{4}/[0-9]{2}/Fully-Kiosk-Browser-v[0-9.]+\.apk' "$download_dir/downloads.html" | head -n 1) || die 'Offizieller APK-Link nicht gefunden. --fully-apk mit regulaerer APK verwenden.'
    [[ -n "$apk_url" ]] || die 'Offizieller APK-Link fehlt.'
    apk="$download_dir/Fully-Kiosk-Browser.apk"
    printf 'Offizieller Download: %s\n' "$apk_url"
    curl --fail --location --connect-timeout 30 --max-time 180 "$apk_url" --output "$apk"
fi
[[ -f "$apk" ]] || die "APK fehlt: $apk"
printf 'Fully installieren/aktualisieren (bestehende App-Daten bleiben erhalten) ...\n'
installed=$(device install -r "$apk") || die 'Installation fehlgeschlagen. Signatur/Edition pruefen; es wird nicht automatisch deinstalliert oder herabgestuft.'
printf '%s\n' "$installed" | grep -q '^Success[[:space:]]*$' || die "Installation nicht bestaetigt: $installed"
after=$(device shell dumpsys package "$package")
after_version=$(printf '%s\n' "$after" | sed -n 's/.*versionName=\([^[:space:]]*\).*/\1/p' | head -n 1)
[[ -n "$after_version" ]] || die 'Regulaere Fully-App nach Installation nicht gefunden. APK-Edition pruefen.'
printf 'Fully jetzt: %s\n' "$after_version"
sdk=$(device shell getprop ro.build.version.sdk)
sdk=${sdk//$'\r'/}
[[ "$sdk" =~ ^[0-9]+$ ]] || die 'Android API-Level ungueltig.'
if (( sdk >= 30 )); then
    device shell appops set --uid "$package" MANAGE_EXTERNAL_STORAGE allow
    access=$(device shell appops get --uid "$package" MANAGE_EXTERNAL_STORAGE)
    [[ "$access" == *allow* ]] || die 'In Android Alle Dateien verwalten fuer Fully zulassen.'
elif (( sdk >= 23 )); then
    device shell pm grant "$package" android.permission.READ_EXTERNAL_STORAGE
    device shell pm grant "$package" android.permission.WRITE_EXTERNAL_STORAGE
fi
device shell am force-stop "$package"
device push "$settings" /sdcard/fully-once-settings.json
started=$(device shell am start -W -n de.ozerov.fully/.MainActivity)
[[ "$started" != *Error:* && "$started" != *Exception* ]] || die "Fully konnte nicht gestartet werden: $started"
printf 'Warte auf Einstellungsimport; eventuell Dialoge am Tablet bestaetigen ...\n'
for ((attempt=0; attempt<30; attempt++)); do
    pending=$(device shell 'if [ -e /sdcard/fully-once-settings.json ]; then echo PENDING; else echo CONSUMED; fi')
    if [[ "${pending//$'\r'/}" == CONSUMED ]]; then
        printf 'Fully hat die Importdatei verarbeitet. HA-Dashboard aus fully-ha-settings.json eingerichtet.\n'
        printf 'Falls die HA-Anmeldeseite erscheint: am Tablet anmelden. PLUS-Funktionen benoetigen eine eigene Lizenz.\n'
        exit 0
    fi
    sleep 2
done
die 'Fully installiert, Import noch offen. Speicherzugriff und Other Settings > Enable Settings Auto-Import pruefen, Fully neu starten oder bereitgestellte JSON-Datei manuell importieren.'
