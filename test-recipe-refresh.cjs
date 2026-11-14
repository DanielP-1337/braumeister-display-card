const assert=require('node:assert/strict');
const registry={};
global.HTMLElement=class {attachShadow(){this.shadowRoot={innerHTML:'',addEventListener(){}};}};
global.customElements={get:k=>registry[k],define:(k,v)=>registry[k]=v};
global.fetch=async()=>({ok:false}); global.window={};
require('./dist/braumeister-display-card.js');
(async()=>{
 const card=new registry['braumeister-display-card']();
 card.setConfig({menu_control:true,entities:{step:'sensor.step',connection:'sensor.connection'}});
 const calls=[]; let resolve;
 const hass={user:{is_admin:true},services:{braumeister_menu:{navigate:{},get_recipe_picker:{}}},
  states:{'sensor.connection':{state:'online'},'sensor.step':{state:'Rezept auswählen',attributes:{display_state_code:2015}}},
  callWS:async args=>{calls.push(args);return new Promise(r=>resolve=r);}};
 card.hass=hass;
 assert.equal(calls.length,1);
 assert.equal(calls[0].service,'get_recipe_picker');
 assert.deepEqual(calls[0].service_data,{});
 card.hass={...hass}; assert.equal(calls.length,1);
 resolve({response:{picker:{slot:8,recipes:{8:'Ninth'}}}});
 await new Promise(r=>setImmediate(r));
 assert.match(card.shadowRoot.innerHTML,/<mark>Ninth<\/mark>/);
 // A fresh browser instance receives only one Companion name, but the explicitly
 // configured integration sensor already has the complete same-device list.
 card.setConfig({menu_control:true,entities:{step:'sensor.step',connection:'sensor.connection',recipes:'sensor.recipes'}});
 const recipes=Array.from({length:9},(_,slot)=>({slot,name:slot===8?'Ninth':`Recipe ${slot+1}`}));
 const complete={...hass,states:{...hass.states,'sensor.recipes':{state:'9',attributes:{recipes}}}};
 card.hass=complete;
 assert.equal((card.shadowRoot.innerHTML.match(/<li>/g)||[]).length,9);
 assert.match(card.shadowRoot.innerHTML,/<mark>Ninth<\/mark>/);
 const previousPicker=card.picker;
 card.picker=null; card.render();
 assert.equal((card.shadowRoot.innerHTML.match(/<li>/g)||[]).length,9);
 assert.doesNotMatch(card.shadowRoot.innerHTML,/<mark>/);
 card.picker=previousPicker;
 card.hass={...complete,states:{...complete.states,'sensor.recipes':{state:'unavailable',attributes:{recipes}}}};
 assert.equal((card.shadowRoot.innerHTML.match(/<li>/g)||[]).length,1);
 card.hass={...complete,states:{...complete.states,'sensor.recipes':{state:'9',attributes:{recipes:[...recipes.slice(0,8),{slot:8,name:'<Ninth>'}]}}}};
 assert.match(card.shadowRoot.innerHTML,/<mark>&lt;Ninth&gt;<\/mark>/);
 card.hass={...complete,states:{...complete.states,'sensor.recipes':{state:'2',attributes:{recipes:[recipes[0],recipes[0]]}}}};
 assert.equal((card.shadowRoot.innerHTML.match(/<li>/g)||[]).length,1);
 card.hass={...hass}; assert.equal(calls.length,1);
 card.pickerReadAt=0; card.hass={...hass}; assert.equal(calls.length,2);
 card.hass={...hass,states:{...hass.states,'sensor.step':{state:'Menu',attributes:{display_state_code:101}}}};
 resolve({response:{picker:{slot:0,recipes:{0:'Obsolete'}}}});
 await new Promise(r=>setImmediate(r));
 assert.equal(card.picker,null);
 assert.doesNotMatch(card.shadowRoot.innerHTML,/Obsolete/);
 console.log('PASS: recipe snapshot on dashboard load, read-only request, throttling and stale response rejection');
})().catch(e=>{console.error(e);process.exitCode=1;});
