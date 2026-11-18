const assert=require('node:assert/strict');
const registry={};
global.HTMLElement=class{attachShadow(){this.shadowRoot={innerHTML:'',addEventListener(){}};}};
global.customElements={get:k=>registry[k],define:(k,v)=>registry[k]=v};
global.window={};global.fetch=async()=>({ok:false});
require('./dist/braumeister-display-card.js');
(async()=>{
 const card=new registry['braumeister-display-card']();
 card.setConfig({language:'en-US',menu_control:true,entities:{step:'s',connection:'c'}});
 let reject;
 const base={user:{is_admin:true},services:{braumeister_menu:{navigate:{}}},callWS:()=>new Promise((_,r)=>reject=r)};
 const update=(code,interrupt=0,editor='000',temperature=30)=>{
   card.hass={...base,states:{s:{state:'step',attributes:{display_state_code:code,display_interrupt:interrupt,display_editor_flags:editor,temperature}},c:{state:'online'}}};
 };
 update(101);await card._languageReady;
 card.menuResult='old failure';update(101,0,'000',31);assert.equal(card.menuResult,'old failure');
 update(3510);assert.equal(card.menuResult,'');assert(!card.shadowRoot.innerHTML.includes('old failure'));
 card.menuResult='pause failure';update(3510,1);assert.equal(card.menuResult,'');
 card.menuResult='editor failure';update(3510,1,'00T');assert.equal(card.menuResult,'');
 update(101);const request=card.navigate('open_manual');assert(card.pending);
 update(4006);assert(card.pending,'screen changes must not release the in-flight lock');
 reject(new Error('late failure'));await request;assert.equal(card.menuResult,'');assert(!card.pending);
 update(101);const returned=card.navigate('open_manual');update(4006);update(101);
 reject(new Error('old screen generation'));await returned;assert.equal(card.menuResult,'');
 const current=card.navigate('open_manual');reject(new Error('current failure'));await current;
 assert.equal(card.menuResult,'current failure');assert(card.shadowRoot.innerHTML.includes('current failure'));
 console.log('PASS: context changes clear status, telemetry updates preserve it, late replies cannot restore old errors, pending lock preserved');
})().catch(e=>{console.error(e);process.exitCode=1;});
