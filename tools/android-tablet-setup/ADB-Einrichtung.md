# ADB fuer Android-Tablets unter Windows, Linux und macOS

Fuer Linux und macOS gibt es ausserdem `Setup-Android-ADB.sh`; siehe Abschnitt am Ende.

Das Skript `Setup-Android-ADB.ps1` funktioniert mit Windows PowerShell 5.1 und PowerShell 7. Es verwendet vorhandene Platform Tools im Projekt oder laedt sie bei fehlender Installation direkt von Google herunter. Android Studio ist nicht erforderlich.

## Starten

PowerShell im Projektordner oeffnen und ausfuehren:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Setup-Android-ADB.ps1
```

`Bypass` gilt nur fuer diesen Prozess; die dauerhafte Ausfuehrungsrichtlinie bleibt unveraendert. Keine Administratorrechte erforderlich, ausser gegebenenfalls beim separat installierten USB-Treiber.

Bei Samsung und anderen Android-Tablets unter **Tablet-Info / Ueber das Tablet > Softwareinformationen** die **Buildnummer siebenmal** antippen. Bei Amazon Fire unter **Einstellungen > Geraeteoptionen > Ueber das Fire-Tablet** die **Seriennummer siebenmal** antippen. Anschliessend in den **Entwickleroptionen USB-Debugging / ADB** aktivieren. Die Bezeichnungen koennen je nach Fire OS abweichen. Ein USB-Datenkabel anschliessen, das Tablet entsperren und den RSA-Freigabedialog fuer den eigenen Computer bestaetigen.

Das Skript wartet standardmaessig bis zu 90 Sekunden auf eine freigegebene Verbindung. Bei Erfolg zeigt es Hersteller, Modell, Seriennummer, Fire-OS-Version, Android-Version, API-Level und Build-ID. Die Kennungen KFTUWI (Amazon) und SM-X210 (Samsung) werden als Amazon Fire HD 10 (2023, 13. Generation) bzw. Samsung Galaxy Tab A9+ (Wi-Fi) angezeigt; bei anderen Kennungen bleiben Hersteller und gemeldete Modellkennung sichtbar. Andere Hersteller loesen keine Warnung aus. Fire OS wird nur bei Amazon-Geraeten oder ausdruecklich gemeldeter Fire-OS-Version angezeigt. Die Version stammt aus `ro.build.version.name`; fehlt sie bei Amazon, wird dies angezeigt. Die Wartezeit betrifft die Geraeteerkennung; Download und einzelne ADB-Aufrufe haben eigene Laufzeiten.

Nach erfolgreichem Auslesen speichert das Skript diese Angaben zusammen mit Hersteller, Seriennummer und UTC-Zeitpunkt in `Android-Geraeteinformationen.txt` neben dem Skript im Projektordner (UTF-8). Bei jedem erfolgreichen Lauf wird die Datei durch die aktuellen Angaben ersetzt. Mit `-InstallOnly` oder bei fehlgeschlagener Geraeteabfrage bleibt eine vorhandene Datei unveraendert. Ein Schreibfehler wird als Fehler mit Exitcode `1` gemeldet.

## Optionen

```powershell
# Nur Platform Tools bereitstellen, ohne ADB-Server oder Geraetezugriff:
.\Setup-Android-ADB.ps1 -InstallOnly

# Bei mehreren verbundenen Geraeten explizit auswaehlen:
.\tools\platform-tools\adb.exe devices -l
.\Setup-Android-ADB.ps1 -Serial 'DEINE-SERIENNUMMER' -TimeoutSeconds 120

