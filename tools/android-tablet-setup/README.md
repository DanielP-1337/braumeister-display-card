# Android-Tablets: ADB einrichten

Die Skripte stellen Android Debug Bridge (ADB) bereit, prüfen die Verbindung zu Android-Tablets verschiedener Hersteller und speichern Modell und Android-Version. Bei Fire-Geräten wird zusätzlich Fire OS angezeigt. Android Studio ist nicht erforderlich. Fehlende Platform Tools werden von Google heruntergeladen; dafür ist eine Internetverbindung nötig.

## 1. Tablet vorbereiten

1. **Einstellungen → Über das Tablet / Tablet-Info → Softwareinformationen** öffnen (Menüpfad je nach Hersteller unterschiedlich).
2. Die **Buildnummer siebenmal** antippen und gegebenenfalls die Geräte-PIN eingeben. Bei **Amazon Fire** stattdessen unter **Geräteoptionen → Über das Fire-Tablet** die **Seriennummer siebenmal** antippen.
3. Zurück unter **Entwickleroptionen** die Option **USB-Debugging / ADB** aktivieren.
4. Tablet mit einem **USB-Datenkabel** verbinden und entsperren.
5. Sobald der Dialog erscheint, **USB-Debugging für den eigenen Computer zulassen**.

## 2. Skript starten

### Windows

1. `Setup-Android-ADB.ps1` im Projektordner ablegen.
2. PowerShell in diesem Ordner öffnen (Windows PowerShell 5.1 oder PowerShell 7).
3. Ausführen:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Setup-Android-ADB.ps1
```

`Bypass` gilt nur für diesen Prozess. Falls Windows das Tablet nicht erkennt, den passenden USB-Treiber des Herstellers installieren: [Android-Treiberübersicht](https://developer.android.com/studio/run/oem-usb). Für Fire-Geräte siehe [Amazons ADB-Anleitung](https://developer.amazon.com/docs/fire-tablets/connecting-adb-to-device).

### Linux

1. `Setup-Android-ADB.sh` im Projektordner ablegen. Bash ab 3.2 sowie `curl` und `unzip` müssen installiert sein.
2. Ein Terminal im Projektordner öffnen und als normaler Benutzer ausführen:

```bash
bash ./Setup-Android-ADB.sh
```

Bei fehlenden USB-Zugriffsrechten die udev-Regeln und Gruppenmitgliedschaft prüfen. Für Ubuntu beschreibt [Google die Einrichtung mit `plugdev` und `android-sdk-platform-tools-common`](https://developer.android.com/studio/run/device).

Der automatische Linux-Download unterstützt x86_64. Unter ARM-Linux ein natives ADB über den Paketmanager installieren und stattdessen starten mit:

```bash
bash ./Setup-Android-ADB.sh --adb "$(command -v adb)"
```

### macOS

1. `Setup-Android-ADB.sh` im Projektordner ablegen. Bash ab 3.2 sowie `curl` und `unzip` werden benötigt.
2. Terminal öffnen und mit `cd "/Pfad/zum/Projektordner"` in den Ordner wechseln.
3. Ausführen:

```bash
bash ./Setup-Android-ADB.sh
```

Das Skript lädt bei Bedarf Googles Mac-Paket. Zusätzliche USB-Treiber sind laut [Google](https://developer.android.com/studio/run/device) nicht erforderlich.

## 3. Ergebnis prüfen

Das Skript wartet standardmäßig bis zu **90 Sekunden** auf die Gerätefreigabe. Bei Erfolg erscheinen Modell, Seriennummer, Android, API-Level und Build-ID im Terminal. **Fire OS** erscheint nur bei Amazon-Geräten oder wenn das Gerät ausdrücklich eine Fire-OS-Version meldet.

Die Angaben werden zusätzlich mit UTC-Zeitpunkt in **`Android-Geraeteinformationen.txt`** neben dem Skript gespeichert. Jeder erfolgreiche Durchlauf ersetzt den vorherigen Bericht, auch beim Wechsel des Tablets. Ohne die optionalen Fully- und Akkuschutz-Optionen werden keine Apps installiert oder Tablet-Einstellungen geändert.

Bekannte Modellkennungen werden als **Samsung Galaxy Tab A9+ (Wi-Fi)** (`SM-X210`) bzw. **Amazon Fire HD 10 (2023, 13. Generation)** (`KFTUWI`) angezeigt. Andere Geräte werden mit ihrem gemeldeten Hersteller und Modell angezeigt, ohne Herstellerwarnung. Es gibt keine vollständige Modellnamendatenbank. Quellen: [Samsung](https://www.samsung.com/de/support/model/SM-X210NZAAEUB/), [Amazon](https://developer.amazon.com/docs/device-specs/ft-identify-tablet-devices).

## 4. Weitere Optionen nutzen

Diese Optionen an den jeweiligen Startbefehl aus Schritt 2 anhängen:

| Zweck | Windows | Linux / macOS |
|---|---|---|
| Nur ADB bereitstellen | `-InstallOnly` | `--install-only` |
| Bestimmtes Gerät auswählen | `-Serial 'SERIENNUMMER'` | `--serial 'SERIENNUMMER'` |
| 120 Sekunden warten | `-TimeoutSeconds 120` | `--timeout 120` |
| Anderen Tools-Ordner verwenden | `-ToolsDirectory 'C:\ADB'` | `--tools-directory "$HOME/AndroidTools"` |

Bei **unauthorized** den Dialog am Tablet bestätigen; bei **offline** das Kabel neu verbinden. Bei mehreren Geräten die gewünschte Seriennummer angeben. Vorhandene Platform Tools werden wiederverwendet, aber nicht automatisch aktualisiert.

Weitere Details stehen in `ADB-Einrichtung.md`. Die Windows-Version wurde mit Fire HD 10 und Samsung Galaxy Tab A9+ getestet; die Bash-Version wurde auf Syntax und mit simulierten Linux-/macOS-Verbindungen geprüft. Ein echter USB-Test unter Linux/macOS steht noch aus.

## 5. Fully Kiosk installieren oder aktualisieren und Dashboard einrichten

Den Projektordner einschließlich `scripts/` und `fully-ha-settings.json` verwenden. Tablet verbinden und den gewünschten Startbefehl ausführen:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Setup-Android-ADB.ps1 -Serial 'SERIENNUMMER' -SetupFully
```

