/* Braumeister Display 0.7.0-beta.39 — native HA telemetry card, no cloud credentials. */
(() => {
  // Entity IDs depend on the installation; configure them in the card YAML.
  const defaults = Object.fromEntries(['temperature', 'target', 'step', 'recipe', 'recipes', 'mode', 'connection', 'connection_warning', 'pump', 'heater', 'progress', 'time', 'alarm', 'plug', 'power', 'behavior'].map(key => [key, '']));
  const menuKeys = {
    101: [['⚙','Einstellungen','open_settings'], ['☛','Manuell','open_manual'],
      ['▶','Braustart','open_recipe_selection'], ['☰','Rezept','open_recipe_list']],
    8101: [['✕','Abbruch','close_settings']],
    4006: [['✕','Abbruch','close_manual'], ['P','Pumpe'], ['H','Heizung'], ['↕','Temperatur','open_temperature_editor']],
    4007: [['✕','Abbruch','cancel_temperature'], ['⌄','Ab','temperature_down'], ['⌃','Hoch','temperature_up'], ['✓','Auswahl','confirm_temperature']],
    6010: [['✕','Abbruch','close_recipe_list']],
    2015: [['✕','Abbruch','cancel_recipe_selection'], ['⌄','Ab','recipe_down'], ['⌃','Hoch','recipe_up'], ['✓','Auswahl','select_recipe']],
    2030: [['✕','Abbruch','cancel_water_prompt'], ['⌄','Ab'], ['⌃','Hoch','start_delay_up'], ['✓','Auswahl','confirm_water_filled']],
    2111: [['✕','Abbruch','cancel_water_prompt'], ['⌄','Ab','start_delay_down'], ['⌃','Hoch','start_delay_up'], ['✓','Auswahl','confirm_start_delay']],
    2120: [['✕','Abbruch','cancel_start_delay'], ['✓','Jetzt starten','start_now']],
    2300: [['✕','Abbruch','request_program_pause']],
    2310: [['✕','Abbruch','request_program_pause']],
    2410: [['✕','Abbruch','request_program_pause']],
    2510: [['✕','Abbruch','request_program_pause'],['✓','Auswahl','acknowledge_mash_temperature']],
    2610: [['✕','Abbruch','request_program_pause'],['✓','Auswahl','open_malt_confirmation']],
    2705: [['✕','Abbruch','request_program_pause'],['⌄','Ab'],['⌃','Hoch'],['✓','Auswahl','confirm_malt_added']],
    2810: [['✕','Abbruch','request_program_pause']],
    2820: [['✕','Abbruch','request_program_pause']],
    2910: [['✕','Abbruch','request_program_pause'], ['✓','Auswahl','acknowledge_rest_end']],
    2930: [['✕','Abbruch','request_program_pause'], ['✓','Auswahl','confirm_malt_pipe_removed']],
    2960: [['✕','Abbruch','request_program_pause'], ['✓','Hopfenkochen starten','start_boil']],
    3080: [['✕','Abbruch','request_program_pause'], ['✓','Auswahl','acknowledge_hop_addition']],
    3510: [['✓','Auswahl','confirm_whirlpool']],
    3610: [['✓','Auswahl','finish_brewing']],
    3450: [['✕','Abbruch','request_program_pause'], ['✓','Auswahl','acknowledge_brew_complete']],
  };
  // Future backend contract. Never dispatch through the legacy menu service.
  const programActions = new Set(['acknowledge_brew_complete', 'acknowledge_hop_addition', 'confirm_whirlpool', 'finish_brewing', 'confirm_lid_removed', 'acknowledge_rest_end', 'confirm_malt_pipe_removed', 'start_boil', 'acknowledge_mash_temperature', 'open_malt_confirmation', 'confirm_malt_added', 'cancel_water_prompt', 'start_delay_down', 'start_delay_up',
    'confirm_water_filled', 'confirm_start_delay', 'start_now', 'cancel_start_delay', 'request_program_pause', 'abort_program', 'resume_program']);
  const energizingActions = new Set(['start_boil', 'confirm_malt_added', 'confirm_water_filled', 'confirm_start_delay', 'start_now', 'resume_program']);
  const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Vector geometry is independent of Android and desktop font metrics.
  const iconPaths = {
    '✕': '<path d="m6 6 20 20M26 6 6 26"/>',
    '⌄': '<path d="m6 11 10 10 10-10"/>',
    '⌃': '<path d="m6 21 10-10 10 10"/>',
    '✓': '<path d="m5 17 7 8L27 6"/>',
    '▣': '<rect x="6" y="5" width="20" height="19"/><path d="M3 28h26"/>',
    '☷': '<path d="M5 7h6m5 0h11M5 16h6m5 0h11M5 25h6m5 0h11"/>',
    '⏻': '<path d="M16 3v13M9 7a12 12 0 1 0 14 0"/>',
    'ⓘ': '<circle cx="16" cy="16" r="13"/><path d="M16 14v10m0-17v2"/>',
  };
  const controlIcon = value => iconPaths[value]
    ? `<svg class="control-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter">${iconPaths[value]}</svg>`
    : esc(value);

  // Only presentation is localized. Backend values, attributes and commands stay intact.
  const menuTitles = {101: 'Hauptmenü', 8101: 'Einstellungen', 4006: 'Manueller Betrieb',
    6010: 'Rezepte bearbeiten', 2015: 'Rezept auswählen'};
  const ENGLISH = {
    "Bei Frostwarnung Tasten in Eisoptik anzeigen": "Use icy button colors during a frost warning",
    "Frostschutz": "Frost warning",
    "Bei Startvorwahl vor Frost warnen": "Warn about frost during a delayed start",
    "Warntemperatur des Wassers": "Water warning temperature",
    "Warntimer der HA-Automation (optional)": "HA automation warning timer (optional)",
    "Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.": "Frost risk during the start delay. Check the Braumeister and pump.",
  "Hopfenkochen starten? Pumpe und Heizung können anlaufen.": "Start boiling? The pump and heater may start.",
  "Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.": "No device recipe data available. Map the recipe-list entity in the card configuration.",
  "Geräterezept ansehen": "View device recipe",
  "Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.": "The current recipe could not be matched uniquely. Select a device recipe.",
  "Hopfengaben · Minuten vor Kochende": "Hop additions · minutes before boil ends",
  "Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.": "Stored device schedule. Changes during brewing may differ. Selecting a recipe here does not control the device.",
  "Jetzt starten": "Start now",
  "Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.": "Skip the countdown and start now? Is water filled? The pump starts immediately; heating may follow.",
  "Braustart in": "Brew starts in",
  "Vom Gerät gemeldete Restzeit": "Remaining time reported by the device",
  "Startzeitvorwahl: Hoch +30 min, Ab −30 min.": "Start delay: Up +30 min, Down −30 min.",
  "Malzrohr entnommen": "Malt pipe removed",
  "Hopfenkochen starten": "Start boil",
  "Hopfen zugegeben": "Hops added",
  "Whirlpool bestätigen": "Confirm whirlpool",
  "Bitte am Braumeister bestätigen.": "Confirm on the Braumeister.",
  "Auswahl": "Select",
  "Fortsetzen": "Resume",
  "Brauvorgang endgültig abbrechen?": "Abort the brewing program permanently?",
  "Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.": "Water added? Confirming may start the pump and heater.",
  "Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.": "Resume the brewing program? The pump and heater may restart.",
  "Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.": "This button requires a supported and enabled Bridge/Companion action.",
  "Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.": "Select to resume; Cancel to abort permanently.",
  "Startzeitvorwahl noch nicht verifiziert.": "Delayed-start behavior has not yet been verified.",
  "Verbindung zum Braumeister verloren": "Connection to Braumeister lost",
  "Geräteverbindung noch nicht bestätigt": "Device connection not yet verified",
  "Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.": "Brewing or heater permission was last known active. Current device state is unknown. Check the device in person.",
  "Heizung am Braumeister einschalten?": "Turn on the Braumeister heater?",
  "Einstellungen können nur direkt am Braumeister geändert werden.": "Settings can only be changed directly on the Braumeister.",
  "Manuell": "Manual",
  "Braustart": "Brew start",
  "Rezept auswählen": "Select recipe",
  "Ab": "Down",
  "Hoch": "Up",
  "Lokale Menünavigation": "Local menu navigation",
  "Menüaktion läuft …": "Menu action pending…",
  "Menüaktion bestätigt": "Menu action confirmed",
  "Menüaktion abgelaufen": "Menu action expired",
  "Menüaktion unbestätigt": "Menu action unconfirmed",
  "Gerätebildschirm hat gewechselt": "Device screen changed",
  "Zeit": "Time",
  "Soll / Ist": "Target / Actual",
  "Soll / Ist · verstrichen": "Target / Actual · elapsed",
  "Temp": "Temp",
  "Abbruch": "Cancel",
  "Pumpe": "Pump",
  "Heizung": "Heating",
  "Temperatur": "Temperature",
  "Braumeister-Steuerung noch nicht verfügbar": "Braumeister controls are not available yet",
  "Benötigt einen Steuerdienst der Integration": "Requires a control action from the integration",
  "Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar": "Live display · Braumeister controls are not available yet",
  "Zwischenstecker ausgeschaltet": "Smart plug is off",
  "Keine Online-Verbindung": "No online connection",
  "Inaktiv (Zwischenzustand)": "Inactive (intermediate state)",
  "Integrationsmeldung": "Reported by integration",
  "Aktuelles Rezept": "Current recipe",
  "Stromversorgung": "Power supply",
  "Gerätedaten": "Device details",
  "Aktueller Schritt": "Current step",
  "Gemeldeter Fortschritt": "Reported progress",
  "Verbindung": "Connection",
  "Modus": "Mode",
  "Pumpe · gemeldet": "Pump · reported",
  "Heizung · gemeldet": "Heating · reported",
  "Zwischenstecker": "Smart plug",
  "Schaltzustand": "Switch state",
  "Gesamtleistung": "Total power",
  "Einschalten": "Turn on",
  "Ausschalten": "Turn off",
  "Nach Stromausfall": "After power loss",
  "Bitte wählen": "Select an option",
  "Ein": "On",
  "Aus": "Off",
  "Vorheriger Zustand": "Previous state",
  "Zustand umkehren": "Toggle state",
  "Schaltet die gesamte Stromversorgung des Braumeisters.": "Switches the entire Braumeister power supply.",
  "Vom Braumeister gemeldete Uhrzeit": "Time reported by the Braumeister",
  "Alarm vom Braumeister gemeldet": "Alarm reported by the Braumeister",
  "Aktion fehlgeschlagen": "Action failed",
  "Display": "Display",
  "Rezept": "Recipe",
  "Strom": "Power",
  "Status": "Status",
  "Hauptmenü": "Main menu",
  "Rezept auswählen": "Select recipe",
  "Einmaischen": "Mash-in",
  "Wasser eingefüllt?": "Water added?",
  "Pumpe wird entlüftet": "Purging air from pump",
  "Aufheizen": "Heating up",
  "Pumpenabschaltung": "Pump shutdown",
  "Einmaischtemperatur erreicht": "Mash-in temperature reached",
  "Malz einfüllen!": "Add malt!",
  "Malz eingefüllt?": "Malt added?",
  "Rast": "Mash rest",
  "{number}. Rast": "Mash rest {number}",
  "Pumpenpause": "Pump pause",
  "Maischen": "Mashing",
  "Rastende erreicht": "Mash rest complete",
  "Läutern": "Lautering",
  "Malzrohr entnehmen!": "Remove malt pipe!",
  "Hopfen kochen": "Boiling",
  "Start Hopfenkochen?": "Start boiling?",
  "Aufheizen zum Kochen": "Heating to a boil",
  "Hopfen zugeben": "Add hops",
  "Hopfen zugeben – {number}. Hopfengabe": "Add hops – addition {number}",
  "Hopfenzugabe": "Hop addition",
  "Nächste Hopfengabe in {number} Minuten.": "Next hop addition in {number} minutes.",
  "Brauvorgang beendet": "Brewing complete",
  "Jetzt Whirlpool …": "Start whirlpool now …",
  "Prost!": "Cheers!",
  "Manueller Betrieb": "Manual operation",
  "Einstellungen": "Settings",
  "Temperaturfehler": "Temperature error",
  "Bitte Deckel entfernen.": "Please remove the lid.",
  "Automatik angehalten": "Automatic process paused",
  "Status unbekannt": "Unknown status",
  "Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.": "Recipes can only be edited on myspeidel.com or directly on the Braumeister.",
  "Rezepte bearbeiten": "Edit recipes",
  "Statuscode {number}": "Status code {number}",
  "online": "Online",
  "offline": "Offline",
  "automatic": "Automatic",
  "manual": "Manual",
  "waiting": "Waiting",
  "on": "On",
  "off": "Off",
  "previous": "Previous state",
  "toggle": "Toggle state",
  "wartet": "Waiting",
  "P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.": "P/H show the values reported by the integration. Correct XHR states require the parser fix from PR #8."
};
  Object.assign(ENGLISH, {"Darstellung": "Appearance", "Tastenbeleuchtung": "Button lighting", "Standard": "Default", "Licht aus": "Lights off", "Eigene Farbe": "Custom color", "HEX-Farbe": "HEX color", "Rot": "Red", "Orange": "Orange", "Gelb": "Yellow", "Grün": "Green", "Cyan": "Cyan", "Blau": "Blue", "Magenta": "Magenta", "Weiß": "White", "Nur die Tastenringe dieser Karte ändern sich.": "Only the button rings on this card change.", "Bitte #RRGGBB eingeben.": "Enter #RRGGBB."});
  Object.assign(ENGLISH, {"Alarmton": "Alarm sound", "Ton bei Alarm / Pause": "Sound on alarm / pause", "Sound-URL (leer: Signalton)": "Sound URL (blank: built-in tone)", "Lautstärke": "Volume", "Ton testen / freigeben": "Test / enable sound", "Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.": "Once per new alarm, up to 5 seconds. Test sound on this tablet first.", "Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.": "Sound unavailable. Test the sound and check browser permissions."});
  Object.assign(ENGLISH, {"Hinweis vom Braumeister": "Braumeister notification", "Malz eingefüllt? Bestätigung startet Pumpe und Heizung.": "Malt added? Confirming starts the pump and heater."});
  Object.assign(ENGLISH, {"Bis zur Quittierung wiederholen":"Repeat until acknowledged","Ton stummschalten":"Mute sound","Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.":"Repeats every 6 seconds until acknowledged on the device or muted. Test sound on this device first."});
  const BUNDLED_LANGUAGES = {"de":{"Bei Frostwarnung Tasten in Eisoptik anzeigen":"Bei Frostwarnung Tasten in Eisoptik anzeigen","Manuell":"Manuell","Braustart":"Braustart","Rezept auswählen":"Rezept auswählen","Ab":"Ab","Hoch":"Hoch","Lokale Menünavigation":"Lokale Menünavigation","Menüaktion läuft …":"Menüaktion läuft …","Menüaktion bestätigt":"Menüaktion bestätigt","Menüaktion abgelaufen":"Menüaktion abgelaufen","Menüaktion unbestätigt":"Menüaktion unbestätigt","Gerätebildschirm hat gewechselt":"Gerätebildschirm hat gewechselt","Einstellungen können nur direkt am Braumeister geändert werden.":"Einstellungen können nur direkt am Braumeister geändert werden.","Zeit":"Zeit","Soll / Ist":"Soll / Ist","Soll / Ist · verstrichen":"Soll / Ist · verstrichen","Temp":"Temp","Abbruch":"Abbruch","Pumpe":"Pumpe","Heizung":"Heizung","Temperatur":"Temperatur","Braumeister-Steuerung noch nicht verfügbar":"Braumeister-Steuerung noch nicht verfügbar","Benötigt einen Steuerdienst der Integration":"Benötigt einen Steuerdienst der Integration","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar","Zwischenstecker ausgeschaltet":"Zwischenstecker ausgeschaltet","Keine Online-Verbindung":"Keine Online-Verbindung","Inaktiv (Zwischenzustand)":"Inaktiv (Zwischenzustand)","Integrationsmeldung":"Integrationsmeldung","Aktuelles Rezept":"Aktuelles Rezept","Stromversorgung":"Stromversorgung","Gerätedaten":"Gerätedaten","Aktueller Schritt":"Aktueller Schritt","Gemeldeter Fortschritt":"Gemeldeter Fortschritt","Verbindung":"Verbindung","Modus":"Modus","Pumpe · gemeldet":"Pumpe · gemeldet","Heizung · gemeldet":"Heizung · gemeldet","Zwischenstecker":"Zwischenstecker","Schaltzustand":"Schaltzustand","Gesamtleistung":"Gesamtleistung","Einschalten":"Einschalten","Ausschalten":"Ausschalten","Nach Stromausfall":"Nach Stromausfall","Bitte wählen":"Bitte wählen","Ein":"Ein","Aus":"Aus","Vorheriger Zustand":"Vorheriger Zustand","Zustand umkehren":"Zustand umkehren","Schaltet die gesamte Stromversorgung des Braumeisters.":"Schaltet die gesamte Stromversorgung des Braumeisters.","Vom Braumeister gemeldete Uhrzeit":"Vom Braumeister gemeldete Uhrzeit","Alarm vom Braumeister gemeldet":"Alarm vom Braumeister gemeldet","Aktion fehlgeschlagen":"Aktion fehlgeschlagen","Display":"Display","Rezept":"Rezept","Strom":"Strom","Status":"Status","Hauptmenü":"Hauptmenü","Einmaischen":"Einmaischen","Wasser eingefüllt?":"Wasser eingefüllt?","Pumpe wird entlüftet":"Pumpe wird entlüftet","Aufheizen":"Aufheizen","Pumpenabschaltung":"Pumpenabschaltung","Einmaischtemperatur erreicht":"Einmaischtemperatur erreicht","Malz einfüllen!":"Malz einfüllen!","Malz eingefüllt?":"Malz eingefüllt?","Rast":"Rast","{number}. Rast":"{number}. Rast","Pumpenpause":"Pumpenpause","Maischen":"Maischen","Rastende erreicht":"Rastende erreicht","Läutern":"Läutern","Malzrohr entnehmen!":"Malzrohr entnehmen!","Hopfen kochen":"Hopfen kochen","Start Hopfenkochen?":"Start Hopfenkochen?","Aufheizen zum Kochen":"Aufheizen zum Kochen","Hopfen zugeben":"Hopfen zugeben","Hopfen zugeben – {number}. Hopfengabe":"Hopfen zugeben – {number}. Hopfengabe","Hopfenzugabe":"Hopfenzugabe","Nächste Hopfengabe in {number} Minuten.":"Nächste Hopfengabe in {number} Minuten.","Brauvorgang beendet":"Brauvorgang beendet","Jetzt Whirlpool …":"Jetzt Whirlpool …","Prost!":"Prost!","Manueller Betrieb":"Manueller Betrieb","Einstellungen":"Einstellungen","Temperaturfehler":"Temperaturfehler","Bitte Deckel entfernen.":"Bitte Deckel entfernen.","Automatik angehalten":"Automatik angehalten","Status unbekannt":"Status unbekannt","Statuscode {number}":"Statuscode {number}","online":"online","offline":"offline","automatic":"Automatik","manual":"Manuell","waiting":"Wartet","on":"Ein","off":"Aus","previous":"Vorheriger Zustand","toggle":"Zustand umkehren","wartet":"Wartet","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.","Rezepte bearbeiten":"Rezepte bearbeiten","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.","Darstellung":"Darstellung","Tastenbeleuchtung":"Tastenbeleuchtung","Standard":"Standard","Licht aus":"Licht aus","Eigene Farbe":"Eigene Farbe","HEX-Farbe":"HEX-Farbe","Rot":"Rot","Orange":"Orange","Gelb":"Gelb","Grün":"Grün","Cyan":"Cyan","Blau":"Blau","Magenta":"Magenta","Weiß":"Weiß","Nur die Tastenringe dieser Karte ändern sich.":"Nur die Tastenringe dieser Karte ändern sich.","Bitte #RRGGBB eingeben.":"Bitte #RRGGBB eingeben.","Verbindung zum Braumeister verloren":"Verbindung zum Braumeister verloren","Geräteverbindung noch nicht bestätigt":"Geräteverbindung noch nicht bestätigt","Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.":"Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.","Auswahl":"Auswahl","Fortsetzen":"Fortsetzen","Brauvorgang endgültig abbrechen?":"Brauvorgang endgültig abbrechen?","Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.":"Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.","Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.":"Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.","Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.":"Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.","Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.":"Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.","Startzeitvorwahl noch nicht verifiziert.":"Startzeitvorwahl noch nicht verifiziert.","Malzrohr entnommen":"Malzrohr entnommen","Hopfenkochen starten":"Hopfenkochen starten","Hopfen zugegeben":"Hopfen zugegeben","Whirlpool bestätigen":"Whirlpool bestätigen","Bitte am Braumeister bestätigen.":"Bitte am Braumeister bestätigen.","Braustart in":"Braustart in","Vom Gerät gemeldete Restzeit":"Vom Gerät gemeldete Restzeit","Startzeitvorwahl: Hoch +30 min, Ab −30 min.":"Startzeitvorwahl: Hoch +30 min, Ab −30 min.","Jetzt starten":"Jetzt starten","Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.":"Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.","Alarmton":"Alarmton","Ton bei Alarm / Pause":"Ton bei Alarm / Pause","Sound-URL (leer: Signalton)":"Sound-URL (leer: Signalton)","Lautstärke":"Lautstärke","Ton testen / freigeben":"Ton testen / freigeben","Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.":"Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.","Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.":"Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.","Hinweis vom Braumeister":"Hinweis vom Braumeister","Malz eingefüllt? Bestätigung startet Pumpe und Heizung.":"Malz eingefüllt? Bestätigung startet Pumpe und Heizung.","Bis zur Quittierung wiederholen":"Bis zur Quittierung wiederholen","Ton stummschalten":"Ton stummschalten","Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.":"Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.","Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.":"Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.","Geräterezept ansehen":"Geräterezept ansehen","Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.":"Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.","Hopfengaben · Minuten vor Kochende":"Hopfengaben · Minuten vor Kochende","Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.":"Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.","Hopfenkochen starten? Pumpe und Heizung können anlaufen.":"Hopfenkochen starten? Pumpe und Heizung können anlaufen.","Frostschutz":"Frostschutz","Bei Startvorwahl vor Frost warnen":"Bei Startvorwahl vor Frost warnen","Warntemperatur des Wassers":"Warntemperatur des Wassers","Warntimer der HA-Automation (optional)":"Warntimer der HA-Automation (optional)","Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.":"Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen."},"en-US":{"Bei Frostwarnung Tasten in Eisoptik anzeigen":"Use icy button colors during a frost warning","Manuell":"Manual","Braustart":"Brew start","Rezept auswählen":"Select recipe","Ab":"Down","Hoch":"Up","Lokale Menünavigation":"Local menu navigation","Menüaktion läuft …":"Menu action pending…","Menüaktion bestätigt":"Menu action confirmed","Menüaktion abgelaufen":"Menu action expired","Menüaktion unbestätigt":"Menu action unconfirmed","Gerätebildschirm hat gewechselt":"Device screen changed","Einstellungen können nur direkt am Braumeister geändert werden.":"Settings can only be changed directly on the Braumeister.","Zeit":"Time","Soll / Ist":"Target / Actual","Soll / Ist · verstrichen":"Target / Actual · elapsed","Temp":"Temp","Abbruch":"Cancel","Pumpe":"Pump","Heizung":"Heating","Temperatur":"Temperature","Braumeister-Steuerung noch nicht verfügbar":"Braumeister controls are not available yet","Benötigt einen Steuerdienst der Integration":"Requires a control action from the integration","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Live display · Braumeister controls are not available yet","Zwischenstecker ausgeschaltet":"Smart plug is off","Keine Online-Verbindung":"No online connection","Inaktiv (Zwischenzustand)":"Inactive (intermediate state)","Integrationsmeldung":"Reported by integration","Aktuelles Rezept":"Current recipe","Stromversorgung":"Power supply","Gerätedaten":"Device details","Aktueller Schritt":"Current step","Gemeldeter Fortschritt":"Reported progress","Verbindung":"Connection","Modus":"Mode","Pumpe · gemeldet":"Pump · reported","Heizung · gemeldet":"Heating · reported","Zwischenstecker":"Smart plug","Schaltzustand":"Switch state","Gesamtleistung":"Total power","Einschalten":"Turn on","Ausschalten":"Turn off","Nach Stromausfall":"After power loss","Bitte wählen":"Select an option","Ein":"On","Aus":"Off","Vorheriger Zustand":"Previous state","Zustand umkehren":"Toggle state","Schaltet die gesamte Stromversorgung des Braumeisters.":"Switches the entire Braumeister power supply.","Vom Braumeister gemeldete Uhrzeit":"Time reported by the Braumeister","Alarm vom Braumeister gemeldet":"Alarm reported by the Braumeister","Aktion fehlgeschlagen":"Action failed","Display":"Display","Rezept":"Recipe","Strom":"Power","Status":"Status","Hauptmenü":"Main menu","Einmaischen":"Mash-in","Wasser eingefüllt?":"Water added?","Pumpe wird entlüftet":"Purging air from pump","Aufheizen":"Heating up","Pumpenabschaltung":"Pump shutdown","Einmaischtemperatur erreicht":"Mash-in temperature reached","Malz einfüllen!":"Add malt!","Malz eingefüllt?":"Malt added?","Rast":"Mash rest","{number}. Rast":"Mash rest {number}","Pumpenpause":"Pump pause","Maischen":"Mashing","Rastende erreicht":"Mash rest complete","Läutern":"Lautering","Malzrohr entnehmen!":"Remove malt pipe!","Hopfen kochen":"Boiling","Start Hopfenkochen?":"Start boiling?","Aufheizen zum Kochen":"Heating to a boil","Hopfen zugeben":"Add hops","Hopfen zugeben – {number}. Hopfengabe":"Add hops – addition {number}","Hopfenzugabe":"Hop addition","Nächste Hopfengabe in {number} Minuten.":"Next hop addition in {number} minutes.","Brauvorgang beendet":"Brewing complete","Jetzt Whirlpool …":"Start whirlpool now …","Prost!":"Cheers!","Manueller Betrieb":"Manual operation","Einstellungen":"Settings","Temperaturfehler":"Temperature error","Bitte Deckel entfernen.":"Please remove the lid.","Automatik angehalten":"Automatic process paused","Status unbekannt":"Unknown status","Statuscode {number}":"Status code {number}","online":"Online","offline":"Offline","automatic":"Automatic","manual":"Manual","waiting":"Waiting","on":"On","off":"Off","previous":"Previous state","toggle":"Toggle state","wartet":"Waiting","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H show the values reported by the integration. Correct XHR states require the parser fix from PR #8.","Rezepte bearbeiten":"Edit recipes","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Recipes can only be edited on myspeidel.com or directly on the Braumeister.","Darstellung":"Appearance","Tastenbeleuchtung":"Button lighting","Standard":"Default","Licht aus":"Lights off","Eigene Farbe":"Custom color","HEX-Farbe":"HEX color","Rot":"Red","Orange":"Orange","Gelb":"Yellow","Grün":"Green","Cyan":"Cyan","Blau":"Blue","Magenta":"Magenta","Weiß":"White","Nur die Tastenringe dieser Karte ändern sich.":"Only the button rings on this card change.","Bitte #RRGGBB eingeben.":"Enter #RRGGBB.","Verbindung zum Braumeister verloren":"Connection to Braumeister lost","Geräteverbindung noch nicht bestätigt":"Device connection not yet verified","Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.":"Brewing or heater permission was last known active. Current device state is unknown. Check the device in person.","Auswahl":"Select","Fortsetzen":"Resume","Brauvorgang endgültig abbrechen?":"Abort the brewing program permanently?","Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.":"Water added? Confirming may start the pump and heater.","Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.":"Resume the brewing program? The pump and heater may restart.","Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.":"This button requires a supported and enabled Bridge/Companion action.","Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.":"Select to resume; Cancel to abort permanently.","Startzeitvorwahl noch nicht verifiziert.":"Delayed-start behavior has not yet been verified.","Malzrohr entnommen":"Malt pipe removed","Hopfenkochen starten":"Start boil","Hopfen zugegeben":"Hops added","Whirlpool bestätigen":"Confirm whirlpool","Bitte am Braumeister bestätigen.":"Confirm on the Braumeister.","Braustart in":"Brew starts in","Vom Gerät gemeldete Restzeit":"Remaining time reported by the device","Startzeitvorwahl: Hoch +30 min, Ab −30 min.":"Start delay: Up +30 min, Down −30 min.","Jetzt starten":"Start now","Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.":"Skip the countdown and start now? Is water filled? The pump starts immediately; heating may follow.","Alarmton":"Alarm sound","Ton bei Alarm / Pause":"Sound on alarm / pause","Sound-URL (leer: Signalton)":"Sound URL (blank: built-in tone)","Lautstärke":"Volume","Ton testen / freigeben":"Test / enable sound","Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.":"Once per new alarm, up to 5 seconds. Test sound on this tablet first.","Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.":"Sound unavailable. Test the sound and check browser permissions.","Hinweis vom Braumeister":"Braumeister notification","Malz eingefüllt? Bestätigung startet Pumpe und Heizung.":"Malt added? Confirming starts the pump and heater.","Bis zur Quittierung wiederholen":"Repeat until acknowledged","Ton stummschalten":"Mute sound","Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.":"Repeats every 6 seconds until acknowledged on the device or muted. Test sound on this device first.","Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.":"No device recipe data available. Map the recipe-list entity in the card configuration.","Geräterezept ansehen":"View device recipe","Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.":"The current recipe could not be matched uniquely. Select a device recipe.","Hopfengaben · Minuten vor Kochende":"Hop additions · minutes before boil ends","Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.":"Stored device schedule. Changes during brewing may differ. Selecting a recipe here does not control the device.","Hopfenkochen starten? Pumpe und Heizung können anlaufen.":"Start boiling? The pump and heater may start.","Frostschutz":"Frost warning","Bei Startvorwahl vor Frost warnen":"Warn about frost during a delayed start","Warntemperatur des Wassers":"Water warning temperature","Warntimer der HA-Automation (optional)":"HA automation warning timer (optional)","Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.":"Frost risk during the start delay. Check the Braumeister and pump."},"es":{"Bei Frostwarnung Tasten in Eisoptik anzeigen":"Usar botones de hielo durante un aviso de helada","Manuell":"Manual","Braustart":"Iniciar elaboración","Rezept auswählen":"Seleccionar receta","Ab":"Abajo","Hoch":"Arriba","Lokale Menünavigation":"Navegación local por el menú","Menüaktion läuft …":"Acción de menú pendiente…","Menüaktion bestätigt":"Acción de menú confirmada","Menüaktion abgelaufen":"Acción de menú caducada","Menüaktion unbestätigt":"Acción de menú sin confirmar","Gerätebildschirm hat gewechselt":"La pantalla del equipo ha cambiado","Einstellungen können nur direkt am Braumeister geändert werden.":"Los ajustes solo se pueden cambiar directamente en el Braumeister.","Zeit":"Tiempo","Soll / Ist":"Objetivo / Actual","Soll / Ist · verstrichen":"Objetivo / Actual · transcurrido","Temp":"Temp","Abbruch":"Cancelar","Pumpe":"Bomba","Heizung":"Calefacción","Temperatur":"Temperatura","Braumeister-Steuerung noch nicht verfügbar":"Control del Braumeister aún no disponible","Benötigt einen Steuerdienst der Integration":"Requiere una acción de control de la integración","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Vista en directo · Control del Braumeister aún no disponible","Zwischenstecker ausgeschaltet":"Enchufe inteligente apagado","Keine Online-Verbindung":"Sin conexión","Inaktiv (Zwischenzustand)":"Inactivo (estado intermedio)","Integrationsmeldung":"Informado por la integración","Aktuelles Rezept":"Receta actual","Stromversorgung":"Alimentación eléctrica","Gerätedaten":"Datos del dispositivo","Aktueller Schritt":"Paso actual","Gemeldeter Fortschritt":"Progreso informado","Verbindung":"Conexión","Modus":"Modo","Pumpe · gemeldet":"Bomba · informada","Heizung · gemeldet":"Calefacción · informada","Zwischenstecker":"Enchufe inteligente","Schaltzustand":"Estado del interruptor","Gesamtleistung":"Potencia total","Einschalten":"Encender","Ausschalten":"Apagar","Nach Stromausfall":"Tras un corte de energía","Bitte wählen":"Seleccione una opción","Ein":"Encendido","Aus":"Apagado","Vorheriger Zustand":"Estado anterior","Zustand umkehren":"Invertir estado","Schaltet die gesamte Stromversorgung des Braumeisters.":"Controla toda la alimentación del Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Hora informada por el Braumeister","Alarm vom Braumeister gemeldet":"Alarma informada por el Braumeister","Aktion fehlgeschlagen":"Acción fallida","Display":"Pantalla","Rezept":"Receta","Strom":"Alimentación","Status":"Estado","Hauptmenü":"Menú principal","Einmaischen":"Empaste","Wasser eingefüllt?":"¿Agua añadida?","Pumpe wird entlüftet":"Purgando la bomba","Aufheizen":"Calentando","Pumpenabschaltung":"Parada de la bomba","Einmaischtemperatur erreicht":"Temperatura de empaste alcanzada","Malz einfüllen!":"¡Añadir malta!","Malz eingefüllt?":"¿Malta añadida?","Rast":"Descanso de maceración","{number}. Rast":"Descanso {number}","Pumpenpause":"Pausa de la bomba","Maischen":"Maceración","Rastende erreicht":"Descanso completado","Läutern":"Filtrado","Malzrohr entnehmen!":"¡Retirar el tubo de malta!","Hopfen kochen":"Hervido","Start Hopfenkochen?":"¿Iniciar hervido?","Aufheizen zum Kochen":"Calentando hasta hervir","Hopfen zugeben":"Añadir lúpulo","Hopfen zugeben – {number}. Hopfengabe":"Añadir lúpulo – adición {number}","Hopfenzugabe":"Adición de lúpulo","Nächste Hopfengabe in {number} Minuten.":"Próxima adición de lúpulo en {number} minutos.","Brauvorgang beendet":"Elaboración terminada","Jetzt Whirlpool …":"Iniciar whirlpool …","Prost!":"¡Salud!","Manueller Betrieb":"Funcionamiento manual","Einstellungen":"Ajustes","Temperaturfehler":"Error de temperatura","Bitte Deckel entfernen.":"Retire la tapa.","Automatik angehalten":"Proceso automático pausado","Status unbekannt":"Estado desconocido","Statuscode {number}":"Código de estado {number}","online":"En línea","offline":"Sin conexión","automatic":"Automático","manual":"Manual","waiting":"En espera","on":"Encendido","off":"Apagado","previous":"Estado anterior","toggle":"Invertir estado","wartet":"En espera","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H muestran los valores de la integración. Los estados XHR correctos requieren la corrección del analizador de la PR #8.","Rezepte bearbeiten":"Editar recetas","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Las recetas solo se pueden editar en myspeidel.com o directamente en el Braumeister.","Darstellung":"Apariencia","Tastenbeleuchtung":"Iluminación de botones","Standard":"Predeterminado","Licht aus":"Luces apagadas","Eigene Farbe":"Color personalizado","HEX-Farbe":"Color HEX","Rot":"Rojo","Orange":"Naranja","Gelb":"Amarillo","Grün":"Verde","Cyan":"Cian","Blau":"Azul","Magenta":"Magenta","Weiß":"Blanco","Nur die Tastenringe dieser Karte ändern sich.":"Solo cambian los anillos de los botones de esta tarjeta.","Bitte #RRGGBB eingeben.":"Introduce #RRGGBB.","Verbindung zum Braumeister verloren":"Conexión con el Braumeister perdida","Geräteverbindung noch nicht bestätigt":"Conexión del dispositivo aún sin verificar","Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.":"La elaboración o la autorización de calentamiento estaba activa en el último estado conocido. Estado actual desconocido. Compruebe el equipo en persona.","Auswahl":"Seleccionar","Fortsetzen":"Reanudar","Brauvorgang endgültig abbrechen?":"¿Cancelar definitivamente el programa de elaboración?","Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.":"¿Agua añadida? Confirmar puede activar la bomba y el calentador.","Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.":"¿Reanudar la elaboración? La bomba y el calentador pueden volver a arrancar.","Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.":"Este botón requiere una acción Bridge/Companion compatible y habilitada.","Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.":"Seleccionar para reanudar; Cancelar para finalizar definitivamente.","Startzeitvorwahl noch nicht verifiziert.":"El inicio diferido aún no se ha verificado.","Malzrohr entnommen":"Tubo de malta retirado","Hopfenkochen starten":"Iniciar la cocción","Hopfen zugegeben":"Lúpulo añadido","Whirlpool bestätigen":"Confirmar el remolino","Bitte am Braumeister bestätigen.":"Confirma en el Braumeister.","Braustart in":"La elaboración comienza en","Vom Gerät gemeldete Restzeit":"Tiempo restante indicado por el dispositivo","Startzeitvorwahl: Hoch +30 min, Ab −30 min.":"Inicio diferido: Arriba +30 min, Abajo −30 min.","Jetzt starten":"Iniciar ahora","Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.":"¿Omitir la cuenta atrás e iniciar ahora? ¿Hay agua? La bomba arranca inmediatamente; después puede activarse el calentamiento.","Alarmton":"Sonido de alarma","Ton bei Alarm / Pause":"Sonido en alarma / pausa","Sound-URL (leer: Signalton)":"URL del sonido (vacío: tono integrado)","Lautstärke":"Volumen","Ton testen / freigeben":"Probar / activar sonido","Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.":"Una vez por cada alarma nueva, hasta 5 segundos. Prueba primero el sonido en esta tableta.","Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.":"Sonido no disponible. Prueba el sonido y comprueba los permisos del navegador.","Hinweis vom Braumeister":"Aviso del Braumeister","Malz eingefüllt? Bestätigung startet Pumpe und Heizung.":"¿Malta añadida? La confirmación inicia la bomba y el calentador.","Bis zur Quittierung wiederholen":"Repetir hasta confirmar","Ton stummschalten":"Silenciar sonido","Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.":"Se repite cada 6 segundos hasta confirmar en el equipo o silenciar. Prueba primero el sonido en este dispositivo.","Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.":"No hay recetas del equipo disponibles. Configure la entidad de lista de recetas en la tarjeta.","Geräterezept ansehen":"Ver receta del equipo","Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.":"No se pudo identificar la receta actual de forma única. Seleccione una receta del equipo.","Hopfengaben · Minuten vor Kochende":"Adiciones de lúpulo · minutos antes del fin del hervor","Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.":"Programa guardado en el equipo. Los cambios durante la elaboración pueden diferir. Esta selección no controla el equipo.","Hopfenkochen starten? Pumpe und Heizung können anlaufen.":"¿Iniciar el hervor? La bomba y el calentador pueden arrancar.","Frostschutz":"Aviso de helada","Bei Startvorwahl vor Frost warnen":"Avisar de heladas durante el inicio diferido","Warntemperatur des Wassers":"Umbral de temperatura del agua","Warntimer der HA-Automation (optional)":"Temporizador de aviso de HA (opcional)","Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.":"Riesgo de helada durante el inicio diferido. Comprueba el Braumeister y la bomba."},"fr":{"Bei Frostwarnung Tasten in Eisoptik anzeigen":"Afficher les boutons givrés en cas d’alerte au gel","Manuell":"Manuel","Braustart":"Démarrer le brassage","Rezept auswählen":"Choisir une recette","Ab":"Bas","Hoch":"Haut","Lokale Menünavigation":"Navigation locale dans le menu","Menüaktion läuft …":"Action de menu en attente…","Menüaktion bestätigt":"Action de menu confirmée","Menüaktion abgelaufen":"Action de menu expirée","Menüaktion unbestätigt":"Action de menu non confirmée","Gerätebildschirm hat gewechselt":"L’écran de l’appareil a changé","Einstellungen können nur direkt am Braumeister geändert werden.":"Les paramètres peuvent uniquement être modifiés directement sur le Braumeister.","Zeit":"Durée","Soll / Ist":"Cible / Réel","Soll / Ist · verstrichen":"Cible / Réel · écoulé","Temp":"Temp","Abbruch":"Annuler","Pumpe":"Pompe","Heizung":"Chauffage","Temperatur":"Température","Braumeister-Steuerung noch nicht verfügbar":"Commandes du Braumeister pas encore disponibles","Benötigt einen Steuerdienst der Integration":"Nécessite une action de commande de l’intégration","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Affichage en direct · Commandes du Braumeister pas encore disponibles","Zwischenstecker ausgeschaltet":"Prise connectée éteinte","Keine Online-Verbindung":"Aucune connexion en ligne","Inaktiv (Zwischenzustand)":"Inactif (état intermédiaire)","Integrationsmeldung":"Signalé par l’intégration","Aktuelles Rezept":"Recette actuelle","Stromversorgung":"Alimentation","Gerätedaten":"Informations sur l’appareil","Aktueller Schritt":"Étape actuelle","Gemeldeter Fortschritt":"Progression signalée","Verbindung":"Connexion","Modus":"Mode","Pumpe · gemeldet":"Pompe · signalée","Heizung · gemeldet":"Chauffage · signalé","Zwischenstecker":"Prise connectée","Schaltzustand":"État de commutation","Gesamtleistung":"Puissance totale","Einschalten":"Allumer","Ausschalten":"Éteindre","Nach Stromausfall":"Après une coupure de courant","Bitte wählen":"Choisir une option","Ein":"Marche","Aus":"Arrêt","Vorheriger Zustand":"État précédent","Zustand umkehren":"Inverser l’état","Schaltet die gesamte Stromversorgung des Braumeisters.":"Commande l’alimentation complète du Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Heure signalée par le Braumeister","Alarm vom Braumeister gemeldet":"Alarme signalée par le Braumeister","Aktion fehlgeschlagen":"Échec de l’action","Display":"Affichage","Rezept":"Recette","Strom":"Alimentation","Status":"État","Hauptmenü":"Menu principal","Einmaischen":"Empâtage","Wasser eingefüllt?":"Eau ajoutée ?","Pumpe wird entlüftet":"Purge de la pompe","Aufheizen":"Montée en température","Pumpenabschaltung":"Arrêt de la pompe","Einmaischtemperatur erreicht":"Température d’empâtage atteinte","Malz einfüllen!":"Ajouter le malt !","Malz eingefüllt?":"Malt ajouté ?","Rast":"Palier","{number}. Rast":"Palier {number}","Pumpenpause":"Pause de la pompe","Maischen":"Brassage","Rastende erreicht":"Palier terminé","Läutern":"Filtration","Malzrohr entnehmen!":"Retirer le tube à malt !","Hopfen kochen":"Ébullition","Start Hopfenkochen?":"Démarrer l’ébullition ?","Aufheizen zum Kochen":"Chauffage jusqu’à ébullition","Hopfen zugeben":"Ajouter le houblon","Hopfen zugeben – {number}. Hopfengabe":"Ajouter le houblon – ajout {number}","Hopfenzugabe":"Ajout de houblon","Nächste Hopfengabe in {number} Minuten.":"Prochain ajout de houblon dans {number} minutes.","Brauvorgang beendet":"Brassage terminé","Jetzt Whirlpool …":"Démarrer le whirlpool …","Prost!":"Santé !","Manueller Betrieb":"Mode manuel","Einstellungen":"Paramètres","Temperaturfehler":"Erreur de température","Bitte Deckel entfernen.":"Veuillez retirer le couvercle.","Automatik angehalten":"Processus automatique en pause","Status unbekannt":"État inconnu","Statuscode {number}":"Code d’état {number}","online":"En ligne","offline":"Hors ligne","automatic":"Automatique","manual":"Manuel","waiting":"En attente","on":"Marche","off":"Arrêt","previous":"État précédent","toggle":"Inverser l’état","wartet":"En attente","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H affichent les valeurs de l’intégration. Les états XHR corrects nécessitent la correction du parseur de la PR #8.","Rezepte bearbeiten":"Modifier les recettes","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Les recettes peuvent uniquement être modifiées sur myspeidel.com ou directement sur le Braumeister.","Darstellung":"Apparence","Tastenbeleuchtung":"Éclairage des boutons","Standard":"Par défaut","Licht aus":"Éclairage éteint","Eigene Farbe":"Couleur personnalisée","HEX-Farbe":"Couleur HEX","Rot":"Rouge","Orange":"Orange","Gelb":"Jaune","Grün":"Vert","Cyan":"Cyan","Blau":"Bleu","Magenta":"Magenta","Weiß":"Blanc","Nur die Tastenringe dieser Karte ändern sich.":"Seuls les anneaux des boutons de cette carte changent.","Bitte #RRGGBB eingeben.":"Saisissez #RRGGBB.","Verbindung zum Braumeister verloren":"Connexion au Braumeister perdue","Geräteverbindung noch nicht bestätigt":"Connexion à l’appareil pas encore vérifiée","Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.":"Le brassage ou l’autorisation de chauffe était actif au dernier état connu. État actuel inconnu. Vérifiez l’appareil sur place.","Auswahl":"Sélectionner","Fortsetzen":"Reprendre","Brauvorgang endgültig abbrechen?":"Abandonner définitivement le programme de brassage ?","Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.":"Eau ajoutée ? La confirmation peut démarrer la pompe et le chauffage.","Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.":"Reprendre le brassage ? La pompe et le chauffage peuvent redémarrer.","Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.":"Ce bouton nécessite une action Bridge/Companion prise en charge et activée.","Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.":"Sélectionner pour reprendre ; Annuler pour abandonner définitivement.","Startzeitvorwahl noch nicht verifiziert.":"Le départ différé n’est pas encore vérifié.","Malzrohr entnommen":"Tube à malt retiré","Hopfenkochen starten":"Démarrer l’ébullition","Hopfen zugegeben":"Houblon ajouté","Whirlpool bestätigen":"Confirmer le whirlpool","Bitte am Braumeister bestätigen.":"Confirmez sur le Braumeister.","Braustart in":"Début du brassage dans","Vom Gerät gemeldete Restzeit":"Temps restant indiqué par l’appareil","Startzeitvorwahl: Hoch +30 min, Ab −30 min.":"Départ différé : Haut +30 min, Bas −30 min.","Jetzt starten":"Démarrer maintenant","Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.":"Ignorer le compte à rebours et démarrer maintenant ? Eau ajoutée ? La pompe démarre immédiatement ; le chauffage peut suivre.","Alarmton":"Son d’alarme","Ton bei Alarm / Pause":"Son lors d’une alarme / pause","Sound-URL (leer: Signalton)":"URL du son (vide : signal intégré)","Lautstärke":"Volume","Ton testen / freigeben":"Tester / activer le son","Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.":"Une fois par nouvelle alarme, pendant 5 secondes maximum. Testez d’abord le son sur cette tablette.","Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.":"Son indisponible. Testez le son et vérifiez les autorisations du navigateur.","Hinweis vom Braumeister":"Notification du Braumeister","Malz eingefüllt? Bestätigung startet Pumpe und Heizung.":"Malt ajouté ? La confirmation démarre la pompe et le chauffage.","Bis zur Quittierung wiederholen":"Répéter jusqu’à confirmation","Ton stummschalten":"Couper le son","Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.":"Répétition toutes les 6 secondes jusqu’à confirmation sur l’appareil ou coupure du son. Testez d’abord le son sur cet appareil.","Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.":"Aucune recette disponible. Configurez l’entité de liste des recettes dans la carte.","Geräterezept ansehen":"Afficher une recette de l’appareil","Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.":"La recette actuelle ne peut pas être identifiée sans ambiguïté. Sélectionnez une recette de l’appareil.","Hopfengaben · Minuten vor Kochende":"Ajouts de houblon · minutes avant la fin de l’ébullition","Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.":"Programme enregistré sur l’appareil. Les modifications pendant le brassage peuvent différer. Cette sélection ne commande pas l’appareil.","Hopfenkochen starten? Pumpe und Heizung können anlaufen.":"Démarrer l’ébullition ? La pompe et le chauffage peuvent démarrer.","Frostschutz":"Alerte au gel","Bei Startvorwahl vor Frost warnen":"Signaler le gel pendant un départ différé","Warntemperatur des Wassers":"Seuil de température de l’eau","Warntimer der HA-Automation (optional)":"Minuterie d’alerte HA (facultative)","Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.":"Risque de gel pendant le départ différé. Vérifiez le Braumeister et la pompe."},"it":{"Bei Frostwarnung Tasten in Eisoptik anzeigen":"Mostra i pulsanti effetto ghiaccio in caso di gelo","Manuell":"Manuale","Braustart":"Avvia produzione","Rezept auswählen":"Seleziona ricetta","Ab":"Giù","Hoch":"Su","Lokale Menünavigation":"Navigazione locale nel menu","Menüaktion läuft …":"Azione di menu in attesa…","Menüaktion bestätigt":"Azione di menu confermata","Menüaktion abgelaufen":"Azione di menu scaduta","Menüaktion unbestätigt":"Azione di menu non confermata","Gerätebildschirm hat gewechselt":"La schermata del dispositivo è cambiata","Einstellungen können nur direkt am Braumeister geändert werden.":"Le impostazioni possono essere modificate solo direttamente sul Braumeister.","Zeit":"Tempo","Soll / Ist":"Obiettivo / Attuale","Soll / Ist · verstrichen":"Obiettivo / Attuale · trascorso","Temp":"Temp","Abbruch":"Annulla","Pumpe":"Pompa","Heizung":"Riscaldamento","Temperatur":"Temperatura","Braumeister-Steuerung noch nicht verfügbar":"Comandi del Braumeister non ancora disponibili","Benötigt einen Steuerdienst der Integration":"Richiede un’azione di controllo dell’integrazione","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Vista in tempo reale · Comandi del Braumeister non ancora disponibili","Zwischenstecker ausgeschaltet":"Presa intelligente spenta","Keine Online-Verbindung":"Nessuna connessione","Inaktiv (Zwischenzustand)":"Inattivo (stato intermedio)","Integrationsmeldung":"Segnalato dall’integrazione","Aktuelles Rezept":"Ricetta attuale","Stromversorgung":"Alimentazione","Gerätedaten":"Dati del dispositivo","Aktueller Schritt":"Passaggio attuale","Gemeldeter Fortschritt":"Avanzamento segnalato","Verbindung":"Connessione","Modus":"Modalità","Pumpe · gemeldet":"Pompa · segnalata","Heizung · gemeldet":"Riscaldamento · segnalato","Zwischenstecker":"Presa intelligente","Schaltzustand":"Stato dell’interruttore","Gesamtleistung":"Potenza totale","Einschalten":"Accendi","Ausschalten":"Spegni","Nach Stromausfall":"Dopo un’interruzione di corrente","Bitte wählen":"Seleziona un’opzione","Ein":"Acceso","Aus":"Spento","Vorheriger Zustand":"Stato precedente","Zustand umkehren":"Inverti stato","Schaltet die gesamte Stromversorgung des Braumeisters.":"Commuta l’intera alimentazione del Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Ora segnalata dal Braumeister","Alarm vom Braumeister gemeldet":"Allarme segnalato dal Braumeister","Aktion fehlgeschlagen":"Azione non riuscita","Display":"Display","Rezept":"Ricetta","Strom":"Alimentazione","Status":"Stato","Hauptmenü":"Menu principale","Einmaischen":"Ammostamento iniziale","Wasser eingefüllt?":"Acqua aggiunta?","Pumpe wird entlüftet":"Spurgo della pompa","Aufheizen":"Riscaldamento","Pumpenabschaltung":"Arresto della pompa","Einmaischtemperatur erreicht":"Temperatura di ammostamento raggiunta","Malz einfüllen!":"Aggiungere il malto!","Malz eingefüllt?":"Malto aggiunto?","Rast":"Sosta","{number}. Rast":"Sosta {number}","Pumpenpause":"Pausa della pompa","Maischen":"Ammostamento","Rastende erreicht":"Sosta completata","Läutern":"Filtrazione","Malzrohr entnehmen!":"Rimuovere il tubo del malto!","Hopfen kochen":"Bollitura","Start Hopfenkochen?":"Avviare la bollitura?","Aufheizen zum Kochen":"Riscaldamento fino a ebollizione","Hopfen zugeben":"Aggiungere il luppolo","Hopfen zugeben – {number}. Hopfengabe":"Aggiungere il luppolo – aggiunta {number}","Hopfenzugabe":"Aggiunta di luppolo","Nächste Hopfengabe in {number} Minuten.":"Prossima aggiunta di luppolo tra {number} minuti.","Brauvorgang beendet":"Produzione completata","Jetzt Whirlpool …":"Avviare il whirlpool …","Prost!":"Salute!","Manueller Betrieb":"Funzionamento manuale","Einstellungen":"Impostazioni","Temperaturfehler":"Errore di temperatura","Bitte Deckel entfernen.":"Rimuovere il coperchio.","Automatik angehalten":"Processo automatico in pausa","Status unbekannt":"Stato sconosciuto","Statuscode {number}":"Codice di stato {number}","online":"Online","offline":"Offline","automatic":"Automatico","manual":"Manuale","waiting":"In attesa","on":"Acceso","off":"Spento","previous":"Stato precedente","toggle":"Inverti stato","wartet":"In attesa","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H mostrano i valori dell’integrazione. Gli stati XHR corretti richiedono la correzione del parser della PR #8.","Rezepte bearbeiten":"Modifica ricette","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Le ricette possono essere modificate solo su myspeidel.com o direttamente sul Braumeister.","Darstellung":"Aspetto","Tastenbeleuchtung":"Illuminazione dei pulsanti","Standard":"Predefinito","Licht aus":"Luci spente","Eigene Farbe":"Colore personalizzato","HEX-Farbe":"Colore HEX","Rot":"Rosso","Orange":"Arancione","Gelb":"Giallo","Grün":"Verde","Cyan":"Ciano","Blau":"Blu","Magenta":"Magenta","Weiß":"Bianco","Nur die Tastenringe dieser Karte ändern sich.":"Cambiano solo gli anelli dei pulsanti di questa scheda.","Bitte #RRGGBB eingeben.":"Inserisci #RRGGBB.","Verbindung zum Braumeister verloren":"Connessione al Braumeister persa","Geräteverbindung noch nicht bestätigt":"Connessione al dispositivo non ancora verificata","Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.":"Nell’ultimo stato noto erano attivi la produzione o il consenso al riscaldamento. Stato attuale sconosciuto. Controllare il dispositivo sul posto.","Auswahl":"Seleziona","Fortsetzen":"Riprendi","Brauvorgang endgültig abbrechen?":"Interrompere definitivamente il programma di birrificazione?","Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.":"Acqua aggiunta? La conferma può avviare pompa e riscaldamento.","Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.":"Riprendere il programma? Pompa e riscaldamento possono riattivarsi.","Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.":"Questo pulsante richiede un’azione Bridge/Companion supportata e abilitata.","Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.":"Seleziona per riprendere; Annulla per interrompere definitivamente.","Startzeitvorwahl noch nicht verifiziert.":"L’avvio ritardato non è ancora stato verificato.","Malzrohr entnommen":"Tubo del malto rimosso","Hopfenkochen starten":"Avvia la bollitura","Hopfen zugegeben":"Luppolo aggiunto","Whirlpool bestätigen":"Conferma il whirlpool","Bitte am Braumeister bestätigen.":"Conferma sul Braumeister.","Braustart in":"La cotta inizia tra","Vom Gerät gemeldete Restzeit":"Tempo rimanente riportato dal dispositivo","Startzeitvorwahl: Hoch +30 min, Ab −30 min.":"Avvio ritardato: Su +30 min, Giù −30 min.","Jetzt starten":"Avvia ora","Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.":"Saltare il conto alla rovescia e avviare ora? Acqua aggiunta? La pompa parte subito; il riscaldamento può seguire.","Alarmton":"Suono di allarme","Ton bei Alarm / Pause":"Suono in caso di allarme / pausa","Sound-URL (leer: Signalton)":"URL audio (vuoto: segnale integrato)","Lautstärke":"Volume","Ton testen / freigeben":"Prova / attiva audio","Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.":"Una volta per ogni nuovo allarme, per un massimo di 5 secondi. Prova prima il suono su questo tablet.","Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.":"Audio non disponibile. Prova il suono e verifica i permessi del browser.","Hinweis vom Braumeister":"Notifica del Braumeister","Malz eingefüllt? Bestätigung startet Pumpe und Heizung.":"Malto aggiunto? La conferma avvia la pompa e il riscaldamento.","Bis zur Quittierung wiederholen":"Ripeti fino alla conferma","Ton stummschalten":"Disattiva audio","Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.":"Si ripete ogni 6 secondi fino alla conferma sul dispositivo o alla disattivazione audio. Prova prima il suono su questo dispositivo.","Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.":"Nessuna ricetta del dispositivo disponibile. Configura l’entità dell’elenco ricette nella scheda.","Geräterezept ansehen":"Visualizza ricetta del dispositivo","Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.":"Impossibile identificare univocamente la ricetta attuale. Seleziona una ricetta del dispositivo.","Hopfengaben · Minuten vor Kochende":"Aggiunte di luppolo · minuti prima della fine della bollitura","Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.":"Programma salvato sul dispositivo. Le modifiche durante la cotta possono differire. Questa selezione non controlla il dispositivo.","Hopfenkochen starten? Pumpe und Heizung können anlaufen.":"Avviare la bollitura? La pompa e il riscaldamento potrebbero avviarsi.","Frostschutz":"Avviso gelo","Bei Startvorwahl vor Frost warnen":"Avvisa del gelo durante la partenza ritardata","Warntemperatur des Wassers":"Soglia di temperatura dell’acqua","Warntimer der HA-Automation (optional)":"Timer di avviso HA (opzionale)","Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.":"Rischio di gelo durante la partenza ritardata. Controlla il Braumeister e la pompa."},"nl":{"Bei Frostwarnung Tasten in Eisoptik anzeigen":"Toon ijsknoppen bij een vorstwaarschuwing","Manuell":"Handmatig","Braustart":"Brouwen starten","Rezept auswählen":"Recept kiezen","Ab":"Omlaag","Hoch":"Omhoog","Lokale Menünavigation":"Lokale menunavigatie","Menüaktion läuft …":"Menuactie in behandeling…","Menüaktion bestätigt":"Menuactie bevestigd","Menüaktion abgelaufen":"Menuactie verlopen","Menüaktion unbestätigt":"Menuactie niet bevestigd","Gerätebildschirm hat gewechselt":"Het apparaatscherm is gewijzigd","Einstellungen können nur direkt am Braumeister geändert werden.":"Instellingen kunnen alleen rechtstreeks op de Braumeister worden gewijzigd.","Zeit":"Tijd","Soll / Ist":"Doel / Actueel","Soll / Ist · verstrichen":"Doel / Actueel · verstreken","Temp":"Temp","Abbruch":"Annuleren","Pumpe":"Pomp","Heizung":"Verwarming","Temperatur":"Temperatuur","Braumeister-Steuerung noch nicht verfügbar":"Braumeister-bediening nog niet beschikbaar","Benötigt einen Steuerdienst der Integration":"Vereist een bedieningsactie van de integratie","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Liveweergave · Braumeister-bediening nog niet beschikbaar","Zwischenstecker ausgeschaltet":"Slimme stekker uitgeschakeld","Keine Online-Verbindung":"Geen verbinding","Inaktiv (Zwischenzustand)":"Inactief (tussenstand)","Integrationsmeldung":"Gemeld door integratie","Aktuelles Rezept":"Huidig recept","Stromversorgung":"Stroomvoorziening","Gerätedaten":"Apparaatgegevens","Aktueller Schritt":"Huidige stap","Gemeldeter Fortschritt":"Gemelde voortgang","Verbindung":"Verbinding","Modus":"Modus","Pumpe · gemeldet":"Pomp · gemeld","Heizung · gemeldet":"Verwarming · gemeld","Zwischenstecker":"Slimme stekker","Schaltzustand":"Schakelstatus","Gesamtleistung":"Totaal vermogen","Einschalten":"Inschakelen","Ausschalten":"Uitschakelen","Nach Stromausfall":"Na stroomuitval","Bitte wählen":"Kies een optie","Ein":"Aan","Aus":"Uit","Vorheriger Zustand":"Vorige status","Zustand umkehren":"Status omkeren","Schaltet die gesamte Stromversorgung des Braumeisters.":"Schakelt de volledige stroomvoorziening van de Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Tijd gemeld door de Braumeister","Alarm vom Braumeister gemeldet":"Alarm gemeld door de Braumeister","Aktion fehlgeschlagen":"Actie mislukt","Display":"Scherm","Rezept":"Recept","Strom":"Stroom","Status":"Status","Hauptmenü":"Hoofdmenu","Einmaischen":"Inmaischen","Wasser eingefüllt?":"Water toegevoegd?","Pumpe wird entlüftet":"Pomp ontluchten","Aufheizen":"Opwarmen","Pumpenabschaltung":"Pomp uitschakelen","Einmaischtemperatur erreicht":"Inmaischtemperatuur bereikt","Malz einfüllen!":"Mout toevoegen!","Malz eingefüllt?":"Mout toegevoegd?","Rast":"Maischrust","{number}. Rast":"Maischrust {number}","Pumpenpause":"Pomppauze","Maischen":"Maischen","Rastende erreicht":"Maischrust voltooid","Läutern":"Filteren","Malzrohr entnehmen!":"Moutpijp verwijderen!","Hopfen kochen":"Koken","Start Hopfenkochen?":"Koken starten?","Aufheizen zum Kochen":"Opwarmen tot koken","Hopfen zugeben":"Hop toevoegen","Hopfen zugeben – {number}. Hopfengabe":"Hop toevoegen – gift {number}","Hopfenzugabe":"Hopgift","Nächste Hopfengabe in {number} Minuten.":"Volgende hopgift over {number} minuten.","Brauvorgang beendet":"Brouwproces voltooid","Jetzt Whirlpool …":"Start nu de whirlpool …","Prost!":"Proost!","Manueller Betrieb":"Handmatige bediening","Einstellungen":"Instellingen","Temperaturfehler":"Temperatuurfout","Bitte Deckel entfernen.":"Verwijder het deksel.","Automatik angehalten":"Automatisch proces gepauzeerd","Status unbekannt":"Onbekende status","Statuscode {number}":"Statuscode {number}","online":"Online","offline":"Offline","automatic":"Automatisch","manual":"Handmatig","waiting":"Wachten","on":"Aan","off":"Uit","previous":"Vorige status","toggle":"Status omkeren","wartet":"Wachten","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H tonen de waarden van de integratie. Correcte XHR-statussen vereisen de parsercorrectie uit PR #8.","Rezepte bearbeiten":"Recepten bewerken","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Recepten kunnen alleen op myspeidel.com of rechtstreeks op de Braumeister worden bewerkt.","Darstellung":"Weergave","Tastenbeleuchtung":"Knopverlichting","Standard":"Standaard","Licht aus":"Verlichting uit","Eigene Farbe":"Eigen kleur","HEX-Farbe":"HEX-kleur","Rot":"Rood","Orange":"Oranje","Gelb":"Geel","Grün":"Groen","Cyan":"Cyaan","Blau":"Blauw","Magenta":"Magenta","Weiß":"Wit","Nur die Tastenringe dieser Karte ändern sich.":"Alleen de knopringen op deze kaart veranderen.","Bitte #RRGGBB eingeben.":"Voer #RRGGBB in.","Verbindung zum Braumeister verloren":"Verbinding met de Braumeister verloren","Geräteverbindung noch nicht bestätigt":"Apparaatverbinding nog niet bevestigd","Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.":"Bij de laatst bekende toestand was het brouwen of de verwarming vrijgegeven. Huidige toestand onbekend. Controleer het apparaat ter plaatse.","Auswahl":"Selecteren","Fortsetzen":"Hervatten","Brauvorgang endgültig abbrechen?":"Het brouwprogramma definitief afbreken?","Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.":"Water toegevoegd? Bevestigen kan de pomp en verwarming starten.","Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.":"Brouwprogramma hervatten? Pomp en verwarming kunnen opnieuw starten.","Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.":"Deze knop vereist een ondersteunde en ingeschakelde Bridge/Companion-actie.","Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.":"Selecteren om te hervatten; Annuleren om definitief af te breken.","Startzeitvorwahl noch nicht verifiziert.":"Uitgesteld starten is nog niet geverifieerd.","Malzrohr entnommen":"Moutpijp verwijderd","Hopfenkochen starten":"Koken starten","Hopfen zugegeben":"Hop toegevoegd","Whirlpool bestätigen":"Whirlpool bevestigen","Bitte am Braumeister bestätigen.":"Bevestig op de Braumeister.","Braustart in":"Brouwen begint over","Vom Gerät gemeldete Restzeit":"Resterende tijd gemeld door het apparaat","Startzeitvorwahl: Hoch +30 min, Ab −30 min.":"Startvertraging: Omhoog +30 min, Omlaag −30 min.","Jetzt starten":"Nu starten","Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.":"Aftellen overslaan en nu starten? Water gevuld? De pomp start onmiddellijk; verwarming kan volgen.","Alarmton":"Alarmgeluid","Ton bei Alarm / Pause":"Geluid bij alarm / pauze","Sound-URL (leer: Signalton)":"Geluids-URL (leeg: ingebouwde toon)","Lautstärke":"Volume","Ton testen / freigeben":"Geluid testen / inschakelen","Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.":"Eenmaal per nieuw alarm, maximaal 5 seconden. Test eerst het geluid op deze tablet.","Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.":"Geluid niet beschikbaar. Test het geluid en controleer de browserrechten.","Hinweis vom Braumeister":"Melding van de Braumeister","Malz eingefüllt? Bestätigung startet Pumpe und Heizung.":"Mout toegevoegd? Bevestigen start de pomp en verwarming.","Bis zur Quittierung wiederholen":"Herhalen tot bevestiging","Ton stummschalten":"Geluid dempen","Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.":"Herhaalt elke 6 seconden tot bevestiging op het apparaat of dempen. Test eerst het geluid op dit apparaat.","Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.":"Geen apparaatrecepten beschikbaar. Koppel de receptenlijst-entiteit in de kaartconfiguratie.","Geräterezept ansehen":"Apparaatrecept bekijken","Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.":"Het huidige recept kon niet eenduidig worden gekoppeld. Kies een apparaatrecept.","Hopfengaben · Minuten vor Kochende":"Hopgiften · minuten voor einde koken","Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.":"Opgeslagen apparaatprogramma. Wijzigingen tijdens het brouwen kunnen afwijken. Deze keuze bedient het apparaat niet.","Hopfenkochen starten? Pumpe und Heizung können anlaufen.":"Koken starten? De pomp en verwarming kunnen starten.","Frostschutz":"Vorstwaarschuwing","Bei Startvorwahl vor Frost warnen":"Waarschuw voor vorst tijdens de startvertraging","Warntemperatur des Wassers":"Waarschuwingsgrens watertemperatuur","Warntimer der HA-Automation (optional)":"Waarschuwingstimer van HA (optioneel)","Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.":"Vorstgevaar tijdens de startvertraging. Controleer de Braumeister en de pomp."},"pl":{"Bei Frostwarnung Tasten in Eisoptik anzeigen":"Pokaż przyciski w stylu lodu przy ostrzeżeniu przed mrozem","Manuell":"Tryb ręczny","Braustart":"Rozpocznij warzenie","Rezept auswählen":"Wybierz recepturę","Ab":"W dół","Hoch":"W górę","Lokale Menünavigation":"Lokalna nawigacja w menu","Menüaktion läuft …":"Oczekiwanie na wykonanie akcji menu…","Menüaktion bestätigt":"Akcja menu potwierdzona","Menüaktion abgelaufen":"Akcja menu wygasła","Menüaktion unbestätigt":"Akcja menu niepotwierdzona","Gerätebildschirm hat gewechselt":"Ekran urządzenia się zmienił","Einstellungen können nur direkt am Braumeister geändert werden.":"Ustawienia można zmieniać tylko bezpośrednio na urządzeniu Braumeister.","Zeit":"Czas","Soll / Ist":"Zadane / Rzeczywiste","Soll / Ist · verstrichen":"Zadane / Rzeczywiste · upłynęło","Temp":"Temp","Abbruch":"Anuluj","Pumpe":"Pompa","Heizung":"Grzanie","Temperatur":"Temperatura","Braumeister-Steuerung noch nicht verfügbar":"Sterowanie Braumeisterem jeszcze niedostępne","Benötigt einen Steuerdienst der Integration":"Wymaga akcji sterowania integracji","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Podgląd na żywo · Sterowanie Braumeisterem jeszcze niedostępne","Zwischenstecker ausgeschaltet":"Inteligentne gniazdko wyłączone","Keine Online-Verbindung":"Brak połączenia","Inaktiv (Zwischenzustand)":"Nieaktywne (stan pośredni)","Integrationsmeldung":"Zgłoszone przez integrację","Aktuelles Rezept":"Aktualna receptura","Stromversorgung":"Zasilanie","Gerätedaten":"Dane urządzenia","Aktueller Schritt":"Aktualny krok","Gemeldeter Fortschritt":"Zgłoszony postęp","Verbindung":"Połączenie","Modus":"Tryb","Pumpe · gemeldet":"Pompa · stan zgłoszony","Heizung · gemeldet":"Grzanie · stan zgłoszony","Zwischenstecker":"Inteligentne gniazdko","Schaltzustand":"Stan przełącznika","Gesamtleistung":"Moc całkowita","Einschalten":"Włącz","Ausschalten":"Wyłącz","Nach Stromausfall":"Po zaniku zasilania","Bitte wählen":"Wybierz opcję","Ein":"Włączone","Aus":"Wyłączone","Vorheriger Zustand":"Poprzedni stan","Zustand umkehren":"Odwróć stan","Schaltet die gesamte Stromversorgung des Braumeisters.":"Przełącza całe zasilanie Braumeistera.","Vom Braumeister gemeldete Uhrzeit":"Czas zgłoszony przez Braumeister","Alarm vom Braumeister gemeldet":"Alarm zgłoszony przez Braumeister","Aktion fehlgeschlagen":"Akcja nie powiodła się","Display":"Wyświetlacz","Rezept":"Receptura","Strom":"Zasilanie","Status":"Stan","Hauptmenü":"Menu główne","Einmaischen":"Zacieranie wstępne","Wasser eingefüllt?":"Czy dodano wodę?","Pumpe wird entlüftet":"Odpowietrzanie pompy","Aufheizen":"Podgrzewanie","Pumpenabschaltung":"Wyłączenie pompy","Einmaischtemperatur erreicht":"Osiągnięto temperaturę zacierania","Malz einfüllen!":"Dodaj słód!","Malz eingefüllt?":"Czy dodano słód?","Rast":"Przerwa zacierania","{number}. Rast":"Przerwa {number}","Pumpenpause":"Przerwa pompy","Maischen":"Zacieranie","Rastende erreicht":"Przerwa zakończona","Läutern":"Filtracja","Malzrohr entnehmen!":"Wyjmij rurę słodową!","Hopfen kochen":"Gotowanie","Start Hopfenkochen?":"Rozpocząć gotowanie?","Aufheizen zum Kochen":"Podgrzewanie do wrzenia","Hopfen zugeben":"Dodaj chmiel","Hopfen zugeben – {number}. Hopfengabe":"Dodaj chmiel – dawka {number}","Hopfenzugabe":"Dodatek chmielu","Nächste Hopfengabe in {number} Minuten.":"Następna dawka chmielu za {number} minut.","Brauvorgang beendet":"Warzenie zakończone","Jetzt Whirlpool …":"Rozpocznij whirlpool …","Prost!":"Na zdrowie!","Manueller Betrieb":"Tryb ręczny","Einstellungen":"Ustawienia","Temperaturfehler":"Błąd temperatury","Bitte Deckel entfernen.":"Zdejmij pokrywę.","Automatik angehalten":"Proces automatyczny wstrzymany","Status unbekannt":"Nieznany stan","Statuscode {number}":"Kod stanu {number}","online":"Online","offline":"Offline","automatic":"Automatyczny","manual":"Ręczny","waiting":"Oczekiwanie","on":"Włączone","off":"Wyłączone","previous":"Poprzedni stan","toggle":"Odwróć stan","wartet":"Oczekiwanie","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H pokazują wartości integracji. Poprawne stany XHR wymagają poprawki parsera z PR #8.","Rezepte bearbeiten":"Edytuj przepisy","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Przepisy można edytować tylko na myspeidel.com lub bezpośrednio na urządzeniu Braumeister.","Darstellung":"Wygląd","Tastenbeleuchtung":"Podświetlenie przycisków","Standard":"Domyślne","Licht aus":"Światło wyłączone","Eigene Farbe":"Własny kolor","HEX-Farbe":"Kolor HEX","Rot":"Czerwony","Orange":"Pomarańczowy","Gelb":"Żółty","Grün":"Zielony","Cyan":"Cyjan","Blau":"Niebieski","Magenta":"Magenta","Weiß":"Biały","Nur die Tastenringe dieser Karte ändern sich.":"Zmieniają się tylko pierścienie przycisków tej karty.","Bitte #RRGGBB eingeben.":"Wpisz #RRGGBB.","Verbindung zum Braumeister verloren":"Utracono połączenie z Braumeisterem","Geräteverbindung noch nicht bestätigt":"Połączenie z urządzeniem nie jest jeszcze potwierdzone","Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.":"W ostatnim znanym stanie warzenie lub zezwolenie na grzanie było aktywne. Bieżący stan nieznany. Sprawdź urządzenie na miejscu.","Auswahl":"Wybierz","Fortsetzen":"Wznów","Brauvorgang endgültig abbrechen?":"Trwale przerwać program warzenia?","Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.":"Czy dodano wodę? Potwierdzenie może uruchomić pompę i grzałkę.","Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.":"Wznowić warzenie? Pompa i grzałka mogą ponownie się uruchomić.","Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.":"Ten przycisk wymaga obsługiwanej i włączonej akcji Bridge/Companion.","Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.":"Wybierz, aby wznowić; Anuluj, aby trwale przerwać.","Startzeitvorwahl noch nicht verifiziert.":"Opóźniony start nie został jeszcze zweryfikowany.","Malzrohr entnommen":"Kosz zasypowy wyjęty","Hopfenkochen starten":"Rozpocznij gotowanie","Hopfen zugegeben":"Chmiel dodany","Whirlpool bestätigen":"Potwierdź whirlpool","Bitte am Braumeister bestätigen.":"Potwierdź na urządzeniu Braumeister.","Braustart in":"Warzenie rozpocznie się za","Vom Gerät gemeldete Restzeit":"Pozostały czas zgłoszony przez urządzenie","Startzeitvorwahl: Hoch +30 min, Ab −30 min.":"Opóźnienie startu: W górę +30 min, W dół −30 min.","Jetzt starten":"Uruchom teraz","Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.":"Pominąć odliczanie i uruchomić teraz? Czy wlano wodę? Pompa uruchomi się natychmiast; następnie może włączyć się grzanie.","Alarmton":"Dźwięk alarmu","Ton bei Alarm / Pause":"Dźwięk przy alarmie / pauzie","Sound-URL (leer: Signalton)":"Adres URL dźwięku (pusty: sygnał wbudowany)","Lautstärke":"Głośność","Ton testen / freigeben":"Testuj / włącz dźwięk","Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.":"Raz na każdy nowy alarm, maksymalnie 5 sekund. Najpierw przetestuj dźwięk na tym tablecie.","Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.":"Dźwięk niedostępny. Przetestuj dźwięk i sprawdź uprawnienia przeglądarki.","Hinweis vom Braumeister":"Powiadomienie z Braumeistera","Malz eingefüllt? Bestätigung startet Pumpe und Heizung.":"Dodano słód? Potwierdzenie uruchamia pompę i grzałkę.","Bis zur Quittierung wiederholen":"Powtarzaj do potwierdzenia","Ton stummschalten":"Wycisz dźwięk","Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.":"Powtarza co 6 sekund do potwierdzenia na urządzeniu lub wyciszenia. Najpierw przetestuj dźwięk na tym urządzeniu.","Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.":"Brak danych receptur urządzenia. Przypisz encję listy receptur w konfiguracji karty.","Geräterezept ansehen":"Wyświetl recepturę urządzenia","Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.":"Nie można jednoznacznie dopasować bieżącej receptury. Wybierz recepturę urządzenia.","Hopfengaben · Minuten vor Kochende":"Dodatki chmielu · minuty przed końcem gotowania","Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.":"Program zapisany w urządzeniu. Zmiany podczas warzenia mogą się różnić. Ten wybór nie steruje urządzeniem.","Hopfenkochen starten? Pumpe und Heizung können anlaufen.":"Rozpocząć gotowanie? Pompa i grzałka mogą się uruchomić.","Frostschutz":"Ostrzeżenie przed mrozem","Bei Startvorwahl vor Frost warnen":"Ostrzegaj przed mrozem podczas opóźnionego startu","Warntemperatur des Wassers":"Próg temperatury wody","Warntimer der HA-Automation (optional)":"Minutnik ostrzeżeń HA (opcjonalny)","Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.":"Ryzyko zamarznięcia podczas opóźnionego startu. Sprawdź Braumeister i pompę."},"pt":{"Bei Frostwarnung Tasten in Eisoptik anzeigen":"Mostrar botões com efeito de gelo durante um aviso de geada","Manuell":"Manual","Braustart":"Iniciar brassagem","Rezept auswählen":"Selecionar receita","Ab":"Para baixo","Hoch":"Para cima","Lokale Menünavigation":"Navegação local no menu","Menüaktion läuft …":"Ação de menu pendente…","Menüaktion bestätigt":"Ação de menu confirmada","Menüaktion abgelaufen":"Ação de menu expirada","Menüaktion unbestätigt":"Ação de menu não confirmada","Gerätebildschirm hat gewechselt":"O ecrã do equipamento mudou","Einstellungen können nur direkt am Braumeister geändert werden.":"As definições só podem ser alteradas diretamente no Braumeister.","Zeit":"Tempo","Soll / Ist":"Alvo / Atual","Soll / Ist · verstrichen":"Alvo / Atual · decorrido","Temp":"Temp","Abbruch":"Cancelar","Pumpe":"Bomba","Heizung":"Aquecimento","Temperatur":"Temperatura","Braumeister-Steuerung noch nicht verfügbar":"Controlo do Braumeister ainda indisponível","Benötigt einen Steuerdienst der Integration":"Requer uma ação de controlo da integração","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Visualização em direto · Controlo do Braumeister ainda indisponível","Zwischenstecker ausgeschaltet":"Tomada inteligente desligada","Keine Online-Verbindung":"Sem ligação","Inaktiv (Zwischenzustand)":"Inativo (estado intermédio)","Integrationsmeldung":"Comunicado pela integração","Aktuelles Rezept":"Receita atual","Stromversorgung":"Alimentação elétrica","Gerätedaten":"Dados do dispositivo","Aktueller Schritt":"Passo atual","Gemeldeter Fortschritt":"Progresso comunicado","Verbindung":"Ligação","Modus":"Modo","Pumpe · gemeldet":"Bomba · comunicada","Heizung · gemeldet":"Aquecimento · comunicado","Zwischenstecker":"Tomada inteligente","Schaltzustand":"Estado do interruptor","Gesamtleistung":"Potência total","Einschalten":"Ligar","Ausschalten":"Desligar","Nach Stromausfall":"Após falha de energia","Bitte wählen":"Selecione uma opção","Ein":"Ligado","Aus":"Desligado","Vorheriger Zustand":"Estado anterior","Zustand umkehren":"Inverter estado","Schaltet die gesamte Stromversorgung des Braumeisters.":"Comuta toda a alimentação do Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Hora comunicada pelo Braumeister","Alarm vom Braumeister gemeldet":"Alarme comunicado pelo Braumeister","Aktion fehlgeschlagen":"A ação falhou","Display":"Ecrã","Rezept":"Receita","Strom":"Alimentação","Status":"Estado","Hauptmenü":"Menu principal","Einmaischen":"Arriada","Wasser eingefüllt?":"Água adicionada?","Pumpe wird entlüftet":"A purgar a bomba","Aufheizen":"A aquecer","Pumpenabschaltung":"Paragem da bomba","Einmaischtemperatur erreicht":"Temperatura de arriada atingida","Malz einfüllen!":"Adicionar malte!","Malz eingefüllt?":"Malte adicionado?","Rast":"Patamar","{number}. Rast":"Patamar {number}","Pumpenpause":"Pausa da bomba","Maischen":"Mosturação","Rastende erreicht":"Patamar concluído","Läutern":"Filtração","Malzrohr entnehmen!":"Retirar o tubo de malte!","Hopfen kochen":"Fervura","Start Hopfenkochen?":"Iniciar fervura?","Aufheizen zum Kochen":"A aquecer até à fervura","Hopfen zugeben":"Adicionar lúpulo","Hopfen zugeben – {number}. Hopfengabe":"Adicionar lúpulo – adição {number}","Hopfenzugabe":"Adição de lúpulo","Nächste Hopfengabe in {number} Minuten.":"Próxima adição de lúpulo em {number} minutos.","Brauvorgang beendet":"Brassagem concluída","Jetzt Whirlpool …":"Iniciar whirlpool …","Prost!":"Saúde!","Manueller Betrieb":"Funcionamento manual","Einstellungen":"Definições","Temperaturfehler":"Erro de temperatura","Bitte Deckel entfernen.":"Retire a tampa.","Automatik angehalten":"Processo automático em pausa","Status unbekannt":"Estado desconhecido","Statuscode {number}":"Código de estado {number}","online":"Online","offline":"Offline","automatic":"Automático","manual":"Manual","waiting":"Em espera","on":"Ligado","off":"Desligado","previous":"Estado anterior","toggle":"Inverter estado","wartet":"Em espera","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H mostram os valores da integração. Os estados XHR corretos requerem a correção do analisador da PR #8.","Rezepte bearbeiten":"Editar receitas","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"As receitas só podem ser editadas em myspeidel.com ou diretamente no Braumeister.","Darstellung":"Aparência","Tastenbeleuchtung":"Iluminação dos botões","Standard":"Padrão","Licht aus":"Luzes apagadas","Eigene Farbe":"Cor personalizada","HEX-Farbe":"Cor HEX","Rot":"Vermelho","Orange":"Laranja","Gelb":"Amarelo","Grün":"Verde","Cyan":"Ciano","Blau":"Azul","Magenta":"Magenta","Weiß":"Branco","Nur die Tastenringe dieser Karte ändern sich.":"Só mudam os anéis dos botões deste cartão.","Bitte #RRGGBB eingeben.":"Introduza #RRGGBB.","Verbindung zum Braumeister verloren":"Ligação ao Braumeister perdida","Geräteverbindung noch nicht bestätigt":"Ligação ao dispositivo ainda não verificada","Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.":"No último estado conhecido, a brassagem ou a autorização de aquecimento estava ativa. Estado atual desconhecido. Verifique o aparelho no local.","Auswahl":"Selecionar","Fortsetzen":"Retomar","Brauvorgang endgültig abbrechen?":"Cancelar definitivamente o programa de brassagem?","Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.":"Água adicionada? Confirmar pode ativar a bomba e o aquecimento.","Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.":"Retomar o programa? A bomba e o aquecimento podem voltar a funcionar.","Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.":"Este botão requer uma ação Bridge/Companion suportada e ativada.","Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.":"Selecionar para retomar; Cancelar para terminar definitivamente.","Startzeitvorwahl noch nicht verifiziert.":"O início diferido ainda não foi verificado.","Malzrohr entnommen":"Tubo de malte retirado","Hopfenkochen starten":"Iniciar a fervura","Hopfen zugegeben":"Lúpulo adicionado","Whirlpool bestätigen":"Confirmar o redemoinho","Bitte am Braumeister bestätigen.":"Confirme no Braumeister.","Braustart in":"A brassagem começa em","Vom Gerät gemeldete Restzeit":"Tempo restante indicado pelo dispositivo","Startzeitvorwahl: Hoch +30 min, Ab −30 min.":"Início adiado: Cima +30 min, Baixo −30 min.","Jetzt starten":"Iniciar agora","Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.":"Saltar a contagem decrescente e iniciar agora? Foi adicionada água? A bomba arranca imediatamente; o aquecimento pode seguir-se.","Alarmton":"Som de alarme","Ton bei Alarm / Pause":"Som em caso de alarme / pausa","Sound-URL (leer: Signalton)":"URL do som (vazio: sinal integrado)","Lautstärke":"Volume","Ton testen / freigeben":"Testar / ativar som","Einmal pro neuem Alarm, maximal 5 Sekunden. Auf diesem Tablet zuerst den Ton testen.":"Uma vez por novo alarme, até 5 segundos. Teste primeiro o som neste tablet.","Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.":"Som indisponível. Teste o som e verifique as permissões do navegador.","Hinweis vom Braumeister":"Notificação do Braumeister","Malz eingefüllt? Bestätigung startet Pumpe und Heizung.":"Malte adicionado? A confirmação inicia a bomba e o aquecimento.","Bis zur Quittierung wiederholen":"Repetir até confirmar","Ton stummschalten":"Silenciar som","Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.":"Repete a cada 6 segundos até confirmar no equipamento ou silenciar. Teste primeiro o som neste dispositivo.","Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.":"Sem receitas do dispositivo disponíveis. Configure a entidade da lista de receitas no cartão.","Geräterezept ansehen":"Ver receita do dispositivo","Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.":"Não foi possível identificar a receita atual de forma inequívoca. Selecione uma receita do dispositivo.","Hopfengaben · Minuten vor Kochende":"Adições de lúpulo · minutos antes do fim da fervura","Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.":"Programa guardado no dispositivo. As alterações durante a brassagem podem diferir. Esta seleção não controla o dispositivo.","Hopfenkochen starten? Pumpe und Heizung können anlaufen.":"Iniciar a fervura? A bomba e o aquecimento podem arrancar.","Frostschutz":"Aviso de geada","Bei Startvorwahl vor Frost warnen":"Avisar sobre geada durante o início diferido","Warntemperatur des Wassers":"Limite de temperatura da água","Warntimer der HA-Automation (optional)":"Temporizador de aviso do HA (opcional)","Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.":"Risco de geada durante o início diferido. Verifique o Braumeister e a bomba."}};
  const languageCache = new Map();
  const normalizeLanguage = value => {
    try { return Intl.getCanonicalLocales(String(value).replace(/_/g, '-'))[0] || 'en-US'; }
    catch { return 'en-US'; }
  };
  const loadLanguage = url => {
    if (!languageCache.has(url)) languageCache.set(url, Promise.resolve().then(() => fetch(url))
      .then(response => response.ok ? response.json() : null)
      .then(data => data && typeof data === 'object' && !Array.isArray(data)
        ? Object.fromEntries(Object.entries(data).filter(([, value]) => typeof value === 'string' && value.trim())) : {})
      .catch(() => ({})));
    return languageCache.get(url);
  };
  // Strict CSS allowlist: never interpolate arbitrary YAML into a style block.
  const lightingValue = value => value === 'off' ? 'off'
    : typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : 'default';
  const presets = [['Rot','#ff3030'],['Orange','#ff8c00'],['Gelb','#ffda16'],['Grün','#20d050'],['Cyan','#00cfff'],['Blau','#305bff'],['Magenta','#da30ff'],['Weiß','#f4f4f4']];

  // Shared across editor/cards so a user's Test gesture unlocks the same player.
  // No downloaded or proprietary sound is bundled; the default tone is synthesized.
  const alarmAudio = {
    stop() {
      clearTimeout(this.timer);
      if (this.player) { this.player.pause(); this.player.currentTime = 0; }
      for (const oscillator of this.oscillators || []) { try { oscillator.stop(); } catch (_) {} }
      this.oscillators = [];
    },
    async play(config) {
      this.stop();
      const raw = Number(config.alarm_volume ?? 50);
      const volume = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 50)) / 100;
      const url = String(config.alarm_sound_url || '').trim();
      if (url) {
        const parsed = new URL(url, globalThis.location?.href || 'http://localhost/');
        if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw Error('Invalid audio URL');
        this.player ||= new Audio();
        this.player.src = parsed.href;
        this.player.volume = volume;
        await this.player.play();
        this.timer = setTimeout(() => this.stop(), 5000);
      } else {
        const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Context) throw Error('Audio unavailable');
        this.context ||= new Context();
        await this.context.resume();
        if (this.context.state !== 'running') throw Error('Audio blocked');
        for (let i = 0; i < 3; i++) {
          const oscillator = this.context.createOscillator(), gain = this.context.createGain();
          const start = this.context.currentTime + i * 0.4;
          oscillator.frequency.value = 880;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(volume * 0.2, start + 0.02);
          gain.gain.linearRampToValueAtTime(0, start + 0.25);
          oscillator.connect(gain); gain.connect(this.context.destination);
          oscillator.start(start); oscillator.stop(start + 0.3);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
          this.oscillators.push(oscillator);
        }
      }
    }
  };
  class BraumeisterDisplay extends HTMLElement {
    constructor() {
      super(); this.attachShadow({mode:'open'}); this.page='display'; this.pending=false;
      this.shadowRoot.addEventListener('click', e => {
        const b=e.target.closest('button'); if(!b || b.disabled) return;
        if(b.dataset.audio) { if (b.dataset.audio === 'mute') this.muteAlarmAudio(); else this.testAlarmAudio(true); return; }
        if(b.dataset.page) { this.page=b.dataset.page; this.render(); }
        if(b.dataset.info) this.dispatchEvent(new CustomEvent('hass-more-info', {detail:{entityId:this.ids[b.dataset.info]},bubbles:true,composed:true}));
        if(b.dataset.power) this.command('switch', b.dataset.power, {entity_id:this.ids.plug});
        if(b.dataset.menu) this.navigate(b.dataset.menu);
      });
      this.shadowRoot.addEventListener('change',e=>{
        if(e.target.id==='recipe-plan') { this.previewRecipeSlot=e.target.value; this.render(); }
        if(e.target.id==='behavior') this.command('select','select_option',{entity_id:this.ids.behavior,option:e.target.value});
      });
    }
    setConfig(config) { this.stopAlarmAudio(); this.config=config; this.ids={...defaults,...config.entities}; this.refreshLanguage(); this.render(); }
    menuContext(hass=this._hass) {
      const attrs=hass?.states[this.ids?.step]?.attributes || {};
      return JSON.stringify([this.menuStateCode(attrs.display_state_code),attrs.display_interrupt,attrs.display_editor_flags,attrs.display_button_labels]);
    }
    set hass(value) {
      const previous=this._hass; this._hass=value;
      if(previous && this.menuContext(previous)!==this.menuContext(value)) {
        this.menuContextEpoch=(this.menuContextEpoch || 0)+1;
        this.menuResult='';
      }
      this.refreshLanguage();
      const previousCode = previous?.states[this.ids?.step]?.attributes.display_state_code;
      const code = value.states[this.ids?.step]?.attributes.display_state_code;
      if (previousCode === 2015 && code !== 2015) this.picker = null;
      if(!this.ids || !previous || previous.user !== value.user
        || previous.services?.braumeister_menu !== value.services?.braumeister_menu
        || Object.values(this.ids).some(id=>previous.states[id]!==value.states[id])) this.render();
      this.observeAlarm();
      this.refreshRecipePicker();
    }

    frostWarning(live, attrs) {
      const delay = attrs.display_start_delay_seconds;
      if (this.config.frost_enabled !== true || !live || attrs.display_state_code !== 2120 ||
          !Number.isInteger(delay) || delay <= 0 || attrs.display_interrupt === 1) return false;
      if (this.ids.frost_timer) return this.state('frost_timer') === 'active';
      const sensor = this._hass.states[this.ids.temperature];
      const unit = sensor?.attributes?.unit_of_measurement;
      if (!['°C', '°F'].includes(unit) || typeof sensor?.state !== 'string' || !sensor.state.trim()) return false;
      const value = Number(sensor.state);
      const threshold = this.config.frost_threshold ?? 3;
      const limit = threshold + (this._frostVisible ? 1 : 0);
      return Number.isFinite(value) && Number.isFinite(threshold) && threshold >= 0 && threshold <= 10 &&
        value <= (unit === '°F' ? limit * 9 / 5 + 32 : limit);
    }

    alarmActive() {
      const attrs = this._hass?.states[this.ids?.step]?.attributes || {};
      const code = this.menuStateCode(attrs.display_state_code);
      const live = this.state('connection') === 'online' && this.state('plug') !== 'off'
        && (!this.ids.connection_warning || this.state('connection_warning') === 'off')
        && ![undefined, 'unknown', 'unavailable'].includes(this.state('step'));
      return live ? (this.state('alarm') === 'on' || (attrs.display_interrupt === 1 && code >= 2000 && code < 4000)) : null;
    }
    observeAlarm() {
      const active = this.alarmActive(), previous = this._alarmActive;
      this._alarmActive = active;
      if (active !== true || this.config.alarm_sound !== true) {
        if (previous === true) this.stopAlarmAudio();
        if (active === false) this._alarmMuted = false;
        return;
      }
      // No replay on initial dashboard load/reconnect or repeated HA updates.
      if (previous === false && !this._alarmMuted) this.testAlarmAudio(true);
    }
    stopAlarmAudio() {
      clearTimeout(this._alarmRepeatTimer);
      this._audioEpoch = (this._audioEpoch || 0) + 1;
      alarmAudio.stop();
    }
    muteAlarmAudio() {
      this._alarmMuted = true;
      this.stopAlarmAudio();
      this.render();
    }
    async testAlarmAudio(repeat = false) {
      clearTimeout(this._alarmRepeatTimer);
      const epoch = this._audioEpoch = (this._audioEpoch || 0) + 1;
      try { await alarmAudio.play(this.config); this.audioError = false; }
      catch (_) { this.audioError = true; }
      if (epoch !== this._audioEpoch) { alarmAudio.stop(); return; }
      if (repeat && !this.audioError && !this._alarmMuted && this.config.alarm_sound === true
          && this.config.alarm_repeat !== false && this.alarmActive() === true) {
        this._alarmRepeatTimer = setTimeout(() => {
          if (epoch === this._audioEpoch && this.alarmActive() === true && !this._alarmMuted)
            this.testAlarmAudio(true);
        }, 6000);
      }
      this.render();
    }
    disconnectedCallback() { this.stopAlarmAudio(); this._alarmActive = null; }
    async refreshRecipePicker() {
      const code = this.menuStateCode(this._hass?.states[this.ids?.step]?.attributes.display_state_code);
      if (code !== 2015 || !this.menuAvailable()) {
        this.pickerReadEpoch = (this.pickerReadEpoch || 0) + 1;
        this.pickerReadAt = 0;
        return;
      }
      if (!this._hass.services?.braumeister_menu?.get_recipe_picker || this.pickerReading || this.pending
          || Date.now() - (this.pickerReadAt || 0) < 5000) return;
      const epoch = this.pickerReadEpoch || 0;
      this.pickerReading = true;
      this.pickerReadAt = Date.now();
      try {
        const reply = await this._hass.callWS({type:'call_service', domain:'braumeister_menu',
          service:'get_recipe_picker', service_data:{}, return_response:true});
        if (epoch === (this.pickerReadEpoch || 0) && !this.pending
            && this.menuStateCode(this._hass?.states[this.ids.step]?.attributes.display_state_code) === 2015) {
          this.picker = reply?.response?.picker ?? null;
          this.render();
        }
      } catch (_) {
        // Retry on a later HA update; never issue a navigation action to load names.
      } finally { this.pickerReading = false; }
    }
    refreshLanguage() {
      if (!this.config) return;
      const configured = this.config.language;
      const language = normalizeLanguage(configured && configured !== 'auto' ? configured
        : this._hass?.locale?.language || this._hass?.language || globalThis.navigator?.language || 'en-US');
      const path = (this.config.i18n_path || '/local/braumeister-i18n').replace(/\/$/, '');
      const signature = `${path}|${language}`;
      if (signature === this._languageSignature) return;
      this._languageSignature = signature;
      this.language = language;
      this._translations = {};
      const base = language.split('-')[0];
      const candidates = [...new Set(['en-US', base, language])].filter(code => code !== 'en');
      this._languageReady = Promise.all(candidates.map(code =>
        loadLanguage(`${path}/${encodeURIComponent(code)}.json?v=0.7.0-beta.39`).then(external => ({...BUNDLED_LANGUAGES[code], ...external})))).then(dictionaries => {
        if (signature !== this._languageSignature) return;
        this._translations = Object.assign({}, ...dictionaries);
        this.render();
      });
      this.render();
    }
    translate(key, params = {}) {
      key = String(key);
      // GUI-only alias: preserve the integration state and device code.
      if (key === 'Statuscode 6010') key = 'Rezepte bearbeiten';
      // Match only known device message formats; never replace arbitrary recipe text.
      const patterns = [
        [/^(\d+)\. Rast$/, '{number}. Rast'],
        [/^Hopfen zugeben – (\d+)\. Hopfengabe$/, 'Hopfen zugeben – {number}. Hopfengabe'],
        [/^Nächste Hopfengabe in (\d+) Minuten\.$/, 'Nächste Hopfengabe in {number} Minuten.'],
        [/^Statuscode (-?\d+)$/, 'Statuscode {number}'],
      ];
      for (const [pattern, template] of patterns) {
        const match = key.match(pattern);
        if (match) { key = template; params = {number: match[1], ...params}; break; }
      }
      const own = (obj, name) => Object.prototype.hasOwnProperty.call(obj || {}, name) ? obj[name] : undefined;
      const value = own(this._translations, key) || own(ENGLISH, key) || key;
      return value.replace(/\{(\w+)\}/g, (placeholder, name) => own(params, name) ?? placeholder);
    }
    label(key) {
      const value = this.text(key);
      if (key === 'step') {
        const recipe = this.text('recipe');
        for (const separator of [' – ', ' - ']) {
          const prefix = recipe + separator;
          if (recipe !== '—' && value.startsWith(prefix)) return prefix + this.translate(value.slice(prefix.length));
        }
      }
      return ['step','mode','connection','pump','heater','plug','behavior'].includes(key) ? this.translate(value) : value;
    }
    static getConfigElement(){return document.createElement('braumeister-display-card-editor');}
    getCardSize(){return 10;}
    getGridOptions(){return {columns:12,rows:'auto',min_columns:6};}
    state(key){return this._hass?.states[this.ids[key]]?.state;}
    text(key){const s=this.state(key);return s && !['unknown','unavailable'].includes(s)?s:'—';}
    number(key,unit){const s=this.text(key);return s!=='—' && Number.isFinite(Number(s))?Number(s).toLocaleString(this.language || 'en-US',{maximumFractionDigits:1})+' '+unit:'—';}
    async command(domain,service,data){
      if(this.pending) return;
      this.pending=true; this.error=''; this.render();
      try{await this._hass.callService(domain,service,data);}
      catch(e){this.error=e.message || 'Aktion fehlgeschlagen';}
      finally{this.pending=false;this.render();}
    }
    menuAvailable() {
      return this.config.menu_control === true && this._hass.user?.is_admin
        && (!this.ids.connection_warning || this.state('connection_warning') === 'off')
        && this._hass.services?.braumeister_menu?.navigate
        && this.state('connection') === 'online' && this.state('plug') !== 'off';
    }
    actuatorActions() {
      const attrs = this._hass.states[this.ids.step]?.attributes;
      if (attrs?.display_state_code !== 4006 || !this.menuAvailable()
          || !this._hass.services?.braumeister_menu?.set_actuator) return {};
      const flags = `${attrs.display_pump_flag}${attrs.display_heater_flag}`;
      return {
        Pumpe: this.config.manual_pump_control === true
          ? {ph: 'pump_on', pH: 'pump_on', pi: 'pump_on',
            Ph: 'pump_off', PH: 'pump_off', Pi: 'pump_off'}[flags] : undefined,
        Heizung: this.config.manual_heater_control === true
          ? {ph: 'heater_on', Ph: 'heater_on', pH: 'heater_off',
            PH: 'heater_off', Pi: 'heater_off', pi: 'heater_off'}[flags] : undefined,
      };
    }
    menuStateCode(code) {
      return typeof code === 'string' && /^\d{3,4}$/.test(code) ? Number(code) : code;
    }
    menuKeysFor(code) {
      code = this.menuStateCode(code);
      const interrupt = this._hass?.states[this.ids.step]?.attributes.display_interrupt;
      const editorFlags=this._hass?.states[this.ids.step]?.attributes.display_editor_flags;
      if(code===3010 && ['0DT','0D0'].includes(editorFlags)) return editorFlags==='0DT'
        ? [['✕','Abbruch'], ['⌄','Ab'], ['⌃','Hoch'], ['✓','Auswahl','confirm_lid_removed']]
        : [['✕','Abbruch','request_program_pause'], ['✓','Auswahl','confirm_lid_removed']];
      if (Number.isInteger(code) && code >= 2000 && code < 4000 && interrupt === 1) {
        return [['✕','Abbruch','abort_program'], ['✓','Auswahl','resume_program']];
      }
      if (Number.isInteger(interrupt) && interrupt > 0) return [];
      const attrs=this._hass?.states[this.ids.step]?.attributes;
      if(code===3010 && attrs?.display_button_labels==='ADUS' && ['00T','00Z'].includes(attrs?.display_editor_flags)) {
        return [['✕','Abbruch'], ['⌄','Ab'], ['⌃','Hoch'], ['✓','Auswahl']];
      }
      if(code===3010 && editorFlags==='000') return [['✕','Abbruch','request_program_pause'], ['✓','Auswahl']];
      return menuKeys[code] || [];
    }
    serviceSupports(service, action) {
      const options = this._hass?.services?.braumeister_menu?.[service]?.fields?.action?.selector?.select?.options;
      return Array.isArray(options) && options.some(option =>
        option === action || (option && typeof option === 'object' && option.value === action));
    }
    actionService(action) {
      if (programActions.has(action)) {
        const code = this.menuStateCode(this._hass?.states[this.ids.step]?.attributes.display_state_code);
        if (action === 'resume_program' && ![2300,2310,2810,2820,3010,3080,3450].includes(code)) return null;
        if (action === 'request_program_pause' && [3010,3080,3450].includes(code)) return this.serviceSupports('program_control', action) ? 'program_control' : null;
        if (['request_program_pause', 'abort_program'].includes(action) && ![2300,2310,2410,2510,2610,2705,2810,2820,2910,2930,2960,3010].includes(code)) return null;
        const stopping = ['request_program_pause', 'abort_program', 'cancel_water_prompt', 'cancel_start_delay'].includes(action);
        return this.serviceSupports('program_control', action)
          && (stopping || this.config.program_control === true) ? 'program_control' : null;
      }
      if (['select_recipe','open_temperature_editor','temperature_up','temperature_down','confirm_temperature','cancel_temperature'].includes(action)) return this.serviceSupports('navigate', action) ? 'navigate' : null;
      return 'navigate';
    }
    async navigate(action) {
      const code = this.menuStateCode(this._hass.states[this.ids.step]?.attributes.display_state_code);
      if (this.pending) return;
      if (action === 'temperature_readings') {
        if (code !== 4006 || this.state('connection') !== 'online' || this.state('plug') === 'off') return;
        this.showTemperatureReadings = !this.showTemperatureReadings;
        this.render();
        return;
      }
      const actuator = Object.values(this.actuatorActions()).includes(action);
      if (!actuator && (!this.menuAvailable() || !this.menuKeysFor(code).some(key => key[2] === action))) return;
      const service = actuator ? 'set_actuator' : this.actionService(action);
      if (!service) return;
      if (action === 'heater_on' && !window.confirm(this.translate('Heizung am Braumeister einschalten?'))) return;
      if (action === 'confirm_lid_removed' && !window.confirm(this.translate('Bitte Deckel entfernen.'))) return;
      if (action === 'confirm_malt_pipe_removed' && !window.confirm(this.translate('Malzrohr entnommen'))) return;
      if (energizingActions.has(action) && !window.confirm(this.translate(action === 'start_boil' ? 'Hopfenkochen starten? Pumpe und Heizung können anlaufen.' : action === 'confirm_malt_added' ? 'Malz eingefüllt? Bestätigung startet Pumpe und Heizung.' : action === 'start_now'
        ? 'Countdown überspringen und jetzt starten? Wasser eingefüllt? Pumpe startet sofort; Heizung kann folgen.'
        : ['confirm_water_filled', 'confirm_start_delay'].includes(action)
        ? 'Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.'
        : 'Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.'))) return;
      if (action === 'abort_program' && !window.confirm(this.translate('Brauvorgang endgültig abbrechen?'))) return;
      this.pending = true;
      this.pickerReadEpoch = (this.pickerReadEpoch || 0) + 1;
      this.menuResult = 'pending';
      this.pendingMenuAction = action;
      const contextEpoch=this.menuContextEpoch || 0;
      this.render();
      try {
        const reply = await this._hass.callWS({
          type: 'call_service', domain: 'braumeister_menu', service,
          service_data: {action}, return_response: true,
        });
        if(contextEpoch===(this.menuContextEpoch || 0)) {
          this.menuResult = reply?.response?.result || 'unconfirmed';
          if (reply?.response?.picker) this.picker = reply.response.picker;
        }
      } catch (err) {
        if(contextEpoch===(this.menuContextEpoch || 0)) this.menuResult = err.message || 'unconfirmed';
      } finally {
        this.pendingMenuAction = null;
        this.pending = false;
        this.render();
      }
    }
    renderMenu(code) {
      const available = this.menuAvailable();
      const screen = this.menuStateCode(code);
      const interrupt = this._hass.states[this.ids.step]?.attributes?.display_interrupt;
      const pumpFlag = this._hass.states[this.ids.step]?.attributes?.display_pump_flag;
      const timedBoil = screen >= 3070 && screen < 3080;
      if (!this.menuKeysFor(screen).some(key=>key[2]) && interrupt === 0 && Number.isInteger(screen) && screen >= 2510 && screen <= 3700
          && !(screen < 2610 && pumpFlag === 'q')) {
        const keys = screen <= 3500 ? [['✕', 'Abbruch']] : [];
        const attrs=this._hass.states[this.ids.step]?.attributes;
        const boilEditor=screen===3010 && attrs?.display_button_labels==='ADUS' && ['00T','00Z'].includes(attrs?.display_editor_flags);
        if (boilEditor || (screen >= 2705 && screen < 2810) || timedBoil || (screen >= 3450 && screen <= 3500)) keys.push(['⌄', 'Ab'], ['⌃', 'Hoch']);
        if (screen < 2810 || screen === 2820 || screen >= 2910) keys.push(['✓', 'Auswahl']);
        const buttons = keys.map(([icon, key]) => {
          const label = esc(this.translate(key));
          return `<div><button type="button" disabled aria-label="${label}">${controlIcon(icon)}</button><small>${label}</small></div>`;
        }).join('');
        return `<div class="keys mash-preview"${screen > 3500 ? ' style="justify-content:flex-end"' : ''}>${buttons}</div><p class="hint">${esc(this.translate('Bitte am Braumeister bestätigen.'))}</p>`;
      }
      const keys = this.menuKeysFor(code);
      const result = {
        pending: 'Menüaktion läuft …', confirmed: 'Menüaktion bestätigt',
        expired: 'Menüaktion abgelaufen', unconfirmed: 'Menüaktion unbestätigt',
        state_changed: 'Gerätebildschirm hat gewechselt',
      };
      const hint = result[this.menuResult] || this.menuResult
        || (available ? 'Lokale Menünavigation' : 'Braumeister-Steuerung noch nicht verfügbar');
      // An explicitly mapped device-recipe sensor supplies the complete list.
      // The fresh Companion snapshot remains authoritative for the selected slot.
      const recipeState = this._hass?.states[this.ids.recipes];
      const details = recipeState && !['unknown', 'unavailable'].includes(recipeState.state)
        ? recipeState.attributes?.recipes : null;
      const deviceRecipes = Array.isArray(details) && details.length > 0 && details.length <= 9
        && details.every(r => Number.isInteger(r.slot) && r.slot >= 0 && r.slot < 9
          && typeof r.name === 'string' && r.name.trim())
        && new Set(details.map(r => r.slot)).size === details.length
        ? Object.fromEntries(details.map(r => [r.slot, r.name])) : null;
      const picker = code === 2015 && (deviceRecipes || this.picker)
        ? `<ol class="recipe-picker">${Object.entries(deviceRecipes || this.picker?.recipes || {}).sort(([a],[b]) => Number(a)-Number(b)).map(([slot,name]) =>
          `<li>${Number(slot) === this.picker?.slot ? `<mark>${esc(name)}</mark>` : esc(name)}</li>`).join('')}</ol>` : '';
      const actuators = this.actuatorActions();
      const temperatures = code === 4006 && this.showTemperatureReadings
        ? `<p>${esc(this.translate('Soll / Ist'))}: ${esc(this.number('target','°C'))} / ${esc(this.number('temperature','°C'))}</p>` : '';
      const paused = keys.some(key => key[2] === 'resume_program');
      const programNote = screen===3010 && ['0DT','0D0'].includes(this._hass.states[this.ids.step]?.attributes?.display_editor_flags) ? 'Bitte Deckel entfernen.' : paused ? 'Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.'
        : [2030,2111].includes(code) ? 'Startzeitvorwahl: Hoch +30 min, Ab −30 min.' : '';
      const unsupportedKeys = keys.some(key => key[2] && key[2] !== 'temperature_readings' && !this.actionService(key[2]));
      return `${picker}${temperatures}${programNote?`<p class="hint">${esc(this.translate(programNote))}</p>`:''}<div class="keys">${keys.map(([icon,label,menuAction]) => {
        const action = actuators[label] || menuAction;
        const enabled = action === 'temperature_readings' || (available && action && this.actionService(action));
        const animate = this.config.menu_pending_animation !== false
          && action && action === this.pendingMenuAction && this.menuResult === 'pending';
        const unsupported = action && !this.actionService(action);
        return `<div><button type="button" ${animate ? 'class="menu-pending"' : ''} aria-label="${esc(this.translate(label))}" ${unsupported ? `title="${esc(this.translate('Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.'))}"` : ''} data-menu="${action || ''}" ${enabled && !this.pending ? '' : 'disabled'}>${controlIcon(icon)}</button><small>${esc(this.translate(label))}</small></div>`;
      }).join('')}</div>${unsupportedKeys?`<p class="hint">${esc(this.translate('Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.'))}</p>`:''}<p class="hint" role="status">${esc(this.translate(hint))}</p>`;
    }
    renderRecipePlan(attrs, live) {
      const E=esc, T=key=>E(this.translate(key));
      const entity=this._hass.states[this.ids.recipes];
      const raw=entity && !['unknown','unavailable'].includes(entity.state) ? entity.attributes?.recipes : null;
      const recipes=Array.isArray(raw) && raw.length<=9 && raw.every(r=>r && Number.isInteger(r.slot) && r.slot>=0 && r.slot<9 && typeof r.name==='string' && r.name.trim())
        && new Set(raw.map(r=>r.slot)).size===raw.length ? raw : [];
      if(!recipes.length) return `<p class="hint">${T('Keine Geräterezeptdaten verfügbar. Rezept-Entität in der Kartenkonfiguration zuordnen.')}</p>`;
      const recipeSlot=this._hass.states[this.ids.recipe]?.attributes?.recipe_slot;
      const hasSlot=recipeSlot!==undefined && recipeSlot!==null;
      const matches=hasSlot
        ? recipes.filter(r=>Number.isInteger(recipeSlot) && r.slot===recipeSlot)
        : recipes.filter(r=>r.name.trim()===this.text('recipe').trim());
      const current=matches.length===1?matches[0]:null;
      const selected=this.previewRecipeSlot === undefined || this.previewRecipeSlot === '' ? current : recipes.find(r=>String(r.slot)===this.previewRecipeSlot);
      const picker=`<label>${T('Geräterezept ansehen')}<select id="recipe-plan"><option value="" ${this.previewRecipeSlot?'':'selected'}>${T('Aktuelles Rezept')}</option>${recipes.map(r=>`<option value="${r.slot}" ${String(r.slot)===this.previewRecipeSlot?'selected':''}>${E(r.name)}</option>`).join('')}</select></label>`;
      if(!selected) return picker+`<p class="hint">${T('Aktuelles Rezept nicht eindeutig zugeordnet. Bitte ein Geräterezept auswählen.')}</p>`;
      const value=(v,unit)=>typeof v==='number' && Number.isFinite(v) && v>=0?`${E(v)} ${unit}`:'—';
      const rests=Array.isArray(selected.rests)?selected.rests:[];
      const active=live && selected===current;
      const code=attrs.display_state_code;
      const item=(label,temp,time,isCurrent)=>`<li${isCurrent?' class="current" aria-current="step"':''}><strong>${E(label)}</strong><div>${T('Soll / Ist').split(' / ')[0]}: ${value(temp,'°C')}${time===undefined?'':` · ${value(time,'min')}`}</div></li>`;
      return picker+`<h3>${E(selected.name)}</h3><ol class="recipe-plan">${item(this.translate('Einmaischen'),selected.mash_in_temperature,undefined,active && code>=2030 && code<=2705)}${rests.map((r,i)=>item(this.translate('{number}. Rast').replace('{number}',i+1),r?.temperature,r?.minutes,active && [2810,2820].includes(code) && attrs.display_rest_number===i+1)).join('')}${item(this.translate('Hopfen kochen'),selected.boil_temperature,selected.boil_minutes,active && code>=3000 && code<4000)}</ol><p>${T('Hopfengaben · Minuten vor Kochende')}: ${Array.isArray(selected.hop_additions)?selected.hop_additions.filter(v=>typeof v==='number' && Number.isFinite(v) && v>=0).map(v=>E(v)).join(', ') || '—':'—'}</p><p class="hint">${T('Gespeicherter Geräteplan. Änderungen im laufenden Brauprozess können abweichen. Die Auswahl hier steuert das Gerät nicht.')}</p>`;
    }
    render(){
      if(!this.config || !this._hass) return;
      const E=esc, T=key=>E(this.translate(key)), off=this.state('plug')==='off';
      const heartbeatBlocked = this.ids.connection_warning && this.state('connection_warning') !== 'off';
      const lost = this.state('connection_warning') === 'on';
      const risk = lost && this._hass.states[this.ids.connection_warning]?.attributes?.activity_at_risk === true;
      const connectionNotice = heartbeatBlocked ? `<div class="notice connection-warning ${risk?'risk':''}" role="alert"><strong>${T(lost?'Verbindung zum Braumeister verloren':'Geräteverbindung noch nicht bestätigt')}</strong>${risk?`<p>${T('Zuletzt waren Brauprozess oder Heizfreigabe aktiv. Aktueller Gerätezustand unbekannt. Gerät vor Ort prüfen.')}</p>`:''}</div>` : '';
      const online=this.state('connection')==='online'&&!off&&!heartbeatBlocked;
      const reading=k=>online?this.number(k,this._hass.states[this.ids[k]]?.attributes?.unit_of_measurement || '°C'):'—';
      const attrs=this._hass.states[this.ids.step]?.attributes||{};
      const live=online && !['unknown','unavailable',undefined].includes(this.state('step'));
      const progressState = this.state('progress');
      const progressValue = typeof progressState === 'string' && progressState.trim() !== '' ? Number(progressState) : NaN;
      const progress = live && Number.isFinite(progressValue) && progressValue >= 0 && progressValue <= 100 ? progressValue : null;
      const progressBar = progress === null ? '' : `<div class="header-progress" role="progressbar" aria-label="${T('Gemeldeter Fortschritt')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}" title="${T('Gemeldeter Fortschritt')}: ${progress}%"><span style="width:${progress}%"></span></div>`;
      const programPaused = live && attrs.display_interrupt === 1
        && Number.isInteger(attrs.display_state_code) && attrs.display_state_code >= 2000 && attrs.display_state_code < 4000;
      const alarmType=this._hass.states[this.ids.alarm]?.attributes?.alarm_type;
      const attention=live && this.alarmActive()===true;
      const attentionKey=attention ? JSON.stringify([attrs.display_state_code,attrs.display_interrupt,alarmType]) : null;
      if(attentionKey && attentionKey!==this._attentionKey) this.page='display';
      this._attentionKey=attentionKey;
      const alarmFrame=programPaused || (attention && !['mash_in_temperature_reached','rest_end_reached','hop_addition','brew_finished'].includes(alarmType));
      const frost = !alarmFrame && this.frostWarning(live, attrs);
      this._frostVisible = frost;
      const frostNotice = frost ? `<div class="notice frost-notice" role="status">${T('Frostgefahr bei Startvorwahl. Bitte Braumeister und Pumpe prüfen.')}</div>` : '';
      const flag=k=>live?attrs[k==='pump'?'display_pump_flag':'display_heater_flag']:null;
      const brandIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="brand-icon" width="20" height="20" viewBox="0 0 256 256" aria-hidden="true" focusable="false">
  <path fill="#15393B" d="M64 0 H192 Q256 0 256 64 V192 Q256 256 192 256 H64 Q0 256 0 192 V64 Q0 0 64 0 Z"/>
  <path fill="#F6AD79" d="M96 76 C75 58 111 52 92 34 L102 27 C128 52 94 62 105 72 Z M129 76 C108 58 144 52 125 34 L135 27 C161 52 127 62 138 72 Z M162 76 C141 58 177 52 158 34 L168 27 C194 52 160 62 171 72 Z"/>
  <path fill="#FFF3DF" d="M99 86 H157 Q164 86 164 93 V101 H187 Q197 101 201 114 H55 Q59 101 69 101 H92 V93 Q92 86 99 86 Z M54 125 H202 V135 H221 V148 H200 V174 Q200 208 166 208 H90 Q56 208 56 174 V148 H35 V135 H54 Z M83 215 H173 V225 H83 Z"/>
  <path fill="#15393B" d="M88 151 H168 Q173 151 173 156 V178 Q173 183 168 183 H88 Q83 183 83 178 V156 Q83 151 88 151 Z"/>
  <path fill="#F6AD79" d="M94 165 H112 L120 157 L132 173 L140 165 H162 V170 H142 L131 180 L119 165 L114 170 H94 Z"/>
</svg>`;
      const badgeClass=k=>!online?'':flag(k)?(['P','H'].includes(flag(k))?'active':['q','i'].includes(flag(k))?'inactive':''):['Ein','on'].includes(this.state(k))?'active':'';
      const duration=v=>Number.isInteger(v)&&v>=0?`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`:'—';
      const targetTime=attrs.display_time_target_seconds;
      const targetLabel=Number.isInteger(targetTime)&&targetTime>=0?(targetTime%60?duration(targetTime):String(targetTime/60)):'—';
      const timed=live && Number.isInteger(attrs.display_state_code) && ((attrs.display_state_code>=2810 && attrs.display_state_code<2910) || attrs.display_state_code===3010);
      const timer=timed?`<div class="temp timer"><div>${T('Zeit')}<small>${T('Soll / Ist · verstrichen')}</small></div><strong>${targetLabel} / ${duration(attrs.display_time_elapsed_seconds)} min</strong></div>`:'';
      const delay = attrs.display_start_delay_seconds;
      const countdown = live && attrs.display_state_code === 2120
        ? `<div class="temp timer countdown"><div>${T('Braustart in')}<small>${T('Vom Gerät gemeldete Restzeit')}</small></div><strong>${Number.isInteger(delay) && delay >= 0 ? `${Math.floor(delay/3600)}:${String(Math.floor(delay/60)%60).padStart(2,'0')}:${String(delay%60).padStart(2,'0')}` : '—'}</strong></div>` : '';
      const editingRecipes=live && (attrs.display_state_code===6010 || (attrs.display_state_code==null && ['Statuscode 6010','Rezepte bearbeiten'].includes(this.state('step'))));
      const recipeEditHint=editingRecipes?`<p class="recipe-edit-hint">${T('Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.')}</p>`:'';
      const heading=live&&attrs.display_phase?[this.text('recipe'),this.translate(attrs.display_phase)].filter(v=>v!=='—').join(' – '):this.label('step');
      const badge=(k,label)=>`<button data-info="${k}" class="badge ${badgeClass(k)}" title="${label}: ${E(['q','i'].includes(flag(k))?this.translate('Inaktiv (Zwischenzustand)'):this.label(k))} (${T('Integrationsmeldung')})">${label}</button>`;
      const row=(label,key,unit)=>`<div class="row"><span>${T(label)}</span><button class="value" data-info="${key}">${E(unit?this.number(key,unit):this.label(key))}</button></div>`;
      const menuCode = this.config.menu_control === true && live ? attrs.display_state_code : null;
      const title={display:menuTitles[menuCode] ? this.translate(menuTitles[menuCode]) : heading,recipe:'Aktuelles Rezept',power:'Stromversorgung',details:'Gerätedaten'}[this.page];
      let body='';
      if(this.page==='display') body=`<h2>${E(this.config.title||'Speidels Braumeister')}</h2><div class="temp"><div>${T('Temp')}<small>${T('Soll / Ist')}</small></div><strong>${reading('target')} / ${reading('temperature')}</strong></div>${timer}${countdown}<p class="phase">${E(online?this.label('step'):this.translate(off?'Zwischenstecker ausgeschaltet':'Keine Online-Verbindung'))}</p>${recipeEditHint}<div class="sub">${E(this.text('recipe'))}</div>${this.config.menu_control === true ? this.renderMenu(live ? attrs.display_state_code : null) : `<div class="keys" aria-label="${T('Braumeister-Steuerung noch nicht verfügbar')}">${[['✕','Abbruch'],['P','Pumpe'],['H','Heizung'],['↕','Temperatur']].map(([icon,label])=>`<div><button disabled title="${T('Benötigt einen Steuerdienst der Integration')}">${controlIcon(icon)}</button><small>${T(label)}</small></div>`).join('')}</div><p class="hint">${T('Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar')}</p>`}`;
      if (this.page === 'display' && [8101, 6010, 2015].includes(menuCode)) {
        const menuHint = menuCode === 8101
          ? `<p>${T('Einstellungen können nur direkt am Braumeister geändert werden.')}</p>`
          : recipeEditHint;
        body = `<h2>${T(menuTitles[menuCode])}</h2>${menuHint}${this.renderMenu(menuCode)}`;
      }
      if(this.page==='recipe') body=`<h2>${E(this.text('recipe'))}</h2><div class="recipe-layout"><section>${row('Aktueller Schritt','step')}${row('Gemeldeter Fortschritt','progress','%')}${timer}${countdown}</section><section>${this.renderRecipePlan(attrs,live)}</section></div>`;
      if(this.page==='details') body=`<h2>Braumeister 20L Plus</h2>${row('Verbindung','connection')}${row('Modus','mode')}${row('Pumpe · gemeldet','pump')}${row('Heizung · gemeldet','heater')}<p class="hint">${T('P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.')}</p>`;
      if(this.page==='power') {
        const options=this._hass.states[this.ids.behavior]?.attributes.options||[];
        const available=['on','off'].includes(this.state('plug'));
        const disabled=this.pending||!available?'disabled':'';
        body=`<h2>${T('Zwischenstecker')}</h2>${row('Schaltzustand','plug')}${row('Gesamtleistung','power','W')}<div class="power-buttons"><button data-power="turn_on" ${disabled}>${T('Einschalten')}</button><button data-power="turn_off" ${disabled}>${T('Ausschalten')}</button></div><label>${T('Nach Stromausfall')}<select id="behavior" ${this.pending||!options.length?'disabled':''}><option disabled ${!options.includes(this.state('behavior'))?'selected':''}>${T('Bitte wählen')}</option>${options.map(o=>`<option value="${E(o)}" ${this.state('behavior')===o?'selected':''}>${T(({on:'Ein',off:'Aus',previous:'Vorheriger Zustand',toggle:'Zustand umkehren'})[o]||o)}</option>`).join('')}</select></label><p class="hint">${T('Schaltet die gesamte Stromversorgung des Braumeisters.')}</p>`;
      }
      const frostButtons = frost && this.config.frost_button_style !== false;
      const lighting = frostButtons ? '#00cfff' : off ? 'off' : lightingValue(this.config.button_color);
      const ringColor=lighting==='off'?'#666666':lighting==='default'?'#f4f4f4':lighting;
      this.shadowRoot.innerHTML=`<style>
        .keys button.menu-pending { position: relative; opacity: 1; }
        .menu-pending::after {
          content: ""; position: absolute; inset: 3px; border: 3px solid #fff7c4;
          border-top-color: #805d00; border-radius: 50%; pointer-events: none;
          animation: menu-pending-spin 850ms linear infinite;
        }
        @keyframes menu-pending-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .menu-pending::after { animation: none; }
        }
      :host{display:block;color:#080808;font-family:Arial,sans-serif;container-type:inline-size}*{box-sizing:border-box}
      ha-card{display:block;background:linear-gradient(135deg,#505050,#060606);padding:clamp(14px,5cqw,34px);border-radius:16px;color:#080808;overflow:hidden}
      .screen{background:#f4f4f4;box-shadow:inset 0 0 15px #999;min-height:0}
      .screen.frost{outline:3px solid #1565c0;box-shadow:inset 0 0 12px #90caf9}
      .screen .frost-notice{background:#dceeff;color:#103c68}
      .frost-buttons .keys button{
        border-radius:50%;border:1px solid #079cc5;color:#06516d;
        background:
          linear-gradient(115deg,transparent 24%,#ffffff52 25% 30%,transparent 31% 64%,#ffffff38 65% 70%,transparent 71%),
          radial-gradient(ellipse at 44% 20%,#e8fdff 0%,#a4eefa 48%,#55cfe8 76%,#13b6dc 100%);
        box-shadow:inset 0 -4px 0 #009dc7,inset 0 0 0 2px #e6fcff,0 1px 2px #06496059;
      }
      .frost-buttons .keys .control-icon{
        stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round;
        filter:drop-shadow(0 1px 0 #fff);
      }
      .frost-buttons .keys button:disabled{opacity:.4;filter:saturate(.4)}
      .frost-buttons .keys button.menu-pending{opacity:1}
      .frost-buttons .menu-pending::after{border-color:#e6fcff;border-top-color:#06516d}
      .screen.program-paused{outline:3px solid #b00020;box-shadow:inset 0 0 18px #e66868}
      .screen.program-paused.pulse{animation:program-pause-pulse 1.4s ease-in-out infinite}
      @keyframes program-pause-pulse{50%{box-shadow:inset 0 0 30px #cf3030;outline-color:#ff6565}}
      @media(prefers-reduced-motion:reduce){.screen.program-paused.pulse{animation:none}}
      header{position:relative;display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:6px solid black;font-size:13px;min-height:49px}.header-progress{position:absolute;left:0;right:0;bottom:-6px;height:6px;background:#000;overflow:hidden}.header-progress span{display:block;height:100%;background:#ffe000}header .brand-icon{flex:none}header .title{flex:1;overflow-wrap:anywhere}
      button,select{font:inherit}button{cursor:pointer;border:0}button:focus-visible,select:focus-visible{outline:3px solid #008bd2;outline-offset:3px}
      .badge{border:2px solid black;background:transparent;padding:2px 5px;color:black}.badge.active{background:#ffda16}.badge.inactive{background:linear-gradient(45deg,#f4f4f4 50%,#ffda16 50%)}.timer{margin-top:24px}
      main{padding:22px clamp(14px,4cqw,28px);min-height:clamp(220px,48cqw,290px)}h2{font-size:clamp(20px,5cqw,34px);margin:4px 0 26px;overflow-wrap:anywhere}
      .temp{display:flex;justify-content:space-between;gap:12px;font-size:clamp(19px,4.6cqw,32px);font-weight:bold}.temp strong{text-align:right}.temp small{font-size:12px;display:block;font-weight:normal;margin-top:6px}
      .phase{font-size:clamp(19px,4cqw,28px);font-weight:bold;margin:24px 0 8px;overflow-wrap:anywhere}.sub{font-size:14px}
      .recipe-picker{display:grid;grid-auto-flow:column;grid-template-rows:repeat(5,auto);grid-auto-columns:minmax(0,1fr);gap:6px clamp(10px,4cqw,24px);list-style:none;margin:0;padding:0;text-align:left}.recipe-picker li{min-width:0;overflow-wrap:anywhere}.recipe-picker mark{background:#ffda16;color:#000}
      .recipe-layout{display:grid;gap:24px}.recipe-layout section{min-width:0}.recipe-plan{list-style:none;padding:0 0 0 12px;border-left:3px solid #aaa}.recipe-plan li{padding:10px 12px;line-height:1.6;font-size:14px}.recipe-plan li.current{background:#ffe000;border-left:4px solid #000}.recipe-layout h3{overflow-wrap:anywhere}.recipe-layout p{font-size:13px;line-height:1.5}@container(min-width:780px){.recipe-layout{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
      .keys{display:flex;justify-content:space-between;gap:8px;margin-top:32px;text-align:center}.keys>div{min-width:0}.control-icon{display:block;width:1em;height:1em;flex:none}.keys button{display:grid;place-items:center;padding:0;line-height:1;background:#ffda16;border-radius:10px;font-size:clamp(26px,8cqw,42px);font-weight:bold;width:clamp(40px,12cqw,64px);height:clamp(40px,12cqw,64px);color:black}.keys button:disabled{opacity:.4;cursor:not-allowed}small{display:block;font-size:11px;margin-top:7px}
      .hint{font-size:12px;line-height:1.5;color:#555;margin:20px 0 0}.row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #ddd;font-size:14px}.value{background:transparent;color:black;font-weight:bold;text-align:right;overflow-wrap:anywhere;max-width:65%}
      footer{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:24px}footer button{color:white;background:none;padding:0;font-size:11px}footer .ring{display:grid;place-items:center;margin:0 auto 10px;width:clamp(42px,11cqw,74px);height:clamp(42px,11cqw,74px);aspect-ratio:1;border:5px solid ${ringColor};border-radius:50%;font-size:22px}footer button[aria-pressed=true] .ring{border-color:${lighting==='default'?'#ffda16':ringColor};background:black;color:${lighting==='default'?'#ffda16':'white'}}footer button[aria-pressed=true]{text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:2px}
      .power-buttons{display:flex;gap:12px;margin:20px 0}.power-buttons button{padding:14px;background:#ffda16;border-radius:8px;color:black;flex:1;font-weight:bold}.power-buttons button:disabled{opacity:.4;cursor:not-allowed}label{display:block;font-size:14px}select{display:block;width:100%;margin-top:8px;padding:12px;background:white;color:black;border:1px solid #888;border-radius:6px}.notice{padding:10px 16px;background:#ffda16;font-size:13px}.connection-warning.risk{background:#ffd3d3;color:#700;border:2px solid #b00020}.error{background:#ffd3d3;padding:12px;overflow-wrap:anywhere}
      </style><ha-card${frostButtons ? ' class="frost-buttons"' : ''}><div class="screen${alarmFrame?` program-paused${this.config.program_alarm_animation !== false ? ' pulse' : ''}`:frost?' frost':''}"><header>${brandIcon}<span class="title">${T(title)}</span>${live&&attrs.display_clock?`<time title="${T('Vom Braumeister gemeldete Uhrzeit')}">${E(attrs.display_clock)}</time>`:''}${badge('pump','P')}${badge('heater','H')}${progressBar}</header>${connectionNotice}${frostNotice}${this.config.alarm_sound === true ? `<div class="hint"><button type="button" data-audio="test">${T("Ton testen / freigeben")}</button>${this.alarmActive() === true && !this._alarmMuted ? `<button type="button" data-audio="mute">${T("Ton stummschalten")}</button>` : ""}${this.audioError ? `<p role="alert">${T("Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.")}</p>` : ""}</div>` : ""}${this.state('alarm')==='on'?`<div class="notice">${T(['mash_in_temperature_reached','rest_end_reached','hop_addition','brew_finished'].includes(this._hass.states[this.ids.alarm]?.attributes?.alarm_type) && !programPaused ? 'Hinweis vom Braumeister' : 'Alarm vom Braumeister gemeldet')}</div>`:''}<main>${body}</main>${this.error?`<div class="error" role="alert">${T(this.error)}</div>`:''}</div><footer>${[['display','▣','Display'],['recipe','☷','Rezept'],['power','⏻','Strom'],['details','ⓘ','Status']].map(([p,i,t])=>`<button data-page="${p}" aria-pressed="${this.page===p}"><span class="ring">${controlIcon(i)}</span>${T(t)}</button>`).join('')}</footer></ha-card>`;
    }
  }
  class BraumeisterDisplayEditor extends HTMLElement {
    constructor(){
      super(); this.attachShadow({mode:'open'});
      this.shadowRoot.addEventListener('click',event=>{
        if(event.target.closest('button[data-audio]')) { this.testAlarmAudio(); return; }
        const button=event.target.closest('button[data-color]');
        if(button) this.updateColor(button.dataset.color);
      });
      this.shadowRoot.addEventListener('change',event=>{
        const field = event.target.dataset?.frostSetting;
        if (field) {
          if (field === 'enabled') this.config = {...this.config, frost_enabled: event.target.checked};
          else if (field === 'button-style') this.config = {...this.config, frost_button_style: event.target.checked};
          else if (field === 'threshold' && event.target.validity.valid && Number.isFinite(event.target.valueAsNumber))
            this.config = {...this.config, frost_threshold: event.target.valueAsNumber};
          else if (field === 'timer') {
            const id = event.target.value.trim();
            if (id && !/^timer\.[a-z0-9_]+$/.test(id)) return;
            this.config = {...this.config, entities: {...this.config.entities, frost_timer: id}};
          } else return;
          this.render();
          this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this.config}},bubbles:true,composed:true}));
          return;
        }
        const key=event.target.dataset?.audioSetting;
        if(!['alarm_sound','alarm_repeat','alarm_sound_url','alarm_volume'].includes(key)) return;
        const value=['alarm_sound','alarm_repeat'].includes(key)?event.target.checked:key==='alarm_volume'?Number(event.target.value):event.target.value;
        this.config={...this.config,[key]:value};
        alarmAudio.stop();
        this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this.config}},bubbles:true,composed:true}));
      });
      this.shadowRoot.addEventListener('input',event=>{
        if(event.target.id==='picker') this.updateColor(event.target.value, false);
        if(event.target.id==='hex') {
          const valid=/^#[0-9a-f]{6}$/i.test(event.target.value);
          event.target.setCustomValidity(valid?'':this.translate('Bitte #RRGGBB eingeben.'));
          event.target.setAttribute('aria-invalid',String(!valid));
          if(valid) this.updateColor(event.target.value, false);
        }
      });
    }
    setConfig(config){
      // HA can echo config-changed while the native picker is still open.
      if(this.config && JSON.stringify(config)===JSON.stringify(this.config)) return;
      this.config={...config};this.refreshLanguage();this.render();
    }
    set hass(value){
      const first = !this._hass;
      this._hass=value;
      this.refreshLanguage();
      if (first && this.config?.frost_enabled) this.render();
    }
    refreshLanguage(){BraumeisterDisplay.prototype.refreshLanguage.call(this);}
    translate(key,params){return BraumeisterDisplay.prototype.translate.call(this,key,params);}
    async testAlarmAudio(){return BraumeisterDisplay.prototype.testAlarmAudio.call(this);}
    disconnectedCallback(){alarmAudio.stop();}
    updateColor(value, redraw=true){
      const color=lightingValue(value);
      this.config={...this.config,button_color:color};
      if(redraw) this.render();
      else {
        // Keep the native picker and text field mounted while typing/dragging.
        for(const button of this.shadowRoot.querySelectorAll('[data-color]')) button.setAttribute('aria-pressed',String(button.dataset.color===color));
        const hex=this.shadowRoot.querySelector('#hex'), picker=this.shadowRoot.querySelector('#picker');
        if(hex.value.toLowerCase()!==color) hex.value=color;
        hex.setCustomValidity('');hex.setAttribute('aria-invalid','false');
        picker.value=color;
      }
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this.config}},bubbles:true,composed:true}));
    }
    render(){
      if(!this.config) return;
      const T=key=>esc(this.translate(key)), color=lightingValue(this.config.button_color);
      const custom=color.startsWith('#')?color:'#ffda16';
      this.shadowRoot.innerHTML=`<style>
        :host{display:block}fieldset{border:1px solid var(--divider-color,#888);border-radius:8px;padding:16px}
        .palette{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}button,input{font:inherit}
        button{cursor:pointer;background:var(--card-background-color,white);color:var(--primary-text-color,black);border:2px solid #888;border-radius:6px;padding:8px}
        .swatch{width:40px;height:40px;border-radius:50%;background:var(--swatch)}
        button[aria-pressed=true]{outline:3px solid var(--primary-color,#008bd2);outline-offset:3px}
        button:focus-visible,input:focus-visible{outline:3px dashed var(--primary-color,#008bd2);outline-offset:3px}
        label{display:block;margin:12px 0 6px}input[type=text]{width:140px;padding:8px}input[type=color]{width:64px;height:40px;vertical-align:middle}
        p{font-size:13px;line-height:1.5}input[aria-invalid=true]{border:2px solid #c62828}
      </style><h3>${T('Darstellung')}</h3><fieldset><legend>${T('Tastenbeleuchtung')}</legend>
        <div class="palette">${[['Standard','default'],['Licht aus','off']].map(([name,value])=>`<button type="button" data-color="${value}" aria-pressed="${color===value}">${T(name)}</button>`).join('')}</div>
        <div class="palette">${presets.map(([name,value])=>`<button type="button" class="swatch" style="--swatch:${value}" data-color="${value}" title="${T(name)}" aria-label="${T(name)}" aria-pressed="${color===value}"></button>`).join('')}</div>
        <label for="picker">${T('Eigene Farbe')}</label><input id="picker" type="color" value="${custom}">
        <label for="hex">${T('HEX-Farbe')}</label><input id="hex" type="text" value="${custom}" pattern="#[0-9a-fA-F]{6}" maxlength="7" spellcheck="false" aria-describedby="hex-help"><p id="hex-help">${T('Bitte #RRGGBB eingeben.')}</p>
        <p>${T('Nur die Tastenringe dieser Karte ändern sich.')}</p></fieldset>
      <fieldset><legend>${T('Frostschutz')}</legend>
        <label><input type="checkbox" data-frost-setting="enabled" ${this.config.frost_enabled === true ? 'checked' : ''}> ${T('Bei Startvorwahl vor Frost warnen')}</label>
        ${this.config.frost_enabled === true ? `<label><input type="checkbox" data-frost-setting="button-style" ${this.config.frost_button_style !== false ? 'checked' : ''}> ${T('Bei Frostwarnung Tasten in Eisoptik anzeigen')}</label>
          <label>${T('Warntemperatur des Wassers')} (°C)
          <input type="number" min="0" max="10" step="0.5" required data-frost-setting="threshold" value="${esc(this.config.frost_threshold ?? 3)}" ${this.config.entities?.frost_timer ? 'disabled' : ''}></label>
          <label>${T('Warntimer der HA-Automation (optional)')} <input type="text" list="frost-timers" data-frost-setting="timer" value="${esc(this.config.entities?.frost_timer || '')}" placeholder="timer.braumeister_frost"></label>
          <datalist id="frost-timers">${Object.keys(this._hass?.states || {}).filter(id=>id.startsWith('timer.')).map(id=>`<option value="${esc(id)}"></option>`).join('')}</datalist>` : ''}
      </fieldset><fieldset><legend>${T('Alarmton')}</legend>
      <label><input type="checkbox" data-audio-setting="alarm_sound" ${this.config.alarm_sound === true ? 'checked' : ''}> ${T('Ton bei Alarm / Pause')}</label>
      <label><input type="checkbox" data-audio-setting="alarm_repeat" ${this.config.alarm_repeat !== false ? 'checked' : ''}> ${T('Bis zur Quittierung wiederholen')}</label>
      <label>${T('Sound-URL (leer: Signalton)')}<input type="url" data-audio-setting="alarm_sound_url" value="${esc(this.config.alarm_sound_url || '')}" placeholder="/local/sounds/alarm.mp3"></label>
      <label>${T('Lautstärke')}<input type="range" min="0" max="100" step="1" data-audio-setting="alarm_volume" value="${esc(this.config.alarm_volume ?? 50)}"></label>
      <button type="button" data-audio="test">${T('Ton testen / freigeben')}</button>
      <p>${T('Wiederholung alle 6 Sekunden bis zur Quittierung am Gerät oder Stummschaltung. Auf diesem Gerät zuerst den Ton testen.')}</p>
      ${this.audioError ? `<p role="alert">${T('Ton nicht verfügbar. Bitte Ton testen und Browserfreigabe prüfen.')}</p>` : ''}</fieldset>`;
    }
  }
  if(!customElements.get('braumeister-display-card-editor')) customElements.define('braumeister-display-card-editor',BraumeisterDisplayEditor);
  if(!customElements.get('braumeister-display-card')) customElements.define('braumeister-display-card',BraumeisterDisplay);
  window.customCards=window.customCards||[];
  window.customCards.push({type:'braumeister-display-card',name:'Braumeister Display',description:'Live display and smart plug, version 0.7.0-beta.39'});
})();
