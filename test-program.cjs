const assert = require('node:assert/strict');
const registry = {};
global.HTMLElement = class { attachShadow() { this.shadowRoot={innerHTML:'',addEventListener(){}}; } };
global.customElements={get:k=>registry[k],define:(k,v)=>registry[k]=v};
global.window={confirm:()=>false};
global.fetch=async()=>({ok:false});
require('./dist/braumeister-display-card.js');
(async()=>{
  const card=new registry['braumeister-display-card']();
  const entities={step:'sensor.step',connection:'sensor.connection',connection_warning:'binary_sensor.heartbeat'};
  const calls=[];
  const services={navigate:{}};
  const states={
    'sensor.connection':{state:'online'},
    'binary_sensor.heartbeat':{state:'off'},
    'sensor.step':{state:'Rezept auswählen',attributes:{display_state_code:2015,display_interrupt:0}}
  };
  card.setConfig({language:'en-US',menu_control:true,entities});
  card.hass={states,user:{is_admin:true},services:{braumeister_menu:services},callWS:async v=>{
    calls.push(v); return {response:{result:'confirmed'}};
  }};
  await card._languageReady;
  const screen=(code,interrupt=0)=>{
    states['sensor.step']={state:interrupt?'Automatik angehalten':'Wasser eingefüllt?',attributes:{
      display_state_code:code,display_interrupt:interrupt}};
    card.render();
  };
  for (const [code, label] of [[2930,'Malt pipe removed'],[2960,'Start boil'],[3080,'Hops added'],[3501,'Confirm whirlpool']]) {
    screen(code);
    assert(card.shadowRoot.innerHTML.includes('disabled aria-label="'+label+'"'));
    assert(!card.renderMenu(code).includes('data-menu='));
    screen(code,1);
    assert(!card.shadowRoot.innerHTML.includes('aria-label="'+label+'"'));
  }
  screen(2015);
  assert.equal(card.menuKeysFor(2015).length,4);
  assert.match(card.shadowRoot.innerHTML,/data-menu="select_recipe" disabled/);
  await card.navigate('select_recipe');
  assert.equal(calls.length,0); // Legacy backend never receives an unsupported action.
  services.navigate.fields={action:{selector:{select:{options:['select_recipe']}}}};
  await card.navigate('select_recipe');
  assert.equal(calls[0].service,'navigate');
  screen(2030);
  assert.equal(card.menuKeysFor(2030).length,4);
  assert.match(card.shadowRoot.innerHTML,/data-menu="confirm_water_filled" disabled/);
  await card.navigate('confirm_water_filled');
  assert.equal(calls.length,1);
  services.program_control={fields:{action:{selector:{select:{options:[
    'confirm_water_filled','request_program_pause','abort_program','resume_program'
  ]}}}}};
  // Service availability alone cannot opt into starting/resuming the program.
  await card.navigate('confirm_water_filled');
  assert.equal(calls.length,1);
  card.setConfig({language:'en-US',menu_control:true,program_control:true,entities});
  await card.navigate('confirm_water_filled'); // Rejected browser confirmation.
  assert.equal(calls.length,1);
  window.confirm=()=>true;
  await card.navigate('confirm_water_filled');
  assert.equal(calls[1].service,'program_control');
  for(const code of [2300,2310,2410]) {
    screen(code);
    assert.deepEqual(card.menuKeysFor(code).map(v=>v[2]),['request_program_pause']);
    screen(code,1); // User samples: state unchanged, flags ph, indicator 120.
    assert.deepEqual(card.menuKeysFor(code).map(v=>v[2]),['abort_program','resume_program']);
    assert.match(card.shadowRoot.innerHTML,/class="screen program-paused pulse"/);
    await card.navigate('request_program_pause'); // Must not send the old action from a paused screen.
  }
  const before=calls.length;
  window.confirm=()=>false;
  await card.navigate('abort_program');
  await card.navigate('resume_program');
  assert.equal(calls.length,before);
  window.confirm=()=>true;
  await card.navigate('abort_program');
  assert.equal(calls.at(-1).service_data.action,'abort_program');
  await card.navigate('resume_program'); // Heating-stage resume is not evidenced.
  assert.equal(calls.length,before+1);
  screen(2300,1);
  await card.navigate('resume_program');
  assert.equal(calls.length,before+2);
  assert.equal(calls.at(-1).service,'program_control');
  assert.equal(calls.at(-1).service_data.action,'resume_program');
  screen(2410,2);
  assert.equal(card.menuKeysFor(2410).length,0); // Error is not a resumable pause.
  screen(2410,1);
  states['binary_sensor.heartbeat']={state:'on'};
  card.render();
  await card.navigate('resume_program');
  assert.equal(calls.length,before+2);
  assert.doesNotMatch(card.shadowRoot.innerHTML,/class="screen program-paused/);
  states['binary_sensor.heartbeat']={state:'off'};
  card.setConfig({language:'en-US',menu_control:true,program_alarm_animation:false,entities});
  assert.match(card.shadowRoot.innerHTML,/class="screen program-paused"/);
  // Reported purge status: stopping must work without the start/resume opt-in.
  card.setConfig({language:'de',menu_control:true,entities});
  states['sensor.step']={state:'Pumpe wird entlüftet',attributes:{
    display_state_code:2300,display_interrupt:0,
    display_pump_flag:'P',display_heater_flag:'h'}};
  card.render();
  const purgeButton=card.shadowRoot.innerHTML.match(/<button[^>]*data-menu="request_program_pause"[^>]*>/);
  assert.ok(purgeButton, 'Purge screen offers Cancel');
  assert.doesNotMatch(purgeButton[0], /\bdisabled\b/);
  const purgeCalls=calls.length;
  await card.navigate('request_program_pause');
  assert.equal(calls.length,purgeCalls+1);
  assert.equal(calls.at(-1).service,'program_control');
  assert.deepEqual(calls.at(-1).service_data,{action:'request_program_pause'});
  // Numeric strings previously rendered a key but failed the strict dispatch guard.
  states['sensor.step'].attributes.display_state_code='2300';
  card.render();
  assert.doesNotMatch(card.shadowRoot.innerHTML.match(/<button[^>]*data-menu="request_program_pause"[^>]*>/)[0], /\bdisabled\b/);
  await card.navigate('request_program_pause');
  assert.equal(calls.length,purgeCalls+2);
  for (const invalid of ['', ' 2300', '2300x', '2310']) {
    states['sensor.step'].attributes.display_state_code=invalid;
    await card.navigate('request_program_pause');
    assert.equal(calls.length,purgeCalls+2);
  }
  console.log('PASS: complete stage keys, interrupt 120 pause rendering, explicit backend capability, opt-in/confirmation, stale-state and error gating; reported purge Cancel enabled and dispatched');
})().catch(e=>{console.error(e);process.exitCode=1;});
