/* Braumeister Display 0.7.0-beta.11 — native HA telemetry card, no cloud credentials. */
(() => {
  // Entity IDs depend on the installation; configure them in the card YAML.
  const defaults = Object.fromEntries(['temperature', 'target', 'step', 'recipe', 'mode', 'connection', 'connection_warning', 'pump', 'heater', 'progress', 'time', 'alarm', 'plug', 'power', 'behavior'].map(key => [key, '']));
  const menuKeys = {
    101: [['⚙','Einstellungen','open_settings'], ['☛','Manuell','open_manual'],
      ['▶','Braustart','open_recipe_selection'], ['☰','Rezept','open_recipe_list']],
    8101: [['✕','Abbruch','close_settings']],
    4006: [['✕','Abbruch','close_manual'], ['P','Pumpe'], ['H','Heizung'], ['↕','Temperatur','temperature_readings']],
    6010: [['✕','Abbruch','close_recipe_list']],
    2015: [['✕','Abbruch','cancel_recipe_selection'], ['⌄','Ab','recipe_down'], ['⌃','Hoch','recipe_up'], ['✓','Auswahl','select_recipe']],
    2030: [['✕','Abbruch','cancel_water_prompt'], ['⌄','Ab','start_delay_down'], ['⌃','Hoch','start_delay_up'], ['✓','Auswahl','confirm_water_filled']],
    2300: [['✕','Abbruch','request_program_pause']],
    2310: [['✕','Abbruch','request_program_pause']],
    2410: [['✕','Abbruch','request_program_pause']],
  };
  // Future backend contract. Never dispatch through the legacy menu service.
  const programActions = new Set(['cancel_water_prompt', 'start_delay_down', 'start_delay_up',
    'confirm_water_filled', 'request_program_pause', 'abort_program', 'resume_program']);
  const energizingActions = new Set(['confirm_water_filled', 'resume_program']);
  const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Only presentation is localized. Backend values, attributes and commands stay intact.
  const menuTitles = {101: 'Hauptmenü', 8101: 'Einstellungen', 4006: 'Manueller Betrieb',
    6010: 'Rezepte bearbeiten', 2015: 'Rezept auswählen'};
  const ENGLISH = {
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
  const BUNDLED_LANGUAGES = {};
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
      this.refreshRecipePicker();
    }
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
        loadLanguage(`${path}/${encodeURIComponent(code)}.json?v=0.7.0-beta.11`).then(external => ({...BUNDLED_LANGUAGES[code], ...external})))).then(dictionaries => {
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
      if (Number.isInteger(code) && code >= 2000 && code < 4000 && interrupt === 1) {
        return [['✕','Abbruch','abort_program'], ['✓','Auswahl','resume_program']];
      }
      if (Number.isInteger(interrupt) && interrupt > 0) return [];
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
        if (action === 'resume_program' && code !== 2300) return null;
        if (['request_program_pause', 'abort_program'].includes(action) && ![2300,2410].includes(code)) return null;
        const stopping = ['request_program_pause', 'abort_program', 'cancel_water_prompt'].includes(action);
        return this.serviceSupports('program_control', action)
          && (stopping || this.config.program_control === true) ? 'program_control' : null;
      }
      if (action === 'select_recipe') return this.serviceSupports('navigate', action) ? 'navigate' : null;
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
      if (energizingActions.has(action) && !window.confirm(this.translate(action === 'confirm_water_filled'
        ? 'Wasser eingefüllt? Bestätigen kann Pumpe und Heizung starten.'
        : 'Brauvorgang fortsetzen? Pumpe und Heizung können wieder anlaufen.'))) return;
      if (action === 'abort_program' && !window.confirm(this.translate('Brauvorgang endgültig abbrechen?'))) return;
      this.pending = true;
      this.pickerReadEpoch = (this.pickerReadEpoch || 0) + 1;
      this.menuResult = 'pending';
      this.pendingMenuAction = action;
      this.render();
      try {
        const reply = await this._hass.callWS({
          type: 'call_service', domain: 'braumeister_menu', service,
          service_data: {action}, return_response: true,
        });
        this.menuResult = reply?.response?.result || 'unconfirmed';
        if (reply?.response?.picker) this.picker = reply.response.picker;
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
      const keys = this.menuKeysFor(code);
      const result = {
        pending: 'Menüaktion läuft …', confirmed: 'Menüaktion bestätigt',
        expired: 'Menüaktion abgelaufen', unconfirmed: 'Menüaktion unbestätigt',
        state_changed: 'Gerätebildschirm hat gewechselt',
      };
      const hint = result[this.menuResult] || this.menuResult
        || (available ? 'Lokale Menünavigation' : 'Braumeister-Steuerung noch nicht verfügbar');
      const picker = code === 2015 && this.picker
        ? `<ol class="recipe-picker">${Object.entries(this.picker.recipes).sort(([a],[b]) => Number(a)-Number(b)).map(([slot,name]) =>
          `<li>${Number(slot) === this.picker.slot ? `<mark>${esc(name)}</mark>` : esc(name)}</li>`).join('')}</ol>` : '';
      const actuators = this.actuatorActions();
      const temperatures = code === 4006 && this.showTemperatureReadings
        ? `<p>${esc(this.translate('Soll / Ist'))}: ${esc(this.number('target','°C'))} / ${esc(this.number('temperature','°C'))}</p>` : '';
      const paused = keys.some(key => key[2] === 'resume_program');
      const programNote = paused ? 'Weiter mit Auswahl, endgültiger Abbruch mit Abbruch.'
        : code === 2030 ? 'Startzeitvorwahl noch nicht verifiziert.' : '';
      const unsupportedKeys = keys.some(key => key[2] && key[2] !== 'temperature_readings' && !this.actionService(key[2]));
      return `${picker}${temperatures}${programNote?`<p class="hint">${esc(this.translate(programNote))}</p>`:''}<div class="keys">${keys.map(([icon,label,menuAction]) => {
        const action = actuators[label] || menuAction;
        const enabled = action === 'temperature_readings' || (available && action && this.actionService(action));
        const animate = this.config.menu_pending_animation !== false
          && action && action === this.pendingMenuAction && this.menuResult === 'pending';
        const unsupported = action && !this.actionService(action);
        return `<div><button type="button" ${animate ? 'class="menu-pending"' : ''} aria-label="${esc(this.translate(label))}" ${unsupported ? `title="${esc(this.translate('Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.'))}"` : ''} data-menu="${action || ''}" ${enabled && !this.pending ? '' : 'disabled'}>${icon}</button><small>${esc(this.translate(label))}</small></div>`;
      }).join('')}</div>${unsupportedKeys?`<p class="hint">${esc(this.translate('Diese Taste benötigt eine unterstützte und freigegebene Bridge-/Companion-Aktion.'))}</p>`:''}<p class="hint" role="status">${esc(this.translate(hint))}</p>`;
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
      const programPaused = live && attrs.display_interrupt === 1
        && Number.isInteger(attrs.display_state_code) && attrs.display_state_code >= 2000 && attrs.display_state_code < 4000;
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
      .screen.program-paused{outline:3px solid #b00020;box-shadow:inset 0 0 18px #e66868}
      .screen.program-paused.pulse{animation:program-pause-pulse 1.4s ease-in-out infinite}
      @keyframes program-pause-pulse{50%{box-shadow:inset 0 0 30px #cf3030;outline-color:#ff6565}}
      @media(prefers-reduced-motion:reduce){.screen.program-paused.pulse{animation:none}}
      header{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:6px solid black;font-size:13px;min-height:49px}header .brand-icon{flex:none}header .title{flex:1;overflow-wrap:anywhere}
      button,select{font:inherit}button{cursor:pointer;border:0}button:focus-visible,select:focus-visible{outline:3px solid #008bd2;outline-offset:3px}
      .badge{border:2px solid black;background:transparent;padding:2px 5px;color:black}.badge.active{background:#ffda16}.badge.inactive{background:linear-gradient(45deg,#f4f4f4 50%,#ffda16 50%)}.timer{margin-top:24px}
      main{padding:22px clamp(14px,4cqw,28px);min-height:290px}h2{font-size:clamp(20px,5cqw,34px);margin:4px 0 26px;overflow-wrap:anywhere}
      .temp{display:flex;justify-content:space-between;gap:12px;font-size:clamp(19px,4.6cqw,32px);font-weight:bold}.temp strong{text-align:right}.temp small{font-size:12px;display:block;font-weight:normal;margin-top:6px}
      .phase{font-size:clamp(19px,4cqw,28px);font-weight:bold;margin:24px 0 8px;overflow-wrap:anywhere}.sub{font-size:14px}
      .recipe-picker{display:grid;grid-auto-flow:column;grid-template-rows:repeat(5,auto);grid-auto-columns:minmax(0,1fr);gap:6px 24px;padding-left:24px;text-align:left}.recipe-picker li{min-width:0;overflow-wrap:anywhere}.recipe-picker mark{background:#ffda16;color:#000}
      .keys{display:flex;justify-content:space-between;gap:8px;margin-top:32px;text-align:center}.keys button{background:#ffda16;border-radius:10px;font-size:36px;font-weight:bold;width:56px;height:56px;color:black}.keys button:disabled{opacity:.4;cursor:not-allowed}small{display:block;font-size:11px;margin-top:7px}
      .hint{font-size:12px;line-height:1.5;color:#555;margin:20px 0 0}.row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #ddd;font-size:14px}.value{background:transparent;color:black;font-weight:bold;text-align:right;overflow-wrap:anywhere;max-width:65%}
      footer{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:24px}footer button{color:white;background:none;padding:0;font-size:11px}footer .ring{display:grid;place-items:center;margin:0 auto 10px;width:clamp(42px,11cqw,74px);height:clamp(42px,11cqw,74px);aspect-ratio:1;border:5px solid ${ringColor};border-radius:50%;font-size:22px}footer button[aria-pressed=true] .ring{border-color:${lighting==='default'?'#ffda16':ringColor};background:black;color:${lighting==='default'?'#ffda16':'white'}}footer button[aria-pressed=true]{text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:2px}
      .power-buttons{display:flex;gap:12px;margin:20px 0}.power-buttons button{padding:14px;background:#ffda16;border-radius:8px;color:black;flex:1;font-weight:bold}.power-buttons button:disabled{opacity:.4;cursor:not-allowed}label{display:block;font-size:14px}select{display:block;width:100%;margin-top:8px;padding:12px;background:white;color:black;border:1px solid #888;border-radius:6px}.notice{padding:10px 16px;background:#ffda16;font-size:13px}.connection-warning.risk{background:#ffd3d3;color:#700;border:2px solid #b00020}.error{background:#ffd3d3;padding:12px;overflow-wrap:anywhere}
      </style><ha-card><div class="screen${programPaused?` program-paused${this.config.program_alarm_animation !== false ? ' pulse' : ''}`:''}"><header>${brandIcon}<span class="title">${T(title)}</span>${live&&attrs.display_clock?`<time title="${T('Vom Braumeister gemeldete Uhrzeit')}">${E(attrs.display_clock)}</time>`:''}${badge('pump','P')}${badge('heater','H')}</header>${connectionNotice}${this.state('alarm')==='on'?`<div class="notice">${T('Alarm vom Braumeister gemeldet')}</div>`:''}<main>${body}</main>${this.error?`<div class="error" role="alert">${T(this.error)}</div>`:''}</div><footer>${[['display','▣','Display'],['recipe','☷','Rezept'],['power','⏻','Strom'],['details','ⓘ','Status']].map(([p,i,t])=>`<button data-page="${p}" aria-pressed="${this.page===p}"><span class="ring">${i}</span>${T(t)}</button>`).join('')}</footer></ha-card>`;
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
  window.customCards.push({type:'braumeister-display-card',name:'Braumeister Display',description:'Live display and smart plug, version 0.7.0-beta.11'});
})();
