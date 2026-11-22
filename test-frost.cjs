const assert = require('node:assert/strict');
const registry = {};
global.customElements = {get: k => registry[k], define: (k,v) => registry[k] = v};
global.HTMLElement = class {
  attachShadow(){ this.shadowRoot = {innerHTML:'', addEventListener(){}}; }
};
global.window = {};
require('./dist/braumeister-display-card.js');

const card = new registry['braumeister-display-card']();
const entities = {step:'sensor.step', connection:'sensor.link', temperature:'sensor.water',
  alarm:'binary_sensor.alarm'};
const attrs = {display_state_code:2120, display_start_delay_seconds:7200, display_interrupt:0};
let states = {
  'sensor.step':{state:'Water added?',attributes:attrs},
  'sensor.link':{state:'online'},
  'sensor.water':{state:'2',attributes:{unit_of_measurement:'°C'}},
  'binary_sensor.alarm':{state:'off',attributes:{}}
};
const configure = (settings={}) => card.setConfig({entities,language:'en-US',...settings});
const update = (id,data) => {
  states = {...states,[id]:data};
  card.hass = {states};
};
const frame = () => card.shadowRoot.innerHTML.match(/<div class="screen([^"]*)">/)[1].trim();
const water = (state,unit) => update('sensor.water',{state,attributes:{unit_of_measurement:unit}});
configure();
card.hass = {states};
assert.equal(frame(),'');
configure({frost_enabled:true});
assert.equal(frame(),'frost');
card.page = 'recipe';
water('39.2','°F'); // 4 °C, still within hysteresis.
assert.equal(frame(),'frost');
assert.equal(card.page,'recipe');
water('41','°F');
assert.equal(frame(),'');
water('35','°F');
assert.equal(frame(),'frost');
for (const reading of ['unknown','unavailable','',null,'NaN']) {
  water(reading,'°C');
  assert.equal(frame(),'');
}
water('1',undefined);
assert.equal(frame(),'');
water('0','°C');
update('binary_sensor.alarm',{state:'on',attributes:{alarm_type:'other'}});
assert.match(frame(),/^program-paused/);
assert.doesNotMatch(card.shadowRoot.innerHTML, /role="status">Frost/);
update('binary_sensor.alarm',{state:'off',attributes:{}});
configure({frost_enabled:true,entities:{...entities,frost_timer:'timer.warning'}});
assert.equal(frame(),'');
water('15','°C');
update('timer.warning',{state:'active'});
assert.equal(frame(),'frost');
update('sensor.link',{state:'offline'});
assert.equal(frame(),'');
update('sensor.link',{state:'online'});
for (const delta of [{display_state_code:2030},{display_start_delay_seconds:0},{display_start_delay_seconds:null}]) {
  update('sensor.step',{state:'Waiting',attributes:{...attrs,...delta}});
  assert.equal(frame(),'');
}
console.log('PASS frost opt-in, °C/°F, hysteresis, missing data, forecast timer, red priority and countdown scope');