```bash
bash ./Setup-Android-ADB.sh --serial 'SERIENNUMMER' --setup-fully
```

Dabei wird die aktuelle reguläre APK von der offiziellen Fully-Downloadseite geladen und mit `adb install -r` installiert bzw. aktualisiert. Bei Signaturkonflikten oder einem neueren installierten Stand bricht das Skript ab; es deinstalliert nichts automatisch. Alternativ eine bereits heruntergeladene offizielle APK angeben: `-FullyApkPath 'C:\Downloads\Fully.apk'` bzw. `--fully-apk "$HOME/Downloads/Fully.apk"` zusätzlich zur Setup-Option.

Das gemeinsame Profil `fully-ha-settings.json` richtet dasselbe Dashboard wie auf dem Fire HD 10 ein:

`http://192.168.2.56:8123/firehd-braumeister/braumeister_tablet`

Es setzt Startseite, Vollbild ohne Aktionsleiste, Hochformat, Display-an während der Nutzung, Autostart und Neuladen nach WLAN-Verbindung. Die vorhandene JavaScript-Anpassung blendet HA-Kopfzeile und Seitenleiste nur für dieses Dashboard aus. Das Tablet muss den HA-Server im lokalen Netz erreichen können.

Der Import erteilt Fully den nötigen Speicherzugriff, startet die App neu und wartet auf die Verarbeitung von `fully-once-settings.json`. Bei offenen Berechtigungsdialogen am Tablet bestätigen. Bei Erfolg gegebenenfalls **einmal direkt in Home Assistant anmelden**. Passwörter, PINs, Lizenzdaten und Anmeldesitzungen werden nicht kopiert. PLUS-Funktionen benötigen eine Lizenz für das jeweilige Tablet. Eine Sperre gegen das Verlassen der App und die HA-Fully-Integration werden nicht automatisch aktiviert.

Neustarttest am Samsung (21.11.2026): Nach vollstaendigem Tablet-Neustart bestaetigte der Benutzer Fully mit geladenem HA-Dashboard, ohne manuellen App-Start. Eine erneute ADB-Sichtpruefung blieb wegen fehlender USB-Debugging-Freigabe aus. Details in ADB-Einrichtung.md.

Nach wiederhergestellter ADB-Freigabe wurde die erhaltene HA-Anmeldung auch per Screenshot bestaetigt; Fully lief bereits und wurde fuer die Sichtkontrolle wieder in den Vordergrund geholt.

## Akkuschutz fuer den Dauerbetrieb

Bei `-SetupFully` / `--setup-fully` wird auf unterstuetzten Samsung-Geraeten automatisch der Akkuschutz **Maximum, 80 %** eingerichtet. Nur den Akkuschutz setzen, ohne Fully erneut zu installieren:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Setup-Android-ADB.ps1 -Serial 'SERIENNUMMER' -BatteryProtection80
```

```bash
bash ./Setup-Android-ADB.sh --serial 'SERIENNUMMER' --battery-protection-80
```

Die Automatik prueft Hersteller, vorhandene Samsung-Einstellungen und den Akkudienst. Sie setzt `protect_battery=1` und `battery_protection_threshold=80` im globalen Einstellungsbereich. Anschliessend muessen sowohl die gelesenen Einstellungen als auch der Akkudienst den Modus und das 80-%-Limit bestaetigen. Das Ergebnis wird im Geraetebericht gespeichert. Andere Hersteller, fehlende Schluessel oder eine unbekannte Schnittstelle werden mit Hinweis uebersprungen; es werden keine Samsung-Schluessel auf Fire-Tablets angelegt. Ein fehlgeschlagener Schreib-/Pruefschritt bricht das Setup ab; eventuell bereits gesetzte Werte bleiben bestehen und sind am Tablet zu kontrollieren.

Geprueft am Galaxy Tab A9+ SM-X210 mit Android 16 / One UI 8. Die Samsung-Schnittstelle ist herstellerspezifisch; fuer andere Modelle/Firmware ist keine allgemeine Garantie moeglich. Ohne Setup- oder Akkuschutz-Option bleibt die ADB-Abfrage unveraendert. `-InstallOnly` / `--install-only` kann nicht mit diesen Optionen kombiniert werden.

Ein bereits hoeherer Ladestand sinkt nicht sofort auf 80 %. Die erfolgreiche Pruefung bestaetigt die konfigurierte Ladegrenze, keinen vollstaendigen Lade-/Entladezyklus. Zum Rueckgaengigmachen Einstellungen > Akku > Akkuschutz am Tablet verwenden.