# Anderen Installationsordner verwenden:
.\Setup-Android-ADB.ps1 -ToolsDirectory 'C:\ADB'
```

Vorhandene Tools werden nicht automatisch aktualisiert. Der Download bleibt als ZIP in einem eindeutig benannten Unterordner von `tools` erhalten. Ohne -SetupFully, -FullyLayout und -BatteryProtection80 setzt das Skript keinen dauerhaften PATH, installiert keine Apps und aendert keine Tablet-Einstellungen. Es aktiviert auch kein Netzwerk-ADB. Bei der Verbindungspruefung startet ADB seinen lokalen Server und kann im Windows-Benutzerprofil seine ueblichen Schluesseldateien anlegen. Die optionale Fully-Einrichtung ist unten beschrieben; die Home-Assistant-Serverkonfiguration bleibt unveraendert.

## Fehlerbehebung

- **Kein Geraet:** Datenkabel und anderen USB-Port versuchen, USB-Debugging pruefen, gegebenenfalls Dateiuebertragung/MTP aktivieren. Im Windows-Geraetemanager den Treiberstatus pruefen; den passenden USB-Treiber des Herstellers installieren (https://developer.android.com/studio/run/oem-usb).
- **unauthorized:** Freigabe auf dem entsperrten Tablet bestaetigen. Falls kein Dialog erscheint, USB-Debugging-Autorisierungen in den Entwickleroptionen widerrufen und neu verbinden. Dabei muessen auch bisher autorisierte Computer erneut freigegeben werden.
- **offline:** Kabel neu verbinden und das Skript wiederholen.
- **Mehrere Geraete:** Mit `-Serial` gezielt auswaehlen. Das Skript waehlt nicht automatisch eines aus.
- **Download fehlgeschlagen:** Internetverbindung/Proxy pruefen. Alternativ die offiziellen Platform Tools manuell herunterladen und so entpacken, dass `tools\platform-tools\adb.exe` vorhanden ist.

Exitcode `0` bedeutet erfolgreiche Bereitstellung bzw. Verbindung, `1` einen Fehler. Die Modellanzeige dient zur Kontrolle; eine bestimmte Fire-HD-10-Generation wird nicht vorausgesetzt.

## Offizielle Quellen

- [Amazon: Fire-Tablet per ADB verbinden, einschliesslich Windows-Treiber](https://developer.amazon.com/docs/fire-tablets/connecting-adb-to-device)
- [Google: Android SDK Platform Tools und Download](https://developer.android.com/tools/releases/platform-tools)
- [Google: Android Debug Bridge](https://developer.android.com/tools/adb)

## Linux und Apple macOS

Die Bash-Version benoetigt Bash ab 3.2 (auch die mit macOS ausgelieferte Version). Im Projektordner starten:

```bash
bash ./Setup-Android-ADB.sh
```

Sie bietet dieselbe Geraeteabfrage und schreibt `Android-Geraeteinformationen.txt` mit UTC-Zeitpunkt neben das Skript. Der aktuelle Bericht ersetzt den vorherigen erst nach erfolgreichem Auslesen und Schreiben. `--install-only` oder eine fehlgeschlagene Geraeteabfrage lassen den bestehenden Bericht unveraendert.

```bash
# Nur ADB bereitstellen:
bash ./Setup-Android-ADB.sh --install-only

# Ein bestimmtes Tablet auswaehlen:
bash ./Setup-Android-ADB.sh --serial SERIENNUMMER --timeout 120

# Bereits installiertes ADB nutzen (z.B. aus dem Paketmanager):
bash ./Setup-Android-ADB.sh --adb "$(command -v adb)"

# Alternativer Installationsordner:
bash ./Setup-Android-ADB.sh --tools-directory "$HOME/AndroidTools"
```

Ohne `--adb` nutzt das Skript `tools/linux/platform-tools/adb` bzw. `tools/darwin/platform-tools/adb`. Fehlende Tools werden mit `curl` und `unzip` von Google heruntergeladen; beide Programme muessen installiert sein. Vorhandene Tools werden nicht aktualisiert. Archive bleiben im jeweiligen Download-Unterordner erhalten. Die getrennten Ordner verhindern Konflikte mit den Windows-Tools. `--adb` erwartet den Pfad zu einer ausfuehrbaren Datei und hat Vorrang vor `--tools-directory`.

Der automatische Linux-Download ist auf x86_64 beschraenkt. Unter ARM-Linux stattdessen eine native ADB-Version der Distribution installieren und `--adb` verwenden. Auf macOS verwendet das Skript Googles Mac-Paket. Kann ADB auf der jeweiligen Architektur oder Betriebssystemversion nicht starten, bricht das Skript mit einer Fehlermeldung ab.

Unter macOS sind laut Google keine zusaetzlichen USB-Treiber erforderlich. Unter Linux koennen passende udev-Regeln und Gruppenrechte erforderlich sein. Fuer Ubuntu nennt Google die Gruppe `plugdev` und das Paket `android-sdk-platform-tools-common`; nach einer Gruppenaenderung ist erneutes Anmelden erforderlich. Das Skript nimmt keine System- oder Gruppenanpassungen vor und sollte als normaler Benutzer gestartet werden. Details: [Google: Geraet fuer Entwicklung einrichten](https://developer.android.com/studio/run/device).

Ohne --setup-fully, --fully-layout und --battery-protection-80 aendert die Bash-Version wie die Windows-Version keine Tablet-Einstellungen und installiert keine Apps. Netzwerk-ADB wird nicht aktiviert. ADB startet seinen lokalen Server und kann Schluessel im Benutzerprofil anlegen. Exitcode `0` bedeutet Erfolg, ein anderer Exitcode einen Fehler. Die Wartezeit `--timeout` gilt fuer die Geraeteerkennung, nicht fuer einzelne ADB-Aufrufe.

## Optionale Fully-Kiosk-Einrichtung

Die Hauptskripte starten mit `-SetupFully` (Windows) bzw. `--setup-fully` (Linux/macOS) die Helfer in `scripts/`. Dazu ist eine explizite Darstellung erforderlich: `-FullyLayout compact|fullscreen` bzw. `--fully-layout compact|fullscreen`. Den gesamten Projektordner inklusive `fully-ha-settings.json` verwenden. Ohne Setup-, Layout- und Akkuschutz-Option erfolgt weiterhin nur die ADB-Geraetepruefung.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Setup-Android-ADB.ps1 -Serial 'SERIENNUMMER' -SetupFully -FullyLayout compact
```

