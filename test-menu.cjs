const assert = require('node:assert/strict');
const registry = {};
global.HTMLElement = class {
  attachShadow() { this.shadowRoot = {innerHTML: '', addEventListener() {}}; }
};
global.customElements = {get: key => registry[key], define: (key, value) => { registry[key] = value; }};
global.fetch = async () => ({ok: false});
global.window = {};
require('./braumeister-display-card.js');

async function test() {
  const card = new registry['braumeister-display-card']();
  const entities = {step: 'sensor.step', connection: 'sensor.connection'};
  const states = {
    'sensor.step': {state: 'Hauptmenü', attributes: {display_state_code: 101}},
    'sensor.connection': {state: 'online', attributes: {}},
  };
  let resolve;
  const calls = [];
  const hass = {
    states, user: {is_admin: true}, services: {braumeister_menu: {navigate: {}}},
    callWS(message) {
      calls.push(message);
      return new Promise(done => { resolve = done; });
    },
  };
  card.setConfig({entities});
  card.hass = hass;
  await card.navigate('open_recipe_selection');
  assert.equal(calls.length, 0);
  card.setConfig({entities, menu_control: true});
  const opening = card.navigate('open_recipe_selection');
  await card.navigate('open_settings');
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    type: 'call_service', domain: 'braumeister_menu', service: 'navigate',
    service_data: {action: 'open_recipe_selection'}, return_response: true,
  });
  assert.match(card.shadowRoot.innerHTML, /data-menu="open_settings" disabled/);
  assert.match(card.shadowRoot.innerHTML, /class="menu-pending"[^>]*data-menu="open_recipe_selection"/);
  assert.equal((card.shadowRoot.innerHTML.match(/class="menu-pending"/g) || []).length, 1);
  resolve({response: {result: 'confirmed', picker: {slot: 1, recipes: {0: 'First', 1: '<Second>'}}}});
  await opening;
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="menu-pending"/);
  assert.doesNotMatch(card.shadowRoot.innerHTML, /<mark>/);
  card.hass = {...hass, states: {...states,
    'sensor.step': {state: 'Rezept auswählen', attributes: {display_state_code: 2015}},
  }};
  assert.match(card.shadowRoot.innerHTML, /<mark>&lt;Second&gt;<\/mark>/);
  card.picker = {slot:8, recipes:Object.fromEntries(Array.from({length:9}, (_,i)=>[i,`Recipe ${i+1}`]))};
  card.render();
  assert.equal((card.shadowRoot.innerHTML.match(/<li>/g)||[]).length,9);
  assert.match(card.shadowRoot.innerHTML, /<mark>Recipe 9<\/mark>/);
  assert.ok(card.shadowRoot.innerHTML.indexOf('Recipe 5') < card.shadowRoot.innerHTML.indexOf('Recipe 6'));
  await card.navigate('select_recipe');
  assert.equal(calls.length, 1);
  card.setConfig({entities, menu_control: true, menu_pending_animation: false});
  const canceling = card.navigate('cancel_recipe_selection');
  assert.doesNotMatch(card.shadowRoot.innerHTML, /class="menu-pending"/);
  assert.match(card.shadowRoot.innerHTML, /data-menu="cancel_recipe_selection" disabled/);
  resolve({response: {result: 'expired'}});
  await canceling;
  assert.equal(card.menuResult, 'expired');
  assert.equal(calls.length, 2);
  card.hass = {...card._hass, user: {is_admin: false}};
  await card.navigate('recipe_down');
  assert.equal(calls.length, 2);
  const manual = (pump, heater) => ({
    ...hass, services: {braumeister_menu: {navigate: {}, set_actuator: {}}},
    states: {...states, 'sensor.step': {state: 'Manueller Betrieb', attributes: {
      display_state_code: 4006, display_pump_flag: pump, display_heater_flag: heater,
    }}},
  });
  card.hass = manual('p', 'h');
  await card.navigate('pump_on');
  assert.equal(calls.length, 2);
  card.setConfig({entities, menu_control: true, manual_pump_control: true, manual_heater_control: true});
  window.confirm = () => false;
  await card.navigate('heater_on');
  await card.navigate('temperature_readings');
  assert.equal(calls.length, 2);
  assert.equal(card.showTemperatureReadings, true);
  card.hass = manual('P', 'i');
  assert.equal(card.actuatorActions().Pumpe, 'pump_off');
  assert.equal(card.actuatorActions().Heizung, 'heater_off');
  const stopping = card.navigate('heater_off');
  assert.equal(calls[2].service, 'set_actuator');
  assert.equal(calls[2].service_data.action, 'heater_off');
  resolve({response: {result: 'confirmed'}});
  await stopping;
  console.log('PASS: opt-in menu routing, pending lock, telemetry, escaping, expiry, and admin gate');
}

test().catch(error => { console.error(error); process.exitCode = 1; });
