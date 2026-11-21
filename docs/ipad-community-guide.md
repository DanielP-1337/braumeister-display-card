# iPad als Braumeister-Dashboard: Orientierung für die Community

**Recherche-Stand: 21.11.2026. Keine iPad-Hardwaretests in diesem Projekt.**
Dem Maintainer stehen keine Apple-Geräte zur Verfügung. Diese Übersicht sammelt
dokumentierte Möglichkeiten und offene Testfragen; sie ist keine bestätigte
iPad-Einrichtungsanleitung. Erfahrungsberichte und Pull Requests sind willkommen.
Die [Android-Anleitung](../tools/android-tablet-setup/README.md) enthält dagegen
die tatsächlich durchgeführten Tests mit Fire HD 10 und Galaxy Tab A9+.

## Zuerst das genaue Modell prüfen

Mit „iPad 1 / 2“ sind hier das ursprüngliche iPad von 2010 und das iPad 2 von
2011 gemeint, nicht iPad Air oder iPad Pro der ersten bzw. zweiten Generation.
Entscheidend sind das genaue Modell und seine maximal installierbare OS-Version.

| Gerät | Betriebssystem-Grenze | Aktuelles HA-Dashboard mit dieser Karte |
|---|---|---|
| iPad, 1. Generation (2010) | iOS 5.1.1 | Unterhalb der heutigen Browser-Anforderungen; kein unterstützter direkter Betrieb |
| iPad 2 (2011) | iOS 9.3.5, bei bestimmten Mobilfunkvarianten 9.3.6 | Unterhalb der heutigen Browser-Anforderungen; kein unterstützter direkter Betrieb |
| iPad Air 1 / iPad mini 2 und 3 | iOS 12.x | Ebenfalls unterhalb der aktuellen HA-Anforderungen |
| Neueres iPad | Modell und installierbare iPadOS-Version einzeln prüfen | Kandidat für einen Community-Test, keine automatische Kompatibilitätszusage |