```bash
bash ./Setup-Android-ADB.sh --serial 'SERIENNUMMER' --setup-fully --fully-layout compact
```

Die aktuelle regulaere APK wird ueber die offizielle Fully-Downloadseite ermittelt und heruntergeladen. Eine lokale offizielle APK kann stattdessen mit `-FullyApkPath` bzw. `--fully-apk` angegeben werden. Bei inkompatibler Signatur, falscher Edition oder einem verhinderten Downgrade wird abgebrochen, nicht automatisch deinstalliert. `adb install -r` erhaelt die App-Daten; die im Profil enthaltenen Einstellungen werden anschliessend gezielt ueberschrieben.

Das gemeinsame Profil legt die Startseite `http://192.168.2.56:8123/firehd-braumeister/braumeister_tablet`, Vollbild, ausgeblendete Aktionsleiste, Hochformat, Keep Screen On, Launch on Boot und Neuladen nach WLAN-Verbindung fest. Die JavaScript-Anpassung gilt ausschliesslich fuer diesen HA-Host und Dashboard-Pfad. Bei Aenderung der URL auch den Host-/Pfadfilter im JavaScript anpassen. Das Profil enthaelt keine Zugangsdaten, PINs oder Lizenzschluessel.

Fuer den Dateiimport wird Fully unter Android 11+ der Zugriff auf alle Dateien erlaubt, bei aelteren Android-Versionen die Lese-/Schreibberechtigung. Kamera, Mikrofon, Bedienungshilfen und Geraeteadministrator werden nicht freigegeben. Fully wird gestoppt und neu gestartet; eine bestehende Bedienungshilfen-Freigabe kann insbesondere auf Fire OS danach erneut zu aktivieren sein.

Vorhandene Dateien `/sdcard/fully-once-settings.json` oder `/sdcard/fully-auto-settings.json` fuehren zum Abbruch, damit fremde Konfigurationen nicht ueberschrieben werden. Der Helfer wartet bis zu 60 Sekunden darauf, dass Fully die bereitgestellte Einmal-Importdatei verarbeitet und entfernt. Bleibt sie liegen, ist das Setup unvollstaendig: Speicherzugriff und **Other Settings > Enable Settings Auto-Import** pruefen und Fully erneut starten; alternativ die Datei in Fully manuell importieren. Die Datei vor einem erneuten Skriptlauf erst nach Pruefung entfernen oder sichern.

Ein erfolgreicher Import bestaetigt noch keine HA-Anmeldung oder Darstellung aller Dashboard-Elemente. Einmal direkt am Tablet anmelden und **Keep me logged in** aktivieren. Gegebenenfalls den Fully-Versionshinweis schliessen. Eine eigene PLUS-Lizenz ist fuer PLUS-Funktionen erforderlich. Der Kiosk-Sperrmodus und die HA-Integration zur Fernsteuerung sind nicht Teil dieses Profils. Der Autostart nach einem kompletten Tablet-Neustart muss separat auf dem jeweiligen Geraet getestet werden.

Geprueft: Samsung SM-X210 mit Android 16, Update von Fully 1.56.1 auf 1.61.4, automatischer Import und Laden der HA-Anmeldeseite. Nach App-Neustart wurde die gueltige PLUS-Lizenz auf dem Tablet bestaetigt. Bash-Syntax und simulierte Installation, Import, Dateikonflikt, Signaturfehler sowie verweigerter Speicherzugriff wurden getestet; kein physischer Linux-/macOS-Test.

Quellen: https://www.fully-kiosk.com/docs/en/getting-started/downloads und https://www.fully-kiosk.com/docs/en/management/deployment

