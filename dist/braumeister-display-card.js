/* Braumeister Display 0.7.0-beta.5 — native HA telemetry card, no cloud credentials. */
(() => {
  // Entity IDs depend on the installation; configure them in the card YAML.
  const defaults = Object.fromEntries(['temperature', 'target', 'step', 'recipe', 'mode', 'connection', 'pump', 'heater', 'progress', 'time', 'alarm', 'plug', 'power', 'behavior'].map(key => [key, '']));
  const menuKeys = {
    101: [['⚙','Einstellungen','open_settings'], ['☛','Manuell','open_manual'],
      ['▶','Braustart','open_recipe_selection'], ['☰','Rezept','open_recipe_list']],
    8101: [['✕','Abbruch','close_settings']],
    4006: [['✕','Abbruch','close_manual'], ['P','Pumpe'], ['H','Heizung'], ['↕','Temperatur','temperature_readings']],
    6010: [['✕','Abbruch','close_recipe_list']],
    2015: [['✕','Abbruch','cancel_recipe_selection'], ['⌄','Ab','recipe_down'], ['⌃','Hoch','recipe_up']],
  };
  const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Only presentation is localized. Backend values, attributes and commands stay intact.
  const menuTitles = {101: 'Hauptmenü', 8101: 'Einstellungen', 4006: 'Manueller Betrieb',
    6010: 'Rezepte bearbeiten', 2015: 'Rezept auswählen'};
  const ENGLISH = {
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
  "Gemeldete Zeit¹": "Reported time¹",
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
  "¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.": "¹ Time reported by the integration; not yet verified as remaining time. The available entities do not provide a recipe list or mash schedule.",
  "P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.": "P/H show the values reported by the integration. Correct XHR states require the parser fix from PR #8."
};
  Object.assign(ENGLISH, {"Darstellung": "Appearance", "Tastenbeleuchtung": "Button lighting", "Standard": "Default", "Licht aus": "Lights off", "Eigene Farbe": "Custom color", "HEX-Farbe": "HEX color", "Rot": "Red", "Orange": "Orange", "Gelb": "Yellow", "Grün": "Green", "Cyan": "Cyan", "Blau": "Blue", "Magenta": "Magenta", "Weiß": "White", "Nur die Tastenringe dieser Karte ändern sich.": "Only the button rings on this card change.", "Bitte #RRGGBB eingeben.": "Enter #RRGGBB."});
  const BUNDLED_LANGUAGES = {"de":{"Manuell":"Manuell","Braustart":"Braustart","Rezept auswählen":"Rezept auswählen","Ab":"Ab","Hoch":"Hoch","Lokale Menünavigation":"Lokale Menünavigation","Menüaktion läuft …":"Menüaktion läuft …","Menüaktion bestätigt":"Menüaktion bestätigt","Menüaktion abgelaufen":"Menüaktion abgelaufen","Menüaktion unbestätigt":"Menüaktion unbestätigt","Gerätebildschirm hat gewechselt":"Gerätebildschirm hat gewechselt","Einstellungen können nur direkt am Braumeister geändert werden.":"Einstellungen können nur direkt am Braumeister geändert werden.","Zeit":"Zeit","Soll / Ist":"Soll / Ist","Soll / Ist · verstrichen":"Soll / Ist · verstrichen","Temp":"Temp","Abbruch":"Abbruch","Pumpe":"Pumpe","Heizung":"Heizung","Temperatur":"Temperatur","Braumeister-Steuerung noch nicht verfügbar":"Braumeister-Steuerung noch nicht verfügbar","Benötigt einen Steuerdienst der Integration":"Benötigt einen Steuerdienst der Integration","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar","Zwischenstecker ausgeschaltet":"Zwischenstecker ausgeschaltet","Keine Online-Verbindung":"Keine Online-Verbindung","Inaktiv (Zwischenzustand)":"Inaktiv (Zwischenzustand)","Integrationsmeldung":"Integrationsmeldung","Aktuelles Rezept":"Aktuelles Rezept","Stromversorgung":"Stromversorgung","Gerätedaten":"Gerätedaten","Aktueller Schritt":"Aktueller Schritt","Gemeldeter Fortschritt":"Gemeldeter Fortschritt","Gemeldete Zeit¹":"Gemeldete Zeit¹","Verbindung":"Verbindung","Modus":"Modus","Pumpe · gemeldet":"Pumpe · gemeldet","Heizung · gemeldet":"Heizung · gemeldet","Zwischenstecker":"Zwischenstecker","Schaltzustand":"Schaltzustand","Gesamtleistung":"Gesamtleistung","Einschalten":"Einschalten","Ausschalten":"Ausschalten","Nach Stromausfall":"Nach Stromausfall","Bitte wählen":"Bitte wählen","Ein":"Ein","Aus":"Aus","Vorheriger Zustand":"Vorheriger Zustand","Zustand umkehren":"Zustand umkehren","Schaltet die gesamte Stromversorgung des Braumeisters.":"Schaltet die gesamte Stromversorgung des Braumeisters.","Vom Braumeister gemeldete Uhrzeit":"Vom Braumeister gemeldete Uhrzeit","Alarm vom Braumeister gemeldet":"Alarm vom Braumeister gemeldet","Aktion fehlgeschlagen":"Aktion fehlgeschlagen","Display":"Display","Rezept":"Rezept","Strom":"Strom","Status":"Status","Hauptmenü":"Hauptmenü","Einmaischen":"Einmaischen","Wasser eingefüllt?":"Wasser eingefüllt?","Pumpe wird entlüftet":"Pumpe wird entlüftet","Aufheizen":"Aufheizen","Pumpenabschaltung":"Pumpenabschaltung","Einmaischtemperatur erreicht":"Einmaischtemperatur erreicht","Malz einfüllen!":"Malz einfüllen!","Malz eingefüllt?":"Malz eingefüllt?","Rast":"Rast","{number}. Rast":"{number}. Rast","Pumpenpause":"Pumpenpause","Maischen":"Maischen","Rastende erreicht":"Rastende erreicht","Läutern":"Läutern","Malzrohr entnehmen!":"Malzrohr entnehmen!","Hopfen kochen":"Hopfen kochen","Start Hopfenkochen?":"Start Hopfenkochen?","Aufheizen zum Kochen":"Aufheizen zum Kochen","Hopfen zugeben":"Hopfen zugeben","Hopfen zugeben – {number}. Hopfengabe":"Hopfen zugeben – {number}. Hopfengabe","Hopfenzugabe":"Hopfenzugabe","Nächste Hopfengabe in {number} Minuten.":"Nächste Hopfengabe in {number} Minuten.","Brauvorgang beendet":"Brauvorgang beendet","Jetzt Whirlpool …":"Jetzt Whirlpool …","Prost!":"Prost!","Manueller Betrieb":"Manueller Betrieb","Einstellungen":"Einstellungen","Temperaturfehler":"Temperaturfehler","Bitte Deckel entfernen.":"Bitte Deckel entfernen.","Automatik angehalten":"Automatik angehalten","Status unbekannt":"Status unbekannt","Statuscode {number}":"Statuscode {number}","online":"online","offline":"offline","automatic":"Automatik","manual":"Manuell","waiting":"Wartet","on":"Ein","off":"Aus","previous":"Vorheriger Zustand","toggle":"Zustand umkehren","wartet":"Wartet","¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.":"¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.","Rezepte bearbeiten":"Rezepte bearbeiten","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.","Darstellung":"Darstellung","Tastenbeleuchtung":"Tastenbeleuchtung","Standard":"Standard","Licht aus":"Licht aus","Eigene Farbe":"Eigene Farbe","HEX-Farbe":"HEX-Farbe","Rot":"Rot","Orange":"Orange","Gelb":"Gelb","Grün":"Grün","Cyan":"Cyan","Blau":"Blau","Magenta":"Magenta","Weiß":"Weiß","Nur die Tastenringe dieser Karte ändern sich.":"Nur die Tastenringe dieser Karte ändern sich.","Bitte #RRGGBB eingeben.":"Bitte #RRGGBB eingeben."},"en-US":{"Manuell":"Manual","Braustart":"Brew start","Rezept auswählen":"Select recipe","Ab":"Down","Hoch":"Up","Lokale Menünavigation":"Local menu navigation","Menüaktion läuft …":"Menu action pending…","Menüaktion bestätigt":"Menu action confirmed","Menüaktion abgelaufen":"Menu action expired","Menüaktion unbestätigt":"Menu action unconfirmed","Gerätebildschirm hat gewechselt":"Device screen changed","Einstellungen können nur direkt am Braumeister geändert werden.":"Settings can only be changed directly on the Braumeister.","Zeit":"Time","Soll / Ist":"Target / Actual","Soll / Ist · verstrichen":"Target / Actual · elapsed","Temp":"Temp","Abbruch":"Cancel","Pumpe":"Pump","Heizung":"Heating","Temperatur":"Temperature","Braumeister-Steuerung noch nicht verfügbar":"Braumeister controls are not available yet","Benötigt einen Steuerdienst der Integration":"Requires a control action from the integration","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Live display · Braumeister controls are not available yet","Zwischenstecker ausgeschaltet":"Smart plug is off","Keine Online-Verbindung":"No online connection","Inaktiv (Zwischenzustand)":"Inactive (intermediate state)","Integrationsmeldung":"Reported by integration","Aktuelles Rezept":"Current recipe","Stromversorgung":"Power supply","Gerätedaten":"Device details","Aktueller Schritt":"Current step","Gemeldeter Fortschritt":"Reported progress","Gemeldete Zeit¹":"Reported time¹","Verbindung":"Connection","Modus":"Mode","Pumpe · gemeldet":"Pump · reported","Heizung · gemeldet":"Heating · reported","Zwischenstecker":"Smart plug","Schaltzustand":"Switch state","Gesamtleistung":"Total power","Einschalten":"Turn on","Ausschalten":"Turn off","Nach Stromausfall":"After power loss","Bitte wählen":"Select an option","Ein":"On","Aus":"Off","Vorheriger Zustand":"Previous state","Zustand umkehren":"Toggle state","Schaltet die gesamte Stromversorgung des Braumeisters.":"Switches the entire Braumeister power supply.","Vom Braumeister gemeldete Uhrzeit":"Time reported by the Braumeister","Alarm vom Braumeister gemeldet":"Alarm reported by the Braumeister","Aktion fehlgeschlagen":"Action failed","Display":"Display","Rezept":"Recipe","Strom":"Power","Status":"Status","Hauptmenü":"Main menu","Einmaischen":"Mash-in","Wasser eingefüllt?":"Water added?","Pumpe wird entlüftet":"Purging air from pump","Aufheizen":"Heating up","Pumpenabschaltung":"Pump shutdown","Einmaischtemperatur erreicht":"Mash-in temperature reached","Malz einfüllen!":"Add malt!","Malz eingefüllt?":"Malt added?","Rast":"Mash rest","{number}. Rast":"Mash rest {number}","Pumpenpause":"Pump pause","Maischen":"Mashing","Rastende erreicht":"Mash rest complete","Läutern":"Lautering","Malzrohr entnehmen!":"Remove malt pipe!","Hopfen kochen":"Boiling","Start Hopfenkochen?":"Start boiling?","Aufheizen zum Kochen":"Heating to a boil","Hopfen zugeben":"Add hops","Hopfen zugeben – {number}. Hopfengabe":"Add hops – addition {number}","Hopfenzugabe":"Hop addition","Nächste Hopfengabe in {number} Minuten.":"Next hop addition in {number} minutes.","Brauvorgang beendet":"Brewing complete","Jetzt Whirlpool …":"Start whirlpool now …","Prost!":"Cheers!","Manueller Betrieb":"Manual operation","Einstellungen":"Settings","Temperaturfehler":"Temperature error","Bitte Deckel entfernen.":"Please remove the lid.","Automatik angehalten":"Automatic process paused","Status unbekannt":"Unknown status","Statuscode {number}":"Status code {number}","online":"Online","offline":"Offline","automatic":"Automatic","manual":"Manual","waiting":"Waiting","on":"On","off":"Off","previous":"Previous state","toggle":"Toggle state","wartet":"Waiting","¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.":"¹ Time reported by the integration; not yet verified as remaining time. The available entities do not provide a recipe list or mash schedule.","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H show the values reported by the integration. Correct XHR states require the parser fix from PR #8.","Rezepte bearbeiten":"Edit recipes","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Recipes can only be edited on myspeidel.com or directly on the Braumeister.","Darstellung":"Appearance","Tastenbeleuchtung":"Button lighting","Standard":"Default","Licht aus":"Lights off","Eigene Farbe":"Custom color","HEX-Farbe":"HEX color","Rot":"Red","Orange":"Orange","Gelb":"Yellow","Grün":"Green","Cyan":"Cyan","Blau":"Blue","Magenta":"Magenta","Weiß":"White","Nur die Tastenringe dieser Karte ändern sich.":"Only the button rings on this card change.","Bitte #RRGGBB eingeben.":"Enter #RRGGBB."},"es":{"Manuell":"Manual","Braustart":"Iniciar elaboración","Rezept auswählen":"Seleccionar receta","Ab":"Abajo","Hoch":"Arriba","Lokale Menünavigation":"Navegación local por el menú","Menüaktion läuft …":"Acción de menú pendiente…","Menüaktion bestätigt":"Acción de menú confirmada","Menüaktion abgelaufen":"Acción de menú caducada","Menüaktion unbestätigt":"Acción de menú sin confirmar","Gerätebildschirm hat gewechselt":"La pantalla del equipo ha cambiado","Einstellungen können nur direkt am Braumeister geändert werden.":"Los ajustes solo se pueden cambiar directamente en el Braumeister.","Zeit":"Tiempo","Soll / Ist":"Objetivo / Actual","Soll / Ist · verstrichen":"Objetivo / Actual · transcurrido","Temp":"Temp","Abbruch":"Cancelar","Pumpe":"Bomba","Heizung":"Calefacción","Temperatur":"Temperatura","Braumeister-Steuerung noch nicht verfügbar":"Control del Braumeister aún no disponible","Benötigt einen Steuerdienst der Integration":"Requiere una acción de control de la integración","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Vista en directo · Control del Braumeister aún no disponible","Zwischenstecker ausgeschaltet":"Enchufe inteligente apagado","Keine Online-Verbindung":"Sin conexión","Inaktiv (Zwischenzustand)":"Inactivo (estado intermedio)","Integrationsmeldung":"Informado por la integración","Aktuelles Rezept":"Receta actual","Stromversorgung":"Alimentación eléctrica","Gerätedaten":"Datos del dispositivo","Aktueller Schritt":"Paso actual","Gemeldeter Fortschritt":"Progreso informado","Gemeldete Zeit¹":"Tiempo informado¹","Verbindung":"Conexión","Modus":"Modo","Pumpe · gemeldet":"Bomba · informada","Heizung · gemeldet":"Calefacción · informada","Zwischenstecker":"Enchufe inteligente","Schaltzustand":"Estado del interruptor","Gesamtleistung":"Potencia total","Einschalten":"Encender","Ausschalten":"Apagar","Nach Stromausfall":"Tras un corte de energía","Bitte wählen":"Seleccione una opción","Ein":"Encendido","Aus":"Apagado","Vorheriger Zustand":"Estado anterior","Zustand umkehren":"Invertir estado","Schaltet die gesamte Stromversorgung des Braumeisters.":"Controla toda la alimentación del Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Hora informada por el Braumeister","Alarm vom Braumeister gemeldet":"Alarma informada por el Braumeister","Aktion fehlgeschlagen":"Acción fallida","Display":"Pantalla","Rezept":"Receta","Strom":"Alimentación","Status":"Estado","Hauptmenü":"Menú principal","Einmaischen":"Empaste","Wasser eingefüllt?":"¿Agua añadida?","Pumpe wird entlüftet":"Purgando la bomba","Aufheizen":"Calentando","Pumpenabschaltung":"Parada de la bomba","Einmaischtemperatur erreicht":"Temperatura de empaste alcanzada","Malz einfüllen!":"¡Añadir malta!","Malz eingefüllt?":"¿Malta añadida?","Rast":"Descanso de maceración","{number}. Rast":"Descanso {number}","Pumpenpause":"Pausa de la bomba","Maischen":"Maceración","Rastende erreicht":"Descanso completado","Läutern":"Filtrado","Malzrohr entnehmen!":"¡Retirar el tubo de malta!","Hopfen kochen":"Hervido","Start Hopfenkochen?":"¿Iniciar hervido?","Aufheizen zum Kochen":"Calentando hasta hervir","Hopfen zugeben":"Añadir lúpulo","Hopfen zugeben – {number}. Hopfengabe":"Añadir lúpulo – adición {number}","Hopfenzugabe":"Adición de lúpulo","Nächste Hopfengabe in {number} Minuten.":"Próxima adición de lúpulo en {number} minutos.","Brauvorgang beendet":"Elaboración terminada","Jetzt Whirlpool …":"Iniciar whirlpool …","Prost!":"¡Salud!","Manueller Betrieb":"Funcionamiento manual","Einstellungen":"Ajustes","Temperaturfehler":"Error de temperatura","Bitte Deckel entfernen.":"Retire la tapa.","Automatik angehalten":"Proceso automático pausado","Status unbekannt":"Estado desconocido","Statuscode {number}":"Código de estado {number}","online":"En línea","offline":"Sin conexión","automatic":"Automático","manual":"Manual","waiting":"En espera","on":"Encendido","off":"Apagado","previous":"Estado anterior","toggle":"Invertir estado","wartet":"En espera","¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.":"¹ Tiempo informado por la integración; aún no verificado como tiempo restante. Las entidades disponibles no proporcionan recetas ni programa de maceración.","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H muestran los valores de la integración. Los estados XHR correctos requieren la corrección del analizador de la PR #8.","Rezepte bearbeiten":"Editar recetas","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Las recetas solo se pueden editar en myspeidel.com o directamente en el Braumeister.","Darstellung":"Apariencia","Tastenbeleuchtung":"Iluminación de botones","Standard":"Predeterminado","Licht aus":"Luces apagadas","Eigene Farbe":"Color personalizado","HEX-Farbe":"Color HEX","Rot":"Rojo","Orange":"Naranja","Gelb":"Amarillo","Grün":"Verde","Cyan":"Cian","Blau":"Azul","Magenta":"Magenta","Weiß":"Blanco","Nur die Tastenringe dieser Karte ändern sich.":"Solo cambian los anillos de los botones de esta tarjeta.","Bitte #RRGGBB eingeben.":"Introduce #RRGGBB."},"fr":{"Manuell":"Manuel","Braustart":"Démarrer le brassage","Rezept auswählen":"Choisir une recette","Ab":"Bas","Hoch":"Haut","Lokale Menünavigation":"Navigation locale dans le menu","Menüaktion läuft …":"Action de menu en attente…","Menüaktion bestätigt":"Action de menu confirmée","Menüaktion abgelaufen":"Action de menu expirée","Menüaktion unbestätigt":"Action de menu non confirmée","Gerätebildschirm hat gewechselt":"L’écran de l’appareil a changé","Einstellungen können nur direkt am Braumeister geändert werden.":"Les paramètres peuvent uniquement être modifiés directement sur le Braumeister.","Zeit":"Durée","Soll / Ist":"Cible / Réel","Soll / Ist · verstrichen":"Cible / Réel · écoulé","Temp":"Temp","Abbruch":"Annuler","Pumpe":"Pompe","Heizung":"Chauffage","Temperatur":"Température","Braumeister-Steuerung noch nicht verfügbar":"Commandes du Braumeister pas encore disponibles","Benötigt einen Steuerdienst der Integration":"Nécessite une action de commande de l’intégration","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Affichage en direct · Commandes du Braumeister pas encore disponibles","Zwischenstecker ausgeschaltet":"Prise connectée éteinte","Keine Online-Verbindung":"Aucune connexion en ligne","Inaktiv (Zwischenzustand)":"Inactif (état intermédiaire)","Integrationsmeldung":"Signalé par l’intégration","Aktuelles Rezept":"Recette actuelle","Stromversorgung":"Alimentation","Gerätedaten":"Informations sur l’appareil","Aktueller Schritt":"Étape actuelle","Gemeldeter Fortschritt":"Progression signalée","Gemeldete Zeit¹":"Durée signalée¹","Verbindung":"Connexion","Modus":"Mode","Pumpe · gemeldet":"Pompe · signalée","Heizung · gemeldet":"Chauffage · signalé","Zwischenstecker":"Prise connectée","Schaltzustand":"État de commutation","Gesamtleistung":"Puissance totale","Einschalten":"Allumer","Ausschalten":"Éteindre","Nach Stromausfall":"Après une coupure de courant","Bitte wählen":"Choisir une option","Ein":"Marche","Aus":"Arrêt","Vorheriger Zustand":"État précédent","Zustand umkehren":"Inverser l’état","Schaltet die gesamte Stromversorgung des Braumeisters.":"Commande l’alimentation complète du Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Heure signalée par le Braumeister","Alarm vom Braumeister gemeldet":"Alarme signalée par le Braumeister","Aktion fehlgeschlagen":"Échec de l’action","Display":"Affichage","Rezept":"Recette","Strom":"Alimentation","Status":"État","Hauptmenü":"Menu principal","Einmaischen":"Empâtage","Wasser eingefüllt?":"Eau ajoutée ?","Pumpe wird entlüftet":"Purge de la pompe","Aufheizen":"Montée en température","Pumpenabschaltung":"Arrêt de la pompe","Einmaischtemperatur erreicht":"Température d’empâtage atteinte","Malz einfüllen!":"Ajouter le malt !","Malz eingefüllt?":"Malt ajouté ?","Rast":"Palier","{number}. Rast":"Palier {number}","Pumpenpause":"Pause de la pompe","Maischen":"Brassage","Rastende erreicht":"Palier terminé","Läutern":"Filtration","Malzrohr entnehmen!":"Retirer le tube à malt !","Hopfen kochen":"Ébullition","Start Hopfenkochen?":"Démarrer l’ébullition ?","Aufheizen zum Kochen":"Chauffage jusqu’à ébullition","Hopfen zugeben":"Ajouter le houblon","Hopfen zugeben – {number}. Hopfengabe":"Ajouter le houblon – ajout {number}","Hopfenzugabe":"Ajout de houblon","Nächste Hopfengabe in {number} Minuten.":"Prochain ajout de houblon dans {number} minutes.","Brauvorgang beendet":"Brassage terminé","Jetzt Whirlpool …":"Démarrer le whirlpool …","Prost!":"Santé !","Manueller Betrieb":"Mode manuel","Einstellungen":"Paramètres","Temperaturfehler":"Erreur de température","Bitte Deckel entfernen.":"Veuillez retirer le couvercle.","Automatik angehalten":"Processus automatique en pause","Status unbekannt":"État inconnu","Statuscode {number}":"Code d’état {number}","online":"En ligne","offline":"Hors ligne","automatic":"Automatique","manual":"Manuel","waiting":"En attente","on":"Marche","off":"Arrêt","previous":"État précédent","toggle":"Inverser l’état","wartet":"En attente","¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.":"¹ Durée signalée par l’intégration, pas encore vérifiée comme durée restante. Les entités disponibles ne fournissent ni liste de recettes ni programme des paliers.","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H affichent les valeurs de l’intégration. Les états XHR corrects nécessitent la correction du parseur de la PR #8.","Rezepte bearbeiten":"Modifier les recettes","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Les recettes peuvent uniquement être modifiées sur myspeidel.com ou directement sur le Braumeister.","Darstellung":"Apparence","Tastenbeleuchtung":"Éclairage des boutons","Standard":"Par défaut","Licht aus":"Éclairage éteint","Eigene Farbe":"Couleur personnalisée","HEX-Farbe":"Couleur HEX","Rot":"Rouge","Orange":"Orange","Gelb":"Jaune","Grün":"Vert","Cyan":"Cyan","Blau":"Bleu","Magenta":"Magenta","Weiß":"Blanc","Nur die Tastenringe dieser Karte ändern sich.":"Seuls les anneaux des boutons de cette carte changent.","Bitte #RRGGBB eingeben.":"Saisissez #RRGGBB."},"it":{"Manuell":"Manuale","Braustart":"Avvia produzione","Rezept auswählen":"Seleziona ricetta","Ab":"Giù","Hoch":"Su","Lokale Menünavigation":"Navigazione locale nel menu","Menüaktion läuft …":"Azione di menu in attesa…","Menüaktion bestätigt":"Azione di menu confermata","Menüaktion abgelaufen":"Azione di menu scaduta","Menüaktion unbestätigt":"Azione di menu non confermata","Gerätebildschirm hat gewechselt":"La schermata del dispositivo è cambiata","Einstellungen können nur direkt am Braumeister geändert werden.":"Le impostazioni possono essere modificate solo direttamente sul Braumeister.","Zeit":"Tempo","Soll / Ist":"Obiettivo / Attuale","Soll / Ist · verstrichen":"Obiettivo / Attuale · trascorso","Temp":"Temp","Abbruch":"Annulla","Pumpe":"Pompa","Heizung":"Riscaldamento","Temperatur":"Temperatura","Braumeister-Steuerung noch nicht verfügbar":"Comandi del Braumeister non ancora disponibili","Benötigt einen Steuerdienst der Integration":"Richiede un’azione di controllo dell’integrazione","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Vista in tempo reale · Comandi del Braumeister non ancora disponibili","Zwischenstecker ausgeschaltet":"Presa intelligente spenta","Keine Online-Verbindung":"Nessuna connessione","Inaktiv (Zwischenzustand)":"Inattivo (stato intermedio)","Integrationsmeldung":"Segnalato dall’integrazione","Aktuelles Rezept":"Ricetta attuale","Stromversorgung":"Alimentazione","Gerätedaten":"Dati del dispositivo","Aktueller Schritt":"Passaggio attuale","Gemeldeter Fortschritt":"Avanzamento segnalato","Gemeldete Zeit¹":"Tempo segnalato¹","Verbindung":"Connessione","Modus":"Modalità","Pumpe · gemeldet":"Pompa · segnalata","Heizung · gemeldet":"Riscaldamento · segnalato","Zwischenstecker":"Presa intelligente","Schaltzustand":"Stato dell’interruttore","Gesamtleistung":"Potenza totale","Einschalten":"Accendi","Ausschalten":"Spegni","Nach Stromausfall":"Dopo un’interruzione di corrente","Bitte wählen":"Seleziona un’opzione","Ein":"Acceso","Aus":"Spento","Vorheriger Zustand":"Stato precedente","Zustand umkehren":"Inverti stato","Schaltet die gesamte Stromversorgung des Braumeisters.":"Commuta l’intera alimentazione del Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Ora segnalata dal Braumeister","Alarm vom Braumeister gemeldet":"Allarme segnalato dal Braumeister","Aktion fehlgeschlagen":"Azione non riuscita","Display":"Display","Rezept":"Ricetta","Strom":"Alimentazione","Status":"Stato","Hauptmenü":"Menu principale","Einmaischen":"Ammostamento iniziale","Wasser eingefüllt?":"Acqua aggiunta?","Pumpe wird entlüftet":"Spurgo della pompa","Aufheizen":"Riscaldamento","Pumpenabschaltung":"Arresto della pompa","Einmaischtemperatur erreicht":"Temperatura di ammostamento raggiunta","Malz einfüllen!":"Aggiungere il malto!","Malz eingefüllt?":"Malto aggiunto?","Rast":"Sosta","{number}. Rast":"Sosta {number}","Pumpenpause":"Pausa della pompa","Maischen":"Ammostamento","Rastende erreicht":"Sosta completata","Läutern":"Filtrazione","Malzrohr entnehmen!":"Rimuovere il tubo del malto!","Hopfen kochen":"Bollitura","Start Hopfenkochen?":"Avviare la bollitura?","Aufheizen zum Kochen":"Riscaldamento fino a ebollizione","Hopfen zugeben":"Aggiungere il luppolo","Hopfen zugeben – {number}. Hopfengabe":"Aggiungere il luppolo – aggiunta {number}","Hopfenzugabe":"Aggiunta di luppolo","Nächste Hopfengabe in {number} Minuten.":"Prossima aggiunta di luppolo tra {number} minuti.","Brauvorgang beendet":"Produzione completata","Jetzt Whirlpool …":"Avviare il whirlpool …","Prost!":"Salute!","Manueller Betrieb":"Funzionamento manuale","Einstellungen":"Impostazioni","Temperaturfehler":"Errore di temperatura","Bitte Deckel entfernen.":"Rimuovere il coperchio.","Automatik angehalten":"Processo automatico in pausa","Status unbekannt":"Stato sconosciuto","Statuscode {number}":"Codice di stato {number}","online":"Online","offline":"Offline","automatic":"Automatico","manual":"Manuale","waiting":"In attesa","on":"Acceso","off":"Spento","previous":"Stato precedente","toggle":"Inverti stato","wartet":"In attesa","¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.":"¹ Tempo segnalato dall’integrazione, non ancora verificato come tempo rimanente. Le entità disponibili non forniscono ricette né programma delle soste.","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H mostrano i valori dell’integrazione. Gli stati XHR corretti richiedono la correzione del parser della PR #8.","Rezepte bearbeiten":"Modifica ricette","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Le ricette possono essere modificate solo su myspeidel.com o direttamente sul Braumeister.","Darstellung":"Aspetto","Tastenbeleuchtung":"Illuminazione dei pulsanti","Standard":"Predefinito","Licht aus":"Luci spente","Eigene Farbe":"Colore personalizzato","HEX-Farbe":"Colore HEX","Rot":"Rosso","Orange":"Arancione","Gelb":"Giallo","Grün":"Verde","Cyan":"Ciano","Blau":"Blu","Magenta":"Magenta","Weiß":"Bianco","Nur die Tastenringe dieser Karte ändern sich.":"Cambiano solo gli anelli dei pulsanti di questa scheda.","Bitte #RRGGBB eingeben.":"Inserisci #RRGGBB."},"nl":{"Manuell":"Handmatig","Braustart":"Brouwen starten","Rezept auswählen":"Recept kiezen","Ab":"Omlaag","Hoch":"Omhoog","Lokale Menünavigation":"Lokale menunavigatie","Menüaktion läuft …":"Menuactie in behandeling…","Menüaktion bestätigt":"Menuactie bevestigd","Menüaktion abgelaufen":"Menuactie verlopen","Menüaktion unbestätigt":"Menuactie niet bevestigd","Gerätebildschirm hat gewechselt":"Het apparaatscherm is gewijzigd","Einstellungen können nur direkt am Braumeister geändert werden.":"Instellingen kunnen alleen rechtstreeks op de Braumeister worden gewijzigd.","Zeit":"Tijd","Soll / Ist":"Doel / Actueel","Soll / Ist · verstrichen":"Doel / Actueel · verstreken","Temp":"Temp","Abbruch":"Annuleren","Pumpe":"Pomp","Heizung":"Verwarming","Temperatur":"Temperatuur","Braumeister-Steuerung noch nicht verfügbar":"Braumeister-bediening nog niet beschikbaar","Benötigt einen Steuerdienst der Integration":"Vereist een bedieningsactie van de integratie","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Liveweergave · Braumeister-bediening nog niet beschikbaar","Zwischenstecker ausgeschaltet":"Slimme stekker uitgeschakeld","Keine Online-Verbindung":"Geen verbinding","Inaktiv (Zwischenzustand)":"Inactief (tussenstand)","Integrationsmeldung":"Gemeld door integratie","Aktuelles Rezept":"Huidig recept","Stromversorgung":"Stroomvoorziening","Gerätedaten":"Apparaatgegevens","Aktueller Schritt":"Huidige stap","Gemeldeter Fortschritt":"Gemelde voortgang","Gemeldete Zeit¹":"Gemelde tijd¹","Verbindung":"Verbinding","Modus":"Modus","Pumpe · gemeldet":"Pomp · gemeld","Heizung · gemeldet":"Verwarming · gemeld","Zwischenstecker":"Slimme stekker","Schaltzustand":"Schakelstatus","Gesamtleistung":"Totaal vermogen","Einschalten":"Inschakelen","Ausschalten":"Uitschakelen","Nach Stromausfall":"Na stroomuitval","Bitte wählen":"Kies een optie","Ein":"Aan","Aus":"Uit","Vorheriger Zustand":"Vorige status","Zustand umkehren":"Status omkeren","Schaltet die gesamte Stromversorgung des Braumeisters.":"Schakelt de volledige stroomvoorziening van de Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Tijd gemeld door de Braumeister","Alarm vom Braumeister gemeldet":"Alarm gemeld door de Braumeister","Aktion fehlgeschlagen":"Actie mislukt","Display":"Scherm","Rezept":"Recept","Strom":"Stroom","Status":"Status","Hauptmenü":"Hoofdmenu","Einmaischen":"Inmaischen","Wasser eingefüllt?":"Water toegevoegd?","Pumpe wird entlüftet":"Pomp ontluchten","Aufheizen":"Opwarmen","Pumpenabschaltung":"Pomp uitschakelen","Einmaischtemperatur erreicht":"Inmaischtemperatuur bereikt","Malz einfüllen!":"Mout toevoegen!","Malz eingefüllt?":"Mout toegevoegd?","Rast":"Maischrust","{number}. Rast":"Maischrust {number}","Pumpenpause":"Pomppauze","Maischen":"Maischen","Rastende erreicht":"Maischrust voltooid","Läutern":"Filteren","Malzrohr entnehmen!":"Moutpijp verwijderen!","Hopfen kochen":"Koken","Start Hopfenkochen?":"Koken starten?","Aufheizen zum Kochen":"Opwarmen tot koken","Hopfen zugeben":"Hop toevoegen","Hopfen zugeben – {number}. Hopfengabe":"Hop toevoegen – gift {number}","Hopfenzugabe":"Hopgift","Nächste Hopfengabe in {number} Minuten.":"Volgende hopgift over {number} minuten.","Brauvorgang beendet":"Brouwproces voltooid","Jetzt Whirlpool …":"Start nu de whirlpool …","Prost!":"Proost!","Manueller Betrieb":"Handmatige bediening","Einstellungen":"Instellingen","Temperaturfehler":"Temperatuurfout","Bitte Deckel entfernen.":"Verwijder het deksel.","Automatik angehalten":"Automatisch proces gepauzeerd","Status unbekannt":"Onbekende status","Statuscode {number}":"Statuscode {number}","online":"Online","offline":"Offline","automatic":"Automatisch","manual":"Handmatig","waiting":"Wachten","on":"Aan","off":"Uit","previous":"Vorige status","toggle":"Status omkeren","wartet":"Wachten","¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.":"¹ Tijd gemeld door de integratie; nog niet bevestigd als resterende tijd. De beschikbare entiteiten leveren geen receptenlijst of maischschema.","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H tonen de waarden van de integratie. Correcte XHR-statussen vereisen de parsercorrectie uit PR #8.","Rezepte bearbeiten":"Recepten bewerken","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Recepten kunnen alleen op myspeidel.com of rechtstreeks op de Braumeister worden bewerkt.","Darstellung":"Weergave","Tastenbeleuchtung":"Knopverlichting","Standard":"Standaard","Licht aus":"Verlichting uit","Eigene Farbe":"Eigen kleur","HEX-Farbe":"HEX-kleur","Rot":"Rood","Orange":"Oranje","Gelb":"Geel","Grün":"Groen","Cyan":"Cyaan","Blau":"Blauw","Magenta":"Magenta","Weiß":"Wit","Nur die Tastenringe dieser Karte ändern sich.":"Alleen de knopringen op deze kaart veranderen.","Bitte #RRGGBB eingeben.":"Voer #RRGGBB in."},"pl":{"Manuell":"Tryb ręczny","Braustart":"Rozpocznij warzenie","Rezept auswählen":"Wybierz recepturę","Ab":"W dół","Hoch":"W górę","Lokale Menünavigation":"Lokalna nawigacja w menu","Menüaktion läuft …":"Oczekiwanie na wykonanie akcji menu…","Menüaktion bestätigt":"Akcja menu potwierdzona","Menüaktion abgelaufen":"Akcja menu wygasła","Menüaktion unbestätigt":"Akcja menu niepotwierdzona","Gerätebildschirm hat gewechselt":"Ekran urządzenia się zmienił","Einstellungen können nur direkt am Braumeister geändert werden.":"Ustawienia można zmieniać tylko bezpośrednio na urządzeniu Braumeister.","Zeit":"Czas","Soll / Ist":"Zadane / Rzeczywiste","Soll / Ist · verstrichen":"Zadane / Rzeczywiste · upłynęło","Temp":"Temp","Abbruch":"Anuluj","Pumpe":"Pompa","Heizung":"Grzanie","Temperatur":"Temperatura","Braumeister-Steuerung noch nicht verfügbar":"Sterowanie Braumeisterem jeszcze niedostępne","Benötigt einen Steuerdienst der Integration":"Wymaga akcji sterowania integracji","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Podgląd na żywo · Sterowanie Braumeisterem jeszcze niedostępne","Zwischenstecker ausgeschaltet":"Inteligentne gniazdko wyłączone","Keine Online-Verbindung":"Brak połączenia","Inaktiv (Zwischenzustand)":"Nieaktywne (stan pośredni)","Integrationsmeldung":"Zgłoszone przez integrację","Aktuelles Rezept":"Aktualna receptura","Stromversorgung":"Zasilanie","Gerätedaten":"Dane urządzenia","Aktueller Schritt":"Aktualny krok","Gemeldeter Fortschritt":"Zgłoszony postęp","Gemeldete Zeit¹":"Zgłoszony czas¹","Verbindung":"Połączenie","Modus":"Tryb","Pumpe · gemeldet":"Pompa · stan zgłoszony","Heizung · gemeldet":"Grzanie · stan zgłoszony","Zwischenstecker":"Inteligentne gniazdko","Schaltzustand":"Stan przełącznika","Gesamtleistung":"Moc całkowita","Einschalten":"Włącz","Ausschalten":"Wyłącz","Nach Stromausfall":"Po zaniku zasilania","Bitte wählen":"Wybierz opcję","Ein":"Włączone","Aus":"Wyłączone","Vorheriger Zustand":"Poprzedni stan","Zustand umkehren":"Odwróć stan","Schaltet die gesamte Stromversorgung des Braumeisters.":"Przełącza całe zasilanie Braumeistera.","Vom Braumeister gemeldete Uhrzeit":"Czas zgłoszony przez Braumeister","Alarm vom Braumeister gemeldet":"Alarm zgłoszony przez Braumeister","Aktion fehlgeschlagen":"Akcja nie powiodła się","Display":"Wyświetlacz","Rezept":"Receptura","Strom":"Zasilanie","Status":"Stan","Hauptmenü":"Menu główne","Einmaischen":"Zacieranie wstępne","Wasser eingefüllt?":"Czy dodano wodę?","Pumpe wird entlüftet":"Odpowietrzanie pompy","Aufheizen":"Podgrzewanie","Pumpenabschaltung":"Wyłączenie pompy","Einmaischtemperatur erreicht":"Osiągnięto temperaturę zacierania","Malz einfüllen!":"Dodaj słód!","Malz eingefüllt?":"Czy dodano słód?","Rast":"Przerwa zacierania","{number}. Rast":"Przerwa {number}","Pumpenpause":"Przerwa pompy","Maischen":"Zacieranie","Rastende erreicht":"Przerwa zakończona","Läutern":"Filtracja","Malzrohr entnehmen!":"Wyjmij rurę słodową!","Hopfen kochen":"Gotowanie","Start Hopfenkochen?":"Rozpocząć gotowanie?","Aufheizen zum Kochen":"Podgrzewanie do wrzenia","Hopfen zugeben":"Dodaj chmiel","Hopfen zugeben – {number}. Hopfengabe":"Dodaj chmiel – dawka {number}","Hopfenzugabe":"Dodatek chmielu","Nächste Hopfengabe in {number} Minuten.":"Następna dawka chmielu za {number} minut.","Brauvorgang beendet":"Warzenie zakończone","Jetzt Whirlpool …":"Rozpocznij whirlpool …","Prost!":"Na zdrowie!","Manueller Betrieb":"Tryb ręczny","Einstellungen":"Ustawienia","Temperaturfehler":"Błąd temperatury","Bitte Deckel entfernen.":"Zdejmij pokrywę.","Automatik angehalten":"Proces automatyczny wstrzymany","Status unbekannt":"Nieznany stan","Statuscode {number}":"Kod stanu {number}","online":"Online","offline":"Offline","automatic":"Automatyczny","manual":"Ręczny","waiting":"Oczekiwanie","on":"Włączone","off":"Wyłączone","previous":"Poprzedni stan","toggle":"Odwróć stan","wartet":"Oczekiwanie","¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.":"¹ Czas zgłoszony przez integrację; jeszcze niepotwierdzony jako pozostały czas. Dostępne encje nie udostępniają receptur ani harmonogramu zacierania.","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H pokazują wartości integracji. Poprawne stany XHR wymagają poprawki parsera z PR #8.","Rezepte bearbeiten":"Edytuj przepisy","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"Przepisy można edytować tylko na myspeidel.com lub bezpośrednio na urządzeniu Braumeister.","Darstellung":"Wygląd","Tastenbeleuchtung":"Podświetlenie przycisków","Standard":"Domyślne","Licht aus":"Światło wyłączone","Eigene Farbe":"Własny kolor","HEX-Farbe":"Kolor HEX","Rot":"Czerwony","Orange":"Pomarańczowy","Gelb":"Żółty","Grün":"Zielony","Cyan":"Cyjan","Blau":"Niebieski","Magenta":"Magenta","Weiß":"Biały","Nur die Tastenringe dieser Karte ändern sich.":"Zmieniają się tylko pierścienie przycisków tej karty.","Bitte #RRGGBB eingeben.":"Wpisz #RRGGBB."},"pt":{"Manuell":"Manual","Braustart":"Iniciar brassagem","Rezept auswählen":"Selecionar receita","Ab":"Para baixo","Hoch":"Para cima","Lokale Menünavigation":"Navegação local no menu","Menüaktion läuft …":"Ação de menu pendente…","Menüaktion bestätigt":"Ação de menu confirmada","Menüaktion abgelaufen":"Ação de menu expirada","Menüaktion unbestätigt":"Ação de menu não confirmada","Gerätebildschirm hat gewechselt":"O ecrã do equipamento mudou","Einstellungen können nur direkt am Braumeister geändert werden.":"As definições só podem ser alteradas diretamente no Braumeister.","Zeit":"Tempo","Soll / Ist":"Alvo / Atual","Soll / Ist · verstrichen":"Alvo / Atual · decorrido","Temp":"Temp","Abbruch":"Cancelar","Pumpe":"Bomba","Heizung":"Aquecimento","Temperatur":"Temperatura","Braumeister-Steuerung noch nicht verfügbar":"Controlo do Braumeister ainda indisponível","Benötigt einen Steuerdienst der Integration":"Requer uma ação de controlo da integração","Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar":"Visualização em direto · Controlo do Braumeister ainda indisponível","Zwischenstecker ausgeschaltet":"Tomada inteligente desligada","Keine Online-Verbindung":"Sem ligação","Inaktiv (Zwischenzustand)":"Inativo (estado intermédio)","Integrationsmeldung":"Comunicado pela integração","Aktuelles Rezept":"Receita atual","Stromversorgung":"Alimentação elétrica","Gerätedaten":"Dados do dispositivo","Aktueller Schritt":"Passo atual","Gemeldeter Fortschritt":"Progresso comunicado","Gemeldete Zeit¹":"Tempo comunicado¹","Verbindung":"Ligação","Modus":"Modo","Pumpe · gemeldet":"Bomba · comunicada","Heizung · gemeldet":"Aquecimento · comunicado","Zwischenstecker":"Tomada inteligente","Schaltzustand":"Estado do interruptor","Gesamtleistung":"Potência total","Einschalten":"Ligar","Ausschalten":"Desligar","Nach Stromausfall":"Após falha de energia","Bitte wählen":"Selecione uma opção","Ein":"Ligado","Aus":"Desligado","Vorheriger Zustand":"Estado anterior","Zustand umkehren":"Inverter estado","Schaltet die gesamte Stromversorgung des Braumeisters.":"Comuta toda a alimentação do Braumeister.","Vom Braumeister gemeldete Uhrzeit":"Hora comunicada pelo Braumeister","Alarm vom Braumeister gemeldet":"Alarme comunicado pelo Braumeister","Aktion fehlgeschlagen":"A ação falhou","Display":"Ecrã","Rezept":"Receita","Strom":"Alimentação","Status":"Estado","Hauptmenü":"Menu principal","Einmaischen":"Arriada","Wasser eingefüllt?":"Água adicionada?","Pumpe wird entlüftet":"A purgar a bomba","Aufheizen":"A aquecer","Pumpenabschaltung":"Paragem da bomba","Einmaischtemperatur erreicht":"Temperatura de arriada atingida","Malz einfüllen!":"Adicionar malte!","Malz eingefüllt?":"Malte adicionado?","Rast":"Patamar","{number}. Rast":"Patamar {number}","Pumpenpause":"Pausa da bomba","Maischen":"Mosturação","Rastende erreicht":"Patamar concluído","Läutern":"Filtração","Malzrohr entnehmen!":"Retirar o tubo de malte!","Hopfen kochen":"Fervura","Start Hopfenkochen?":"Iniciar fervura?","Aufheizen zum Kochen":"A aquecer até à fervura","Hopfen zugeben":"Adicionar lúpulo","Hopfen zugeben – {number}. Hopfengabe":"Adicionar lúpulo – adição {number}","Hopfenzugabe":"Adição de lúpulo","Nächste Hopfengabe in {number} Minuten.":"Próxima adição de lúpulo em {number} minutos.","Brauvorgang beendet":"Brassagem concluída","Jetzt Whirlpool …":"Iniciar whirlpool …","Prost!":"Saúde!","Manueller Betrieb":"Funcionamento manual","Einstellungen":"Definições","Temperaturfehler":"Erro de temperatura","Bitte Deckel entfernen.":"Retire a tampa.","Automatik angehalten":"Processo automático em pausa","Status unbekannt":"Estado desconhecido","Statuscode {number}":"Código de estado {number}","online":"Online","offline":"Offline","automatic":"Automático","manual":"Manual","waiting":"Em espera","on":"Ligado","off":"Desligado","previous":"Estado anterior","toggle":"Inverter estado","wartet":"Em espera","¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.":"¹ Tempo comunicado pela integração, ainda não verificado como tempo restante. As entidades disponíveis não fornecem receitas nem programa de mosturação.","P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.":"P/H mostram os valores da integração. Os estados XHR corretos requerem a correção do analisador da PR #8.","Rezepte bearbeiten":"Editar receitas","Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.":"As receitas só podem ser editadas em myspeidel.com ou diretamente no Braumeister.","Darstellung":"Aparência","Tastenbeleuchtung":"Iluminação dos botões","Standard":"Padrão","Licht aus":"Luzes apagadas","Eigene Farbe":"Cor personalizada","HEX-Farbe":"Cor HEX","Rot":"Vermelho","Orange":"Laranja","Gelb":"Amarelo","Grün":"Verde","Cyan":"Ciano","Blau":"Azul","Magenta":"Magenta","Weiß":"Branco","Nur die Tastenringe dieser Karte ändern sich.":"Só mudam os anéis dos botões deste cartão.","Bitte #RRGGBB eingeben.":"Introduza #RRGGBB."}};
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
  class BraumeisterDisplay extends HTMLElement {
    constructor() {
      super(); this.attachShadow({mode:'open'}); this.page='display'; this.pending=false;
      this.shadowRoot.addEventListener('click', e => {
        const b=e.target.closest('button'); if(!b || b.disabled) return;
        if(b.dataset.page) { this.page=b.dataset.page; this.render(); }
        if(b.dataset.info) this.dispatchEvent(new CustomEvent('hass-more-info', {detail:{entityId:this.ids[b.dataset.info]},bubbles:true,composed:true}));
        if(b.dataset.power) this.command('switch', b.dataset.power, {entity_id:this.ids.plug});
        if(b.dataset.menu) this.navigate(b.dataset.menu);
      });
      this.shadowRoot.addEventListener('change',e=>{
        if(e.target.id==='behavior') this.command('select','select_option',{entity_id:this.ids.behavior,option:e.target.value});
      });
    }
    setConfig(config) { this.config=config; this.ids={...defaults,...config.entities}; this.refreshLanguage(); this.render(); }
    set hass(value) {
      const previous=this._hass; this._hass=value;
      this.refreshLanguage();
      const previousCode = previous?.states[this.ids?.step]?.attributes.display_state_code;
      const code = value.states[this.ids?.step]?.attributes.display_state_code;
      if (previousCode === 2015 && code !== 2015) this.picker = null;
      if(!this.ids || !previous || previous.user !== value.user
        || previous.services?.braumeister_menu !== value.services?.braumeister_menu
        || Object.values(this.ids).some(id=>previous.states[id]!==value.states[id])) this.render();
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
        loadLanguage(`${path}/${encodeURIComponent(code)}.json?v=0.7.0-beta.5`).then(external => ({...BUNDLED_LANGUAGES[code], ...external})))).then(dictionaries => {
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
    async navigate(action) {
      const code = this._hass.states[this.ids.step]?.attributes.display_state_code;
      if (this.pending) return;
      if (action === 'temperature_readings') {
        if (code !== 4006 || this.state('connection') !== 'online' || this.state('plug') === 'off') return;
        this.showTemperatureReadings = !this.showTemperatureReadings;
        this.render();
        return;
      }
      const actuator = Object.values(this.actuatorActions()).includes(action);
      if (!actuator && (!this.menuAvailable() || !menuKeys[code]?.some(key => key[2] === action))) return;
      if (action === 'heater_on' && !window.confirm(this.translate('Heizung am Braumeister einschalten?'))) return;
      this.pending = true;
      this.menuResult = 'pending';
      this.pendingMenuAction = action;
      this.render();
      try {
        const reply = await this._hass.callWS({
          type: 'call_service', domain: 'braumeister_menu', service: actuator ? 'set_actuator' : 'navigate',
          service_data: {action}, return_response: true,
        });
        this.menuResult = reply?.response?.result || 'unconfirmed';
        this.picker = reply?.response?.picker ?? null;
      } catch (err) {
        this.menuResult = err.message || 'unconfirmed';
      } finally {
        this.pendingMenuAction = null;
        this.pending = false;
        this.render();
      }
    }
    renderMenu(code) {
      const available = this.menuAvailable();
      const keys = menuKeys[code] || [];
      const result = {
        pending: 'Menüaktion läuft …', confirmed: 'Menüaktion bestätigt',
        expired: 'Menüaktion abgelaufen', unconfirmed: 'Menüaktion unbestätigt',
        state_changed: 'Gerätebildschirm hat gewechselt',
      };
      const hint = result[this.menuResult] || this.menuResult
        || (available ? 'Lokale Menünavigation' : 'Braumeister-Steuerung noch nicht verfügbar');
      const picker = code === 2015 && this.picker
        ? `<ol>${Object.entries(this.picker.recipes).map(([slot,name]) =>
          `<li>${Number(slot) === this.picker.slot ? `<mark>${esc(name)}</mark>` : esc(name)}</li>`).join('')}</ol>` : '';
      const actuators = this.actuatorActions();
      const temperatures = code === 4006 && this.showTemperatureReadings
        ? `<p>${esc(this.translate('Soll / Ist'))}: ${esc(this.number('target','°C'))} / ${esc(this.number('temperature','°C'))}</p>` : '';
      return `${picker}${temperatures}<div class="keys">${keys.map(([icon,label,menuAction]) => {
        const action = actuators[label] || menuAction;
        const enabled = action === 'temperature_readings' || (available && action);
        const animate = this.config.menu_pending_animation !== false
          && action && action === this.pendingMenuAction && this.menuResult === 'pending';
        return `<div><button type="button" ${animate ? 'class="menu-pending"' : ''} aria-label="${esc(this.translate(label))}" data-menu="${action || ''}" ${enabled && !this.pending ? '' : 'disabled'}>${icon}</button><small>${esc(this.translate(label))}</small></div>`;
      }).join('')}</div><p class="hint" role="status">${esc(this.translate(hint))}</p>`;
    }
    render(){
      if(!this.config || !this._hass) return;
      const E=esc, T=key=>E(this.translate(key)), off=this.state('plug')==='off', online=this.state('connection')==='online'&&!off;
      const reading=k=>online?this.number(k,'°C'):'—';
      const attrs=this._hass.states[this.ids.step]?.attributes||{};
      const live=online && !['unknown','unavailable',undefined].includes(this.state('step'));
      const flag=k=>live?attrs[k==='pump'?'display_pump_flag':'display_heater_flag']:null;
      const badgeClass=k=>!online?'':flag(k)?(['P','H'].includes(flag(k))?'active':['q','i'].includes(flag(k))?'inactive':''):['Ein','on'].includes(this.state(k))?'active':'';
      const duration=v=>Number.isInteger(v)&&v>=0?`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`:'—';
      const targetTime=attrs.display_time_target_seconds;
      const targetLabel=Number.isInteger(targetTime)&&targetTime>=0?(targetTime%60?duration(targetTime):String(targetTime/60)):'—';
      const timed=live && Number.isInteger(attrs.display_state_code) && attrs.display_state_code>=2810 && attrs.display_state_code<2910;
      const timer=timed?`<div class="temp timer"><div>${T('Zeit')}<small>${T('Soll / Ist · verstrichen')}</small></div><strong>${targetLabel} / ${duration(attrs.display_time_elapsed_seconds)} min</strong></div>`:'';
      const editingRecipes=live && (attrs.display_state_code===6010 || (attrs.display_state_code==null && ['Statuscode 6010','Rezepte bearbeiten'].includes(this.state('step'))));
      const recipeEditHint=editingRecipes?`<p class="recipe-edit-hint">${T('Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.')}</p>`:'';
      const heading=live&&attrs.display_phase?[this.text('recipe'),this.translate(attrs.display_phase)].filter(v=>v!=='—').join(' – '):this.label('step');
      const badge=(k,label)=>`<button data-info="${k}" class="badge ${badgeClass(k)}" title="${label}: ${E(['q','i'].includes(flag(k))?this.translate('Inaktiv (Zwischenzustand)'):this.label(k))} (${T('Integrationsmeldung')})">${label}</button>`;
      const row=(label,key,unit)=>`<div class="row"><span>${T(label)}</span><button class="value" data-info="${key}">${E(unit?this.number(key,unit):this.label(key))}</button></div>`;
      const menuCode = this.config.menu_control === true && live ? attrs.display_state_code : null;
      const title={display:menuTitles[menuCode] ? this.translate(menuTitles[menuCode]) : heading,recipe:'Aktuelles Rezept',power:'Stromversorgung',details:'Gerätedaten'}[this.page];
      let body='';
      if(this.page==='display') body=`<h2>${E(this.config.title||'Speidels Braumeister')}</h2><div class="temp"><div>${T('Temp')}<small>${T('Soll / Ist')}</small></div><strong>${reading('target')} / ${reading('temperature')}</strong></div>${timer}<p class="phase">${E(online?this.label('step'):this.translate(off?'Zwischenstecker ausgeschaltet':'Keine Online-Verbindung'))}</p>${recipeEditHint}<div class="sub">${E(this.text('recipe'))}</div>${this.config.menu_control === true ? this.renderMenu(live ? attrs.display_state_code : null) : `<div class="keys" aria-label="${T('Braumeister-Steuerung noch nicht verfügbar')}">${[['✕','Abbruch'],['P','Pumpe'],['H','Heizung'],['↕','Temperatur']].map(([icon,label])=>`<div><button disabled title="${T('Benötigt einen Steuerdienst der Integration')}">${icon}</button><small>${T(label)}</small></div>`).join('')}</div><p class="hint">${T('Live-Anzeige · Braumeister-Steuerung noch nicht verfügbar')}</p>`}`;
      if (this.page === 'display' && [8101, 6010, 2015].includes(menuCode)) {
        const menuHint = menuCode === 8101
          ? `<p>${T('Einstellungen können nur direkt am Braumeister geändert werden.')}</p>`
          : recipeEditHint;
        body = `<h2>${T(menuTitles[menuCode])}</h2>${menuHint}${this.renderMenu(menuCode)}`;
      }
      if(this.page==='recipe') body=`<h2>${E(this.text('recipe'))}</h2>${row('Aktueller Schritt','step')}${row('Gemeldeter Fortschritt','progress','%')}${row('Gemeldete Zeit¹','time','min')}<p class="hint">${T('¹ Zeitwert der Integration, noch nicht als Restzeit verifiziert. Rezeptliste und Rastplan werden von den vorhandenen Entitäten nicht bereitgestellt.')}</p>`;
      if(this.page==='details') body=`<h2>Braumeister 20L Plus</h2>${row('Verbindung','connection')}${row('Modus','mode')}${row('Pumpe · gemeldet','pump')}${row('Heizung · gemeldet','heater')}<p class="hint">${T('P/H zeigen die Meldung der Integration. Die Anzeige übernimmt die Sensorwerte; für korrekte XHR-Zustände wird der Parser-Fix aus PR #8 benötigt.')}</p>`;
      if(this.page==='power') {
        const options=this._hass.states[this.ids.behavior]?.attributes.options||[];
        const available=['on','off'].includes(this.state('plug'));
        const disabled=this.pending||!available?'disabled':'';
        body=`<h2>${T('Zwischenstecker')}</h2>${row('Schaltzustand','plug')}${row('Gesamtleistung','power','W')}<div class="power-buttons"><button data-power="turn_on" ${disabled}>${T('Einschalten')}</button><button data-power="turn_off" ${disabled}>${T('Ausschalten')}</button></div><label>${T('Nach Stromausfall')}<select id="behavior" ${this.pending||!options.length?'disabled':''}><option disabled ${!options.includes(this.state('behavior'))?'selected':''}>${T('Bitte wählen')}</option>${options.map(o=>`<option value="${E(o)}" ${this.state('behavior')===o?'selected':''}>${T(({on:'Ein',off:'Aus',previous:'Vorheriger Zustand',toggle:'Zustand umkehren'})[o]||o)}</option>`).join('')}</select></label><p class="hint">${T('Schaltet die gesamte Stromversorgung des Braumeisters.')}</p>`;
      }
      // Only a confirmed plug-off overrides presentation; keep the saved choice intact.
      const lighting=off?'off':lightingValue(this.config.button_color);
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
      .screen{background:#f4f4f4;box-shadow:inset 0 0 15px #999;min-height:360px}
      header{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:6px solid black;font-size:13px;min-height:49px}header .title{flex:1;overflow-wrap:anywhere}
      button,select{font:inherit}button{cursor:pointer;border:0}button:focus-visible,select:focus-visible{outline:3px solid #008bd2;outline-offset:3px}
      .badge{border:2px solid black;background:transparent;padding:2px 5px;color:black}.badge.active{background:#ffda16}.badge.inactive{background:linear-gradient(45deg,#f4f4f4 50%,#ffda16 50%)}.timer{margin-top:24px}
      main{padding:22px clamp(14px,4cqw,28px);min-height:290px}h2{font-size:clamp(20px,5cqw,34px);margin:4px 0 26px;overflow-wrap:anywhere}
      .temp{display:flex;justify-content:space-between;gap:12px;font-size:clamp(19px,4.6cqw,32px);font-weight:bold}.temp strong{text-align:right}.temp small{font-size:12px;display:block;font-weight:normal;margin-top:6px}
      .phase{font-size:clamp(19px,4cqw,28px);font-weight:bold;margin:24px 0 8px;overflow-wrap:anywhere}.sub{font-size:14px}
      .keys{display:flex;justify-content:space-between;gap:8px;margin-top:32px;text-align:center}.keys button{background:#ffda16;border-radius:10px;font-size:36px;font-weight:bold;width:56px;height:56px;color:black}.keys button:disabled{opacity:.4;cursor:not-allowed}small{display:block;font-size:11px;margin-top:7px}
      .hint{font-size:12px;line-height:1.5;color:#555;margin:20px 0 0}.row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #ddd;font-size:14px}.value{background:transparent;color:black;font-weight:bold;text-align:right;overflow-wrap:anywhere;max-width:65%}
      footer{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:24px}footer button{color:white;background:none;padding:0;font-size:11px}footer .ring{display:grid;place-items:center;margin:0 auto 10px;width:clamp(42px,11cqw,74px);height:clamp(42px,11cqw,74px);aspect-ratio:1;border:5px solid ${ringColor};border-radius:50%;font-size:22px}footer button[aria-pressed=true] .ring{border-color:${lighting==='default'?'#ffda16':ringColor};background:black;color:${lighting==='default'?'#ffda16':'white'}}footer button[aria-pressed=true]{text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:2px}
      .power-buttons{display:flex;gap:12px;margin:20px 0}.power-buttons button{padding:14px;background:#ffda16;border-radius:8px;color:black;flex:1;font-weight:bold}.power-buttons button:disabled{opacity:.4;cursor:not-allowed}label{display:block;font-size:14px}select{display:block;width:100%;margin-top:8px;padding:12px;background:white;color:black;border:1px solid #888;border-radius:6px}.notice{padding:10px 16px;background:#ffda16;font-size:13px}.error{background:#ffd3d3;padding:12px;overflow-wrap:anywhere}
      </style><ha-card><div class="screen"><header><span class="title">${T(title)}</span>${live&&attrs.display_clock?`<time title="${T('Vom Braumeister gemeldete Uhrzeit')}">${E(attrs.display_clock)}</time>`:''}${badge('pump','P')}${badge('heater','H')}</header>${this.state('alarm')==='on'?`<div class="notice">${T('Alarm vom Braumeister gemeldet')}</div>`:''}<main>${body}</main>${this.error?`<div class="error" role="alert">${T(this.error)}</div>`:''}</div><footer>${[['display','▣','Display'],['recipe','☷','Rezept'],['power','⏻','Strom'],['details','ⓘ','Status']].map(([p,i,t])=>`<button data-page="${p}" aria-pressed="${this.page===p}"><span class="ring">${i}</span>${T(t)}</button>`).join('')}</footer></ha-card>`;
    }
  }
  class BraumeisterDisplayEditor extends HTMLElement {
    constructor(){
      super(); this.attachShadow({mode:'open'});
      this.shadowRoot.addEventListener('click',event=>{
        const button=event.target.closest('button[data-color]');
        if(button) this.updateColor(button.dataset.color);
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
    set hass(value){this._hass=value;this.refreshLanguage();}
    refreshLanguage(){BraumeisterDisplay.prototype.refreshLanguage.call(this);}
    translate(key,params){return BraumeisterDisplay.prototype.translate.call(this,key,params);}
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
        <p>${T('Nur die Tastenringe dieser Karte ändern sich.')}</p></fieldset>`;
    }
  }
  if(!customElements.get('braumeister-display-card-editor')) customElements.define('braumeister-display-card-editor',BraumeisterDisplayEditor);
  if(!customElements.get('braumeister-display-card')) customElements.define('braumeister-display-card',BraumeisterDisplay);
  window.customCards=window.customCards||[];
  window.customCards.push({type:'braumeister-display-card',name:'Braumeister Display',description:'Live display and smart plug, version 0.7.0-beta.5'});
})();
