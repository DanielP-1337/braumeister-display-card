const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const packs = Object.fromEntries(fs.readdirSync(path.join(__dirname,'i18n')).map(file => [file.slice(0,-5),JSON.parse(fs.readFileSync(path.join(__dirname,'i18n',file),'utf8'))]));
const urls=[];
global.fetch=async url=>{urls.push(url);const locale=decodeURIComponent(url.split('/').pop().split('?')[0]).replace(/\.json$/, '');return {ok:!!packs[locale],json:async()=>packs[locale]};};
global.HTMLElement=class{attachShadow(){this.shadowRoot={innerHTML:'',addEventListener(){}};}};
global.window={};const registry={};global.customElements={get:k=>registry[k],define:(k,v)=>registry[k]=v};
require('./braumeister-display-card.js');
const Card=registry['braumeister-display-card'];
(async()=>{
 const bundled=['de','en-US','fr','es','it','pt','pl','nl'];
 for(const locale of bundled)assert(packs[locale],locale);
 const placeholders=text=>[...text.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort();
 for(const [locale,pack] of Object.entries(packs)) {
  if(bundled.includes(locale))assert.deepEqual(Object.keys(pack).sort(),Object.keys(packs['en-US']).sort());
  for(const [key,value] of Object.entries(pack)) {
   assert.equal(typeof value,'string');assert(value.trim());
   assert.deepEqual(placeholders(key),placeholders(value),key);
  }
 }
 const card=new Card();const entities={step:'sensor.step',recipe:'sensor.recipe',connection:'sensor.connection',plug:'switch.plug',temperature:'sensor.temp',target:'sensor.target',behavior:'select.behavior',alarm:'binary_sensor.alarm'};
 const states={
  'sensor.step':{state:'Pumpenpause',attributes:{display_phase:'2. Rast',display_state_code:2820,display_time_target_seconds:2700,display_time_elapsed_seconds:25}},
  'sensor.recipe':{state:'Hopfen kochen',attributes:{}},
  'sensor.connection':{state:'online'},'switch.plug':{state:'on'},
  'sensor.temp':{state:'72.5'},'sensor.target':{state:'72'},
  'select.behavior':{state:'previous',attributes:{options:['off','on','previous','toggle']}},'binary_sensor.alarm':{state:'on'}
 };
 const snapshot=JSON.stringify(states),calls=[];
 const hass={states,locale:{language:'fr'},callService:async(...args)=>calls.push(args)};
 card.setConfig({entities});card.hass=hass;await card._languageReady;
 assert.equal(card.language,'fr');assert.equal(card.label('step'),'Pause de la pompe');
 assert.equal(card.label('recipe'),'Hopfen kochen');
 assert(card.shadowRoot.innerHTML.includes('Hopfen kochen – Palier 2'));
 assert(card.shadowRoot.innerHTML.includes('Alarme signalée'));
 // A language change alone (same entity objects) must redraw the card.
 card.hass={...hass,locale:{language:'nl'}};await card._languageReady;
 assert(card.shadowRoot.innerHTML.includes('Pomppauze'));
 for(const language of bundled) {
  card.setConfig({entities,language});await card._languageReady;
  assert.equal(card.translate('Pumpenpause'),packs[language].Pumpenpause);
  assert.equal(card.translate('Statuscode 6010'),packs[language]['Rezepte bearbeiten']);
  assert.equal(card.translate('Statuscode 6011'),packs[language]['Statuscode {number}'].replace('{number}','6011'));
  assert.equal(card.translate('2. Rast'),packs[language]['{number}. Rast'].replace('{number}','2'));
  assert.equal(card.translate('Hopfen zugeben – 2. Hopfengabe'),packs[language]['Hopfen zugeben – {number}. Hopfengabe'].replace('{number}','2'));
  for(const page of ['display','recipe','details','power']) {card.page=page;card.render();assert(!card.shadowRoot.innerHTML.includes('undefined'));}
 }
 assert.equal(JSON.stringify(states),snapshot,'Localization must not mutate HA data');
 card.setConfig({entities,language:'en-US'});await card._languageReady;
 for(const [key,value] of Object.entries(packs['en-US']))assert.equal(card.translate(key),value,'Embedded English must match editable en-US.json');
 assert.equal(card.number('temperature','°C'),'72.5 °C');
 // Device code 6010: header, body and recipe page translate without modifying data.
 const editStates={...states,'sensor.step':{state:'Statuscode 6010',attributes:{display_phase:'Statuscode 6010',display_state_code:6010}},'sensor.recipe':{state:'Statuscode 6010',attributes:{}}};
 const editSnapshot=JSON.stringify(editStates);
 card.hass={...hass,states:editStates};
 assert.equal(card.state('step'),'Statuscode 6010');
 assert.equal(card.label('recipe'),'Statuscode 6010');
 for(const page of ['display','recipe']) {
  card.page=page;card.render();assert(card.shadowRoot.innerHTML.includes('Edit recipes'));
 }
 card.page='display';card.render();
 assert(card.shadowRoot.innerHTML.includes('Statuscode 6010 – Edit recipes'));
 assert(card.shadowRoot.innerHTML.includes('class="phase">Edit recipes'));

 const hintKey="Bearbeiten von Rezepten ist nur über myspeidel.com oder direkt am Braumeister möglich.";
 for(const language of bundled) {
  card.setConfig({entities,language});await card._languageReady;
  assert(card.shadowRoot.innerHTML.includes(packs[language][hintKey]));
 }
 for(const override of [
  {'sensor.connection':{state:'offline'}},
  {'switch.plug':{state:'off'}},
  {'sensor.step':{state:'Statuscode 6011',attributes:{display_state_code:6011}}},
  {'sensor.step':{state:'unavailable',attributes:{display_state_code:6010}}}
 ]) {
  card.hass={...hass,states:{...editStates,...override}};
  assert(!card.shadowRoot.innerHTML.includes('class="recipe-edit-hint"'));
 }
 card.setConfig({entities,language:'en-US'});await card._languageReady;
 for(const state of ['Statuscode 6010','Rezepte bearbeiten']) {
  card.hass={...hass,states:{...editStates,'sensor.step':{state,attributes:{}}}};
  assert(card.shadowRoot.innerHTML.includes(packs['en-US'][hintKey]));
 }
 card._translations={[hintKey]:'<img src=x onerror=alert(1)>'};card.render();
 assert(card.shadowRoot.innerHTML.includes('&lt;img'));assert(!card.shadowRoot.innerHTML.includes('<img'));
 card._translations={};card.render();
 assert(card.shadowRoot.innerHTML.includes(packs['en-US'][hintKey]));
 assert.equal(JSON.stringify(editStates),editSnapshot);
 card.hass=hass;

 card.setConfig({entities,language:'de-DE'});await card._languageReady;
 assert.equal(card.translate('Pumpenpause'),'Pumpenpause');
 assert.equal(card.number('temperature','°C'),'72,5 °C');
 // New locale files need no JavaScript registry change. Partial packs fall back per key.
 packs.sv={'Pumpenpause':'Pumppaus','Abbruch':'<img src=x onerror=alert(1)>','Zeit':''};
 card.setConfig({entities,language:'sv-SE'});await card._languageReady;
 assert.equal(card.translate('Pumpenpause'),'Pumppaus');assert.equal(card.translate('Zeit'),'Time');
 assert.equal(card.translate('New firmware message'),'New firmware message');
 card.page='display';card.render();assert(card.shadowRoot.innerHTML.includes('&lt;img'));assert(!card.shadowRoot.innerHTML.includes('<img'));
 card.setConfig({entities,language:'xx'});await card._languageReady;
 assert.equal(card.translate('Pumpenpause'),'Pump pause');
 // Shared URL cache: a redraw/second card does not repeatedly fetch missing files.
 const count=urls.length;const other=new Card();other.setConfig({entities,language:'xx'});other.hass=hass;await other._languageReady;assert.equal(urls.length,count);
 // Slow old language response must not overwrite the latest choice.
 let resolve;global.fetch=url=>url.includes('/da.')?new Promise(r=>{resolve=r;}):Promise.reject(Error('offline'));
 card.setConfig({entities,language:'da'});await Promise.resolve();
 card.setConfig({entities,language:'en-US'});await card._languageReady;
 resolve({ok:true,json:async()=>({'Pumpenpause':'Pause'})});await new Promise(r=>setImmediate(r));
 assert.equal(card.translate('Pumpenpause'),'Pump pause');
 card.setConfig({entities,language:'fi'});await card._languageReady;assert.equal(card.translate('Zeit'),'Time');
 // With no language files reachable, the embedded US English catalog still works.
 card.setConfig({entities,language:'fr',i18n_path:'/missing'});await card._languageReady;
 for(const [key,value] of Object.entries(packs['en-US']))assert.equal(card.translate(key),value);
 global.fetch=async()=>({ok:true,json:async()=>{throw new SyntaxError('bad JSON')}});
 card.setConfig({entities,language:'fr',i18n_path:'/malformed'});await card._languageReady;assert.equal(card.translate('Zeit'),'Time');
 card.setConfig({entities,language:'not a locale'});await card._languageReady;assert.equal(card.language,'en-US');
 await card.command('switch','turn_off',{entity_id:entities.plug});
 await card.command('select','select_option',{entity_id:entities.behavior,option:'previous'});
 assert.deepEqual(calls,[['switch','turn_off',{entity_id:'switch.plug'}],['select','select_option',{entity_id:'select.behavior',option:'previous'}]]);
 console.log('PASS: eight catalogs, placeholders, HA language changes, region fallback, US English fallback, custom files, unknown messages, escaping, fetch races/cache/errors, unchanged states and commands');
})().catch(e=>{console.error(e);process.exitCode=1});