Nach manueller HA-Anmeldung ebenfalls am Samsung geprueft: Braumeister-Dashboard im Hochformat, ohne HA-Kopfzeile/Seitenleiste und ohne Lizenzhinweis. Nach erneutem Fully-App-Neustart blieben die Anmeldung und die automatische Dashboard-Anzeige erhalten. Screenshot: fully-samsung-dashboard.png. Die Bedienung der Brauanlage wurde nicht getestet; zum vollstaendigen Tablet-Neustart siehe folgenden Nachtrag.


Neustarttest am 2026-11-21: Das Samsung SM-X210 wurde per ADB vollstaendig neu gestartet. Fully wurde danach nicht manuell gestartet. Der Benutzer bestaetigte anschliessend Fully mit geladenem HA-Dashboard. Damit sind Autostart und erhaltene HA-Anmeldung durch Benutzerbeobachtung bestaetigt. Eine zusaetzliche ADB-Bildschirmpruefung war nicht moeglich: Das Geraet meldete nach dem Neustart weiterhin unauthorized. Ob Fully bereits vor einer ersten Entsperrung erscheint, wurde nicht separat festgestellt.

Nachtrag: ADB-Freigabe anschliessend wiederhergestellt. sys.boot_completed=1 und Fully-Prozess bereits vor erneutem Oeffnen vorhanden. Nach Verlassen der Entwickleroptionen war der Samsung-Launcher sichtbar; Fully wurde zur Sichtkontrolle in den Vordergrund geholt (LaunchState WARM). Screenshot fully-samsung-reboot-check.png bestaetigt das Braumeister-Dashboard ohne erneute HA-Anmeldung und ohne Lizenzhinweis. Der automatische Vordergrundstart unmittelbar nach dem Boot bleibt durch die vorherige Benutzerbeobachtung belegt.

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

## Korrektur des Samsung-Kioskstarts (21.11.2026)

Bei der Nachpruefung waren sowohl Fully Kiosk Browser als auch Fully Single App Kiosk installiert. Single App Kiosk wurde fuer Benutzer 0 reversibel deaktiviert (keine Deinstallation). Der Browser hatte noch keinen aktiven Kiosk-Modus; Standard-Home war One UI. Die fruehere Benutzerbeobachtung zum Autostart ist daher keine Bestaetigung einer dauerhaften Kiosk-/Home-Konfiguration.

Am Tablet wurden Kiosk-Modus, Nutzungsdatenzugriff und zeitgebundene Aktionen aktiviert und Fully Kiosk Browser als Standard-Home gesetzt. Der Benutzer legt die Ausstiegs-PIN selbst fest; sie wird hier nicht dokumentiert. Power- und Lautstaerketasten bleiben nutzbar. Home-Aufloesung bestaetigt `de.ozerov.fully/.LauncherReplacement`. Home-Taste sowie Display-Schlafen/Aufwecken per ADB wurden getestet: danach erscheint das angemeldete Braumeister-Dashboard im Vollbild. Screenshot lokal: fully-samsung-kiosk-wake.png. Bedienungshilfen wurden nicht aktiviert; kein vollstaendiger Test gegen Umgehen der Kiosksperre.

Die Setup-Skripte konfigurieren weiterhin nur das Dashboard-Profil; Kiosk-Aktivierung, eigene PIN und Auswahl als Standard-Home bleiben zusaetzliche Einrichtungsschritte am Tablet. Die separate Single-App-Kiosk-App wird durch die Skripte nicht automatisch deaktiviert. Fuer ein Wandtablet diese Schritte nach dem Profilimport durchfuehren. Bei Bedarf Single App Kiosk wieder mit `adb -s SERIENNUMMER shell pm enable com.fullykiosk.singleapp` aktivieren. Zum Ruecksetzen der Startoberflaeche Kiosk-Modus in Fully deaktivieren und One UI als Standard-Home waehlen.

Zwei vollstaendige Neustarts anschliessend per ADB geprueft, jeweils mit geaenderter Boot-ID und automatisch gestarteter LauncherReplacement-Aktivitaet. Im ersten Durchlauf blieb Home Assistant mehrere Minuten auf Loading; erst nach einem Ausstiegs-/PIN-Dialog war das Dashboard sichtbar. Dieser Durchlauf gilt nicht als unbeaufsichtigt erfolgreich, seine Ursache ist offen. Im zweiten Durchlauf erschien das angemeldete Dashboard ohne App-Start, Eingabe oder Menuebedienung durch den Tester im Vollbild. Screenshot lokal: fully-samsung-boot-repeat.png. USB-Freigabe und Akkuschutz Maximum/80 % blieben erhalten.

