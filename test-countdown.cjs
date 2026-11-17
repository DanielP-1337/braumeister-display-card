const assert = require('node:assert/strict');
const registry = {};
global.HTMLElement = class { attachShadow(){ this.shadowRoot={innerHTML:'',addEventListener(){}}; } };
global.customElements={get:k=>registry[k],define:(k,v)=>registry[k]=v};
global.window={confirm:()=>false};
global.fetch=async()=>({ok:false});
require('./dist/braumeister-display-card.js');
(async()=>{
  const c=new registry['braumeister-display-card']();
  const calls=[];
  const attrs={display_state_code:2120,display_interrupt:0,display_start_delay_seconds:3599};
  const services={navigate:{},program_control:{fields:{action:{selector:{select:{options:[
    'start_delay_up','start_delay_down','confirm_start_delay','cancel_water_prompt','cancel_start_delay'
  ]}}}}}};
  const states={'sensor.step':{state:'Wasser eingefüllt?',attributes:attrs},'sensor.connection':{state:'online'}};
  c.setConfig({language:'en-US',menu_control:true,program_control:true,entities:{step:'sensor.step',connection:'sensor.connection'}});
  c.hass={states,user:{is_admin:true},services:{braumeister_menu:services},callWS:async x=>{calls.push(x);return {response:{result:'confirmed'}};}};
  await c._languageReady;
  c.render();
  assert.match(c.shadowRoot.innerHTML,/Brew starts in/);
  assert.match(c.shadowRoot.innerHTML,/0:59:59/);
  assert(!c.shadowRoot.innerHTML.includes('Delayed-start behavior has not yet been verified'));
  assert.deepEqual(c.menuKeysFor(2120).map(x=>x[2]),['cancel_start_delay','start_now']);
  await c.navigate('start_now'); // Old Companion does not advertise the new action.
  assert.equal(calls.length,0);
  await c.navigate('confirm_start_delay'); // Not available while counting down.
  assert.equal(calls.length,0);
  await c.navigate('cancel_start_delay');
  assert.equal(calls[0].service_data.action,'cancel_start_delay');
  attrs.display_state_code=2111;
  c.render();
  assert(!c.shadowRoot.innerHTML.includes('0:59:59')); // Ignore stale countdown outside 2120.
  await c.navigate('confirm_start_delay');
  assert.equal(calls.length,1); // Explicit user confirmation required.
  window.confirm=()=>true;
  await c.navigate('confirm_start_delay');
  assert.equal(calls[1].service_data.action,'confirm_start_delay');
  attrs.display_state_code=2120; attrs.display_start_delay_seconds=null;
  c.render(); assert(!c.shadowRoot.innerHTML.includes('0:00:00'));
  attrs.display_start_delay_seconds=0;
  c.render(); assert(c.shadowRoot.innerHTML.includes('0:00:00'));
  states['sensor.connection'].state='offline'; c.render();
  assert(!c.shadowRoot.innerHTML.includes('Brew starts in'));
  states['sensor.connection'].state='online';attrs.display_state_code=4007;
  assert.equal(c.actionService('temperature_up'),null); // Old Companion cannot route new actions.
  services.navigate.fields={action:{selector:{select:{options:['temperature_up']}}}};
  await c.navigate('temperature_up');
  assert.equal(calls.at(-1).service_data.action,'temperature_up');
  attrs.display_state_code=2120;
  services.program_control.fields.action.selector.select.options.push('start_now');
  const count=calls.length;
  window.confirm=()=>false;
  await c.navigate('start_now');
  assert.equal(calls.length,count);
  c.config.program_control=false;
  window.confirm=()=>true;
  await c.navigate('start_now');
  assert.equal(calls.length,count);
  c.config.program_control=true;
  let prompt=''; window.confirm=text=>{prompt=text;return true;};
  await c.navigate('start_now');
  assert.equal(calls.at(-1).service_data.action,'start_now');
  assert.match(prompt,/Skip the countdown/);
  console.log('PASS: device countdown, stale/offline masking, cancel, guarded confirmation and manual editor capabilities');
})();