Apple dokumentiert die alten Versionsgrenzen über die
[iOS-5-Updates](https://support.apple.com/en-lk/102998), die
[iOS-6-Unterstützung ab iPad 2](https://support.apple.com/en-om/103599), die
[iOS-10-Unterstützung ab iPad 4](https://support.apple.com/en-tj/103677) und das
[iOS-9.3.6-Update für Mobilfunkmodelle](https://support.apple.com/en-by/103179).

Für die Auswahl müssen mehrere Voraussetzungen getrennt betrachtet werden:

| Bestandteil | Dokumentierte Mindestversion zum Recherche-Stand |
|---|---|
| HA-Frontend ab HA 2026.11 | Safari / iOS / iPadOS 15.4; siehe [HA-Releasehinweise](https://www.home-assistant.io/blog/2026/11/04/release-202611) |
| Aktuelle HA-Companion-App nach 2026.7.1 | iOS / iPadOS 16.4; siehe [HA-Plattformunterstützung](https://www.home-assistant.io/blog/2026/07/07/companion-app-changing-support-for-apple-platforms/) |
| Kiosker | iPadOS 15.6 laut [App Store](https://apps.apple.com/no/app/kiosker-fullscreen-web-kiosk/id1481691530?platform=ipad) |
| HomeView | iPadOS 16 laut [App Store](https://apps.apple.com/de/app/homeview-smarthome-dashboard/id6785599711) |
| Tailscale direkt auf dem iPad | iOS / iPadOS 16 laut [Tailscale](https://tailscale.com/docs/install/ios) |

Diese Mindestwerte sind keine Kaufempfehlung und keine Zusage für die Custom Card.
Vor einer Anschaffung die aktuellen Angaben erneut prüfen. Ein iPad mit iPadOS 15
kann beispielsweise die Browser-Untergrenze erfüllen, aber nicht die aktuelle
Companion-App oder Tailscale installieren. Ein anderer Kiosk-Browser behebt die
alte WebKit-Version nicht automatisch; Kiosker verwendet ebenfalls WebKit.
Die hier besprochenen Apps sind deshalb kein direkter Wiederverwendungsweg für
das ursprüngliche iPad oder das iPad 2.

## Oberflächen und Gerätefunktionen vergleichen

| Lösung | Bestehende Braumeister-Display-Card | Helligkeit / Ruhezustand | Einordnung |
|---|---|---|---|
| Android / Fire OS mit Fully | Im Projekt getestet | HA-Steuerung und 80 % → ca. 10 % → Aufhellen getestet | Referenz; die vorhandenen Setup-Skripte gelten für Android |
| HA-Companion-App auf iPad | Lädt das vorhandene HA-Dashboard; hier ungetestet | Dokumentierte Kiosk-Befehle für Displayhelligkeit und Bildschirmschoner | Erster Testkandidat für ein ausreichend neues iPad |
| Kiosker auf iPad | Öffnet die Dashboard-URL; hier ungetestet | HA-Integration ohne direkte Displayhelligkeit; JavaScript-Schnittstelle bietet Helligkeitssteuerung | Anpassung und Test der bisherigen Automationen erforderlich |
| HomeView | Eigene Widgets; Unterstützung für vorhandene Lovelace-Dashboards / Custom Cards nicht dokumentiert | Ambient-Modus mit Inaktivität und Rückkehr per Antippen; zustandsabhängige HA-Helligkeitssteuerung nicht belegt | Separate Bedienoberfläche für ausgewählte HA-/HomeKit-Geräte |
| Apple Home über HA HomeKit Bridge | Übernimmt unterstützte Entitäten, nicht die Custom Card | Keine Übernahme unserer Fully-Automationen | Alternative Bedienung einzelner Geräte für vorhandene Apple-Umgebungen |

Die [HA-Companion-Dokumentation](https://companion.home-assistant.io/docs/integrations/ios-kiosk-mode/)
beschreibt unter anderem `kiosk_set_brightness` (0–100),
`kiosk_show_screensaver` und `kiosk_hide_screensaver`. Die App muss für diese
Fernbefehle im Vordergrund laufen. Unsere Braumeister-Zustandslogik könnte
weiterverwendet werden, aber die Fully-Aktionen müssen ersetzt und die Rückkehr
zur Bedienhelligkeit getestet werden. Die Verfügbarkeit der Befehle in einer
alten, noch installierbaren Companion-Version ist damit nicht zugesagt.

Bei der [Kiosker-Integration](https://www.home-assistant.io/integrations/kiosker/)
sind ein Blackout-Overlay und Bildschirmschonerfunktionen dokumentiert, jedoch
keine direkte Steuerung von Displayhelligkeit oder Geräteschlaf. Ein schwarzes
Bild ist kein Nachweis für reduzierte Hintergrundbeleuchtung oder ein physisch
ausgeschaltetes Display. Die [Kiosker-JavaScript-Schnittstelle](https://docs.kiosker.io/)
nennt Helligkeitssteuerung; eine Verbindung zu unseren HA-Zuständen ist hier
noch nicht implementiert oder getestet.

[HomeView](https://apps.apple.com/de/app/homeview-smarthome-dashboard/id6785599711)
kann HA-Schalter, Temperatursensoren und Skripte in seiner eigenen Oberfläche
nutzen. Ob damit alle gewünschten Braumeister-Funktionen sinnvoll abbildbar sind,
müsste separat geprüft werden. Sein dokumentierter „Kioskmodus“ sperrt die
Bearbeitung des Dashboards; daraus folgt kein App-Autostart nach einem Neustart.

Die [HomeKit Bridge](https://www.home-assistant.io/integrations/homekit/)
stellt unterstützte HA-Entitäten für Apple Home und Siri bereit. Das überträgt
weder das Braumeister-Layout noch dessen Prozessanzeige. HomeKit, HomeView und
ein im Browser geöffnetes HA-Dashboard sind deshalb getrennte Optionen.

## Tailscale und vollständiger Neustart

Auf einem kompatiblen iPad kann Tailscale mit demselben Tailnet wie der HA-Server
verwendet werden. [VPN On Demand](https://tailscale.com/docs/features/client/ios-vpn-on-demand)
kann die Verbindung auch nach einem Neustart wiederherstellen; die WLAN-Regel
„Always“ eignet sich als Testkonfiguration für Heim-WLAN und Handy-Hotspot.
Das startet noch keine Dashboard-App. Den Hotspot-Test mit ausgeschaltetem
Handy-WLAN durchführen, damit tatsächlich der Weg über mobile Daten geprüft wird.

Apple dokumentiert einen App-Neustart nach dem Geräteboot für den
[Single App Mode auf betreuten Geräten](https://support.apple.com/en-mide/guide/apple-configurator-mac/cadbf9c172/mac).
Dafür ist zusätzliche Geräteverwaltung, etwa über Apple Configurator auf einem
Mac, erforderlich. Geführter Zugriff, Vollbild und ein appinterner Kioskmodus
sind für sich kein Nachweis dieses Startverhaltens. VPN, eventuell nötiges erstes
Entsperren und die erhaltene HA-Anmeldung müssen gemeinsam getestet werden.

Die macOS-Version unseres ADB-Skripts richtet ein angeschlossenes **Android-Tablet**
ein; sie ist kein iPad-Installer. Für iPads enthält dieses Repository keine
automatische Provisionierung.

## Experimenteller Weg für sehr alte Geräte

Ein separater Ansatz ist ein auf dem Server laufender moderner Browser, dessen
Bild über VNC an das Tablet übertragen wird, beispielsweise mit
[HA VNC Web Browser](https://github.com/MindFreeze/ha-vnc-web-browser).
Das Projekt bietet Webbrowser über VNC an; die Verfügbarkeit eines geeigneten
Clients für iOS 5/9 ist damit nicht belegt. Touch-Bedienung, Verbindungsschutz,
Serverlast, Wiederverbindung und Fernzugriff wären separat zu untersuchen.
Dies ist eine ungetestete Community-Idee, keine bestätigte Lösung für iPad 1/2
und keine Fortsetzung unseres Android-Setups.

## Was ein Community-Testbericht enthalten sollte

- Genaues iPad-Modell, iPadOS-Version, App und App-Version sowie HA- und Card-Version.
- Darstellung und Bedienung unserer vorhandenen Karte in Hoch- und Querformat,
  möglichst mit anonymisierten Screenshots.
- Vollständiger Neustart: VPN-Verbindung, App-Start, eventuell notwendige
  Entsperrung und Dashboard ohne erneute Anmeldung; manuelle Schritte benennen.
- Helligkeit bei Braumeister-Aktivität, bestätigter Ruhe und nach Antippen;
  echte Displayhelligkeit, schwarzes Overlay und ausgeschaltetes Display unterscheiden.
- Getrennte Ergebnisse für Heim-WLAN und Handy-Hotspot sowie offene Probleme.

Berichte können als [Issue](https://github.com/DanielP-1337/braumeister-display-card/issues)
oder Pull Request ergänzt werden. Erst ein konkreter Testbericht begründet eine
Kennzeichnung als „getestet“ für die jeweilige Kombination aus Gerät und Versionen.