## Bildschirmfuellende Dashboard-Darstellung (21.11.2026)

Auf dem A9+ waren weisse Ecken und ein unterer Streifen sichtbar. Die Karte hatte abgerundete Aussenkanten und eine inhaltsabhaengige Hoehe; dahinter lag der helle HA-Hintergrund. Auf dem Fire HD zeigte der Vergleichsscreenshot ebenfalls freie Flaeche, jedoch dunkel. ADB meldete fuer Fire HD `Night mode: yes`, fuer Samsung `Night mode: no`. Damit sind unterschiedliche Systemmodi bestaetigt; die HA-Theme-Auswahl selbst wurde nicht ausgelesen. HA kann der Systemeinstellung folgen oder ein eigenes Theme verwenden: [HA-Frontend-Dokumentation](https://www.home-assistant.io/integrations/frontend/#dark-mode-support).

Die gemeinsame `injectJsCode`-Anpassung in `fully-ha-settings.json` setzt fuer den konfigurierten Host/Pfad einen dunklen Aussenhintergrund. Im Modus `fullscreen` entfernt sie den aeusseren Kartenradius und gibt der Karte mindestens die aktuelle Viewport-Hoehe (`100dvh`, mit `100vh` als Rueckfall). Im Modus `compact` bleiben die urspruengliche Inhaltshoehe und Rundung erhalten. Laengere Seiten bleiben scrollbar. Die Kartenanpassung wird nach einem HA-Neurendern wiederhergestellt. Beim Wechsel auf andere HA-Pfade werden die eingesetzten Stile beim naechsten Intervall entfernt. Es werden weder System-Darkmode noch HA-Benutzer-Theme umgestellt.

Auf dem Samsung wurde nur `injectJsCode` per Einmalimport aktualisiert. Screenshot nach App-Neustart: fully-samsung-edge-to-edge.png, Dashboard ohne weisse Aussenraender und ohne erneute HA-Anmeldung. Beide Setup-Versionen verwenden dieses gemeinsame Profil. Das Fire HD wurde fuer den Vergleich nur ausgelesen; die neue Layout-Version wurde dort nicht importiert.

Ein weiterer vollstaendiger Samsung-Neustart nach dem Layout-Import wurde ohne manuelles Oeffnen von Fully geprueft: geaenderte Boot-ID, `sys.boot_completed=1`, LauncherReplacement im Vordergrund und angemeldetes Dashboard mit neuem Layout. Screenshot lokal: fully-samsung-layout-boot.png.

Direkter Hochformat-Vergleich auf Benutzerwunsch: beide Screenshots 1200 x 1920 Pixel. Die Fire-HD-Karte endet bei etwa 1133 Pixeln Hoehe mit dunkler Restflaeche darunter. Die Samsung-Karte fuellt durch die neue Mindesthoehe alle 1920 Pixel; der helle Innenbereich wird hoeher und die untere Navigation rutscht nach unten. Schrift und Tasten bleiben gleich gross. Die Hoehenstreckung stammt aus dieser Layout-Anpassung, nicht aus einer anderen Bildschirmaufloesung. Vergleich lokal: fully-fire-portrait-compare.png und fully-samsung-portrait-compare.png. Beim Vergleich wurden keine weiteren Layout-Aenderungen vorgenommen.

Beide Varianten sind jetzt bewusst waehlbar. Die [README mit Screenshot-Vergleich](README.md#6-darstellung-bewusst-wählen) zeigt die Einrichtung und den spaeteren Wechsel. `-FullyLayout` / `--fully-layout` ohne Setup-Option importiert nur `injectJsCode` und startet Fully neu; APK, Startadresse, Ausrichtung, PIN und Akkuschutz werden dabei nicht gesetzt. Eigener Inject-JavaScript-Code wird ersetzt. Der gewaehlte Modus steht nach erfolgreichem Import im Bericht. Vorhandene Importdateien sowie fehlende App oder ungueltige Auswahl fuehren zum Abbruch. Die Profilvorlage selbst bleibt unveraendert; der ausgewaehlte Wert wird in einer temporaeren Importdatei eingesetzt.

Die neue Optionsverarbeitung und beide Importvarianten wurden unter Windows PowerShell 5.1 sowie mit simuliertem ADB unter Bash geprueft, einschliesslich fehlender App und Fehlerfaellen. Keine erneute Aenderung der Tablet-Darstellungen fuer diese Tests. Hinweise zu Hotspot, Nabu Casa und Tailscale stehen ebenfalls in der README; VPN-Einrichtung ist kein Bestandteil dieses Skripts.
