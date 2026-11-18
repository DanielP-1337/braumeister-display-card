const assert = require('node:assert/strict');
const registry = {};
global.HTMLElement = class { attachShadow() { this.shadowRoot = {innerHTML:'', addEventListener(){}}; } };
global.customElements = {get:k=>registry[k], define:(k,v)=>registry[k]=v};
global.window = {};
global.fetch = async()=>({ok:false});
require('./dist/braumeister-display-card.js');
(async()=>{
  const card = new registry['braumeister-display-card']();
  card.setConfig({language:'en-US', entities:{step:'sensor.step', progress:'sensor.progress', connection:'sensor.connection', connection_warning:'binary_sensor.stale', plug:'switch.plug'}});
  const states = {
    'sensor.step':{state:'Heating',attributes:{display_state_code:2410}},
    'sensor.progress':{state:'10'}, 'sensor.connection':{state:'online'},
    'binary_sensor.stale':{state:'off'}, 'switch.plug':{state:'on'}
  };
  card.hass = {states};
  await card._languageReady;
  for (const value of ['0','10','37.5','100']) {
    states['sensor.progress'].state=value; card.render();
    assert.match(card.shadowRoot.innerHTML, new RegExp(`aria-valuenow="${value}"`));
    assert(card.shadowRoot.innerHTML.includes(`style="width:${value}%"`));
  }
  for (const value of [undefined,null,'',' ','unknown','unavailable','NaN','Infinity','-1','101','10; color:red']) {
    states['sensor.progress'].state=value; card.render();
    assert(!card.shadowRoot.innerHTML.includes('role="progressbar"'));
  }
  states['sensor.progress'].state='50';
  for (const [id,value] of [['sensor.connection','offline'],['binary_sensor.stale','on'],['switch.plug','off'],['sensor.step','unavailable']]) {
    const previous=states[id].state; states[id].state=value; card.render();
    assert(!card.shadowRoot.innerHTML.includes('role="progressbar"'));
    states[id].state=previous;
  }
  card.render();
  assert(card.shadowRoot.innerHTML.includes('aria-label="Reported progress"'));
  console.log('PASS: device progress, bounds, invalid data, offline/stale masking and accessible label');
})().catch(error=>{console.error(error);process.exitCode=1;});
