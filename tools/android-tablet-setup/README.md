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
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Setup-Android-ADB.ps1 -Serial 'SERIENNUMMER' -SetupFully -FullyLayout compact
```

```bash
bash ./Setup-Android-ADB.sh --serial 'SERIENNUMMER' --setup-fully --fully-layout compact
```

Dabei wird die aktuelle reguläre APK von der offiziellen Fully-Downloadseite geladen und mit `adb install -r` installiert bzw. aktualisiert. Bei Signaturkonflikten oder einem neueren installierten Stand bricht das Skript ab; es deinstalliert nichts automatisch. Alternativ eine bereits heruntergeladene offizielle APK angeben: `-FullyApkPath 'C:\Downloads\Fully.apk'` bzw. `--fully-apk "$HOME/Downloads/Fully.apk"` zusätzlich zur Setup-Option.

Das gemeinsame Profil `fully-ha-settings.json` richtet dasselbe Dashboard wie auf dem Fire HD 10 ein:

`http://192.168.2.56:8123/firehd-braumeister/braumeister_tablet`

Es setzt Startseite, Vollbild ohne Aktionsleiste, Hochformat, Display-an während der Nutzung, Autostart und Neuladen nach WLAN-Verbindung. Die JavaScript-Anpassung blendet HA-Kopfzeile und Seitenleiste nur für dieses Dashboard aus und setzt einen dunklen Außenhintergrund. Die Kartenhöhe wählst du ausdrücklich mit `compact` oder `fullscreen` (siehe unten). Ohne diese Auswahl bricht die Fully-Einrichtung vor dem Gerätezugriff ab. Das Tablet muss die konfigurierte HA-Adresse erreichen können.

Der Import erteilt Fully den nötigen Speicherzugriff, startet die App neu und wartet auf die Verarbeitung von `fully-once-settings.json`. Bei offenen Berechtigungsdialogen am Tablet bestätigen. Bei Erfolg gegebenenfalls **einmal direkt in Home Assistant anmelden**. Passwörter, PINs, Lizenzdaten und Anmeldesitzungen werden nicht kopiert. PLUS-Funktionen benötigen eine Lizenz für das jeweilige Tablet. Eine Sperre gegen das Verlassen der App und die HA-Fully-Integration werden nicht automatisch aktiviert.

Für den Start als Kiosk zusätzlich am Tablet den Kiosk-Modus mit eigener PIN aktivieren, angeforderte Berechtigungen prüfen und **Fully Kiosk Browser als Standard-Home-App** wählen. Eine parallel installierte Fully Single App Kiosk ist eine andere App; sie wurde auf dem Testgerät separat deaktiviert. Diese Schritte erledigen die Setup-Skripte nicht automatisch.

Neustarttests am Samsung (21.11.2026): Nach dieser Korrektur blieb der erste Durchlauf länger auf „Loading…“. Ein zweiter vollständiger Neustart zeigte das angemeldete Dashboard automatisch im Vollbild, ohne App-Start oder Menübedienung durch den Tester. Die Ursache des ersten Hängers ist offen. Details in `ADB-Einrichtung.md`.

## 6. Darstellung bewusst wählen

Beide Layouts funktionieren auf beiden Tablet-Modellen. **Fully-Vollbild** (keine Android-/Browserleisten) bleibt in beiden Fällen aktiv. Die Auswahl betrifft die **Höhe der Dashboard-Karte**:

| | `compact` – kompakt | `fullscreen` – bildschirmfüllend |
|---|---|---|
| Kartenhöhe | Nach Inhalt; unten kann dunkle Fläche bleiben | Mindestens die Bildschirmhöhe |
| Außenkanten | Ursprünglich abgerundet | Gerade, ohne Außenradius |
| Innenbereich und Navigation | Navigation direkt unter dem Inhalt | Heller Innenbereich wächst; Navigation wandert nach unten |
| Schrift und Tasten | Unverändert | Unverändert; kein Zoom |
| Referenz im Hochformat | Fire HD 10 | Samsung Galaxy Tab A9+ |
| Screenshot | <img src="docs/images/layout-compact-fire-hd-10.png" width="240" alt="Kompakte Karte auf dem Fire HD 10 mit dunkler Restfläche darunter"> | <img src="docs/images/layout-fullscreen-samsung-a9-plus.png" width="240" alt="Bildschirmfüllende Karte auf dem Samsung A9+ mit Navigation am unteren Rand"> |

