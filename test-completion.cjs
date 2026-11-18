const assert=require('node:assert/strict');
const registry={};
global.HTMLElement=class{attachShadow(){this.shadowRoot={innerHTML:'',addEventListener(){}};}};
global.customElements={get:k=>registry[k],define:(k,v)=>registry[k]=v};
global.fetch=async()=>({ok:false});global.window={};
require('./dist/braumeister-display-card.js');
(async()=>{
 const card=new registry['braumeister-display-card'](), calls=[];
 const entities={step:'s.step',connection:'s.online',connection_warning:'s.stale'};
 const config={language:'en-US',menu_control:true,program_control:true,entities};
 const options=['acknowledge_hop_addition','confirm_whirlpool','finish_brewing','acknowledge_brew_complete'];
 const service={fields:{action:{selector:{select:{options}}}}};
 const states={'s.step':{state:'Hopfen zugeben',attributes:{}},'s.online':{state:'online'},'s.stale':{state:'off'}};
 const hass={states,user:{is_admin:true},services:{braumeister_menu:{navigate:{},program_control:service}},callWS:async req=>{calls.push(req);return{response:{result:'confirmed'}};}};
 card.setConfig(config);card.hass=hass;await card._languageReady;
 for(const [code,action,number] of [[3080,options[0],2],[3510,options[1],1],[3610,options[2],1],[3450,options[3],2]]){
  states['s.step'].attributes={display_state_code:code,display_interrupt:0};card.render();
  assert.equal(card.menuKeysFor(code).length,number);
  const button=()=>card.shadowRoot.innerHTML.match(new RegExp('<button[^>]*data-menu="'+action+'"[^>]*>'))[0];
  assert(!button().includes('disabled'));
  const before=calls.length;await card.navigate(action);assert.equal(calls.length,before+1);
  assert.equal(calls.at(-1).service,'program_control');assert.deepEqual(calls.at(-1).service_data,{action});
  // Older Companion versions must leave the new action unavailable.
  hass.services.braumeister_menu.program_control={};card.render();assert(button().includes('disabled'));
  await card.navigate(action);assert.equal(calls.length,before+1);
  hass.services.braumeister_menu.program_control=service;
  card.setConfig({...config,program_control:false});assert(button().includes('disabled'));await card.navigate(action);assert.equal(calls.length,before+1);
  card.setConfig(config);states['s.stale'].state='on';card.render();await card.navigate(action);assert.equal(calls.length,before+1);
  states['s.stale'].state='off';hass.user.is_admin=false;card.render();await card.navigate(action);assert.equal(calls.length,before+1);
  hass.user.is_admin=true;states['s.step'].attributes.display_interrupt=1;card.render();await card.navigate(action);assert.equal(calls.length,before+1);
 }
 states['s.step'].attributes={display_state_code:3450,display_interrupt:0};card.render();
 await card.navigate('confirm_whirlpool');assert.equal(calls.length,4);
 assert.equal(card.menuKeysFor(3080)[0][2],'request_program_pause');
 assert(card.menuKeysFor(3080).every(k=>k[2]!=='abort_program'));
 console.log('PASS: hop/Whirlpool/Cheers dispatch, capability, opt-in, stale, admin and paused-state guards; no invented completion controls');
})().catch(e=>{console.error(e);process.exitCode=1;});
