const assert = require('node:assert/strict');
const registry = {};
global.HTMLElement = class { attachShadow() { this.shadowRoot = {innerHTML:'', addEventListener(){}}; } };
global.customElements = {get:k=>registry[k], define:(k,v)=>registry[k]=v};
global.window = {};
global.fetch = async()=>({ok:false});
require('./dist/braumeister-display-card.js');
(async()=>{
  const card = new registry['braumeister-display-card']();
  card.setConfig({language:'en-US', menu_control:true, manual_pump_control:true,
    manual_heater_control:true, entities:{
    connection:'sensor.connection', connection_warning:'binary_sensor.heartbeat',
    step:'sensor.step', temperature:'sensor.temp'}});
  const states = {
    'sensor.connection':{state:'online',attributes:{}},
    'binary_sensor.heartbeat':{state:'off',attributes:{}},
    'sensor.step':{state:'Manual',attributes:{display_state_code:4006,
      display_pump_flag:'P', display_heater_flag:'i', display_clock:'12:05'}},
    'sensor.temp':{state:'42',attributes:{}}
  };
  card.hass = {states,user:{is_admin:true},services:{braumeister_menu:{navigate:{},set_actuator:{}}}};
  await card._languageReady;
  assert(card.menuAvailable());
  assert.deepEqual(card.actuatorActions(), {Pumpe:'pump_off', Heizung:'heater_off'});
  assert(card.shadowRoot.innerHTML.includes('>12:05</time>'));
  states['sensor.temp']={state:'107.6',attributes:{unit_of_measurement:'°F'}};
  card.render();
  assert(card.shadowRoot.innerHTML.includes('107.6 °F'));
  assert(!card.shadowRoot.innerHTML.includes('107.6 °C'));
  for(const page of ['display','recipe','power','details']) {
    card.page=page;
    states['binary_sensor.heartbeat']={state:'on',attributes:{activity_at_risk:true}};
    card.render();
    assert(!card.menuAvailable());
    assert(card.shadowRoot.innerHTML.includes('Connection to Braumeister lost'));
    assert(card.shadowRoot.innerHTML.includes('Current device state is unknown'));
    assert(card.shadowRoot.innerHTML.includes('role="alert"'));
    assert(!card.shadowRoot.innerHTML.includes('42 °C'));
  }
  states['binary_sensor.heartbeat']={state:'unavailable',attributes:{}};
  card.render();
  assert(card.shadowRoot.innerHTML.includes('Device connection not yet verified'));
  assert(!card.menuAvailable());
  states['binary_sensor.heartbeat']={state:'off',attributes:{}};
  card.render();
  assert(card.menuAvailable());
  assert(!card.shadowRoot.innerHTML.includes('Connection to Braumeister lost'));
  console.log('PASS: heartbeat warning on every tab, last-known risk, stale masking, fail-closed controls and recovery');
})().catch(e=>{console.error(e);process.exitCode=1;});