Aufnahmen vom 21.11.2026, jeweils **1200 × 1920 Pixel**. Die kompakte Referenz zeigt die bisherige Fire-Darstellung (Kartenhöhe ca. 1133 Pixel); die Samsung-Referenz zeigt das neue Vollhöhenlayout. Der dunkle Außenhintergrund wird jetzt in beiden Varianten unabhängig vom Systemmodus gesetzt. Lange Inhalte bleiben scrollbar. Diese lokale Fully-Anpassung ändert weder das HA-Benutzer-Theme noch die Darstellung auf anderen Geräten.

Bei der Einrichtung oben `compact` durch `fullscreen` ersetzen, wenn die Karte den Bildschirm ausfüllen soll. Ein späterer Wechsel benötigt keine erneute APK-Installation:

```powershell
# Windows: nur Darstellung einer bereits installierten Fully-App ändern
.\Setup-Android-ADB.ps1 -Serial 'SERIENNUMMER' -FullyLayout fullscreen
# Zurück zur kompakten Darstellung:
.\Setup-Android-ADB.ps1 -Serial 'SERIENNUMMER' -FullyLayout compact
```

```bash
# Linux/macOS: nur Darstellung ändern
bash ./Setup-Android-ADB.sh --serial 'SERIENNUMMER' --fully-layout fullscreen
# Zurück zur kompakten Darstellung:
bash ./Setup-Android-ADB.sh --serial 'SERIENNUMMER' --fully-layout compact
```

Der reine Layout-Wechsel importiert **nur `injectJsCode`** aus dem mitgelieferten Profil und startet Fully neu. Er ersetzt dabei eventuell vorhandenes eigenes Inject-JavaScript; vorher sichern bzw. zusammenführen. Startadresse, Ausrichtung, Kiosk-PIN und Akkuschutz werden dabei nicht gesetzt. Der Host-/Pfadfilter im Profil muss zur bereits verwendeten Dashboard-Adresse passen. Fully muss installiert sein und der automatische Einstellungsimport aktiviert sein. Bei einer Bedienungshilfen-Freigabe nach dem Neustart prüfen, ob sie erhalten blieb, insbesondere auf Fire OS. Die gewählte Variante wird nach verarbeitetem Import im Gerätebericht vermerkt.

## 7. Heimnetz, Hotspot und Fernzugriff

Fully kann auch über einen Handy-Hotspot auf HA zugreifen. Bei **Nabu Casa** in `fully-ha-settings.json` die `startURL` auf die eigene HTTPS-Fernzugriffsadresse plus Dashboard-Pfad umstellen und den Host-/Pfadfilter in `injectJsCode` entsprechend anpassen. Auf der neuen Adresse in HA anmelden. Die bisherige LAN-IP ist über einen gewöhnlichen Hotspot nicht erreichbar. [Nabu-Casa-Einrichtung](https://support.nabucasa.com/hc/en-us/articles/26474279202973-Enabling-remote-access-to-Home-Assistant)

**Tailscale** ist eine Alternative: HA und Tablet im selben Tailscale-Netz verbinden, anschließend HA über die VPN-Adresse erreichen. Mit einer freigegebenen Subnetzroute kann die bisherige LAN-Adresse weiter genutzt werden. Für HA-Befehle an Fully (z. B. Bildschirm ein/aus) ist zusätzlich die Rückverbindung zur Tablet-VPN-Adresse nötig; bei der HA-Community-App dafür `userspace_networking: false` und passende Zugriffsregeln verwenden. Nabu Casa allein stellt diesen Rückweg nicht her. [Tailscale-HA-App und Konfiguration](https://github.com/hassio-addons/addon-tailscale/blob/main/tailscale/DOCS.md), [Fully-Fernsteuerung](https://www.fully-kiosk.com/docs/en/features/remote-admin)

Für Samsung gibt es die [Tailscale-Android-App](https://tailscale.com/docs/install/android); für geeignete Fire-OS-Geräte die [offizielle Universal-APK](https://tailscale.com/docs/install/amazon-fire) mit manuellen Updates. Installation, VPN-Anmeldung und Tests nach Neustart/Ruhezustand erfolgen separat. Diese Setup-Skripte installieren oder konfigurieren weder Tailscale noch Nabu Casa. Die Fernzugriffsvarianten wurden hier nicht am Gerät getestet.

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
