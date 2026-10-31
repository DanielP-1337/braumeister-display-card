const assert=require('node:assert/strict');
const registry={};
global.customElements={get:key=>registry[key],define:(key,value)=>registry[key]=value};
global.window={};global.document={createElement:name=>new registry[name]()};
global.CustomEvent=class{constructor(type,options){this.type=type;Object.assign(this,options);}};
global.HTMLElement=class{
 attachShadow(){this.listeners={};this.shadowRoot={innerHTML:'',addEventListener:(name,fn)=>this.listeners[name]=fn};}
 dispatchEvent(event){this.events??=[];this.events.push(event);}
};
global.fetch=async()=>({ok:false});
require('./dist/braumeister-display-card.js');
(async()=>{
 const Card=registry['braumeister-display-card'];
 const config={type:'custom:braumeister-display-card',title:'My brewery',entities:{step:'sensor.step'},language:'en-US',extra:{keep:true}};
 const original=JSON.stringify(config),card=new Card();
 card.setConfig(config);card.hass={states:{}};await card._languageReady;
 const screen=()=>card.shadowRoot.innerHTML.split('<div class="screen">')[1].split('<footer>')[0];
 const originalScreen=screen();
 for(const [input,expected] of [[undefined,'#f4f4f4'],['default','#f4f4f4'],['off','#666666'],['#12ABef','#12abef'],['red','#f4f4f4'],['#fff','#f4f4f4'],['</style><script>bad</script>','#f4f4f4']]){
  card.setConfig({...config,button_color:input});
  assert(card.shadowRoot.innerHTML.includes(`border:5px solid ${expected}`));
  assert(!card.shadowRoot.innerHTML.includes('<script>'));
  assert.equal(screen(),originalScreen,'LCD markup must stay unchanged');
  assert(card.shadowRoot.innerHTML.includes('text-decoration:underline'));
 }
 // Real HA state updates must redraw rings without changing persisted config.
 for(const saved of ['#00cfff','default','off']) {
  const powerConfig={...config,button_color:saved,entities:{...config.entities,plug:'switch.brew',connection:'sensor.cloud'}};
  const before=JSON.stringify(powerConfig);
  card.setConfig(powerConfig);
  const update=(plug,cloud)=>{card.hass={states:{...(plug===undefined?{}:{'switch.brew':{state:plug}}),'sensor.cloud':{state:cloud}}};};
  const check=(expected,active)=>{
   assert(card.shadowRoot.innerHTML.includes(`border:5px solid ${expected}`));
   assert(card.shadowRoot.innerHTML.includes(`.ring{border-color:${active};`));
   assert.equal(JSON.stringify(card.config),before,'Power masking must not mutate the saved configuration');
  };
  const normal=saved==='off'?'#666666':saved==='default'?'#f4f4f4':saved;
  const selected=saved==='default'?'#ffda16':normal;
  for(const page of ['display','recipe','power','details']) {
   card.page=page;
   update('on','online');check(normal,selected);
   update('off','online');check('#666666','#666666');
   update('on','offline');check(normal,selected);
   update('off','offline');check('#666666','#666666');
   for(const uncertain of ['unknown','unavailable',undefined]) {update(uncertain,'offline');check(normal,selected);}
   update('on','online');check(normal,selected);
  }
 }
 console.log('PASS: plug on/off transitions, saved colors preserved, deliberate lights off, all pages, cloud independence and uncertain/missing plug states');
 const editor=Card.getConfigElement();editor.setConfig(config);await editor._languageReady;
 assert.equal((editor.shadowRoot.innerHTML.match(/class="swatch"/g)||[]).length,8);
 assert(editor.shadowRoot.innerHTML.includes('type="color"'));
 editor.listeners.click({target:{closest:()=>({dataset:{color:'#00cfff'}})}});
 const event=editor.events.at(-1);assert.equal(event.type,'config-changed');assert(event.bubbles&&event.composed);
 assert.equal(event.detail.config.button_color,'#00cfff');assert.deepEqual(event.detail.config.entities,config.entities);
 assert.equal(JSON.stringify(config),original);assert.deepEqual(event.detail.config.extra,config.extra);
 const hex={value:'#12Ab34',setCustomValidity(value){this.error=value;},setAttribute(){}},picker={value:''};
 editor.shadowRoot.querySelector=id=>id==='#hex'?hex:picker;editor.shadowRoot.querySelectorAll=()=>[];
 editor.listeners.input({target:Object.assign(hex,{id:'hex'})});assert.equal(editor.config.button_color,'#12ab34');assert.equal(picker.value,'#12ab34');
 const count=editor.events.length;hex.value='bad';editor.listeners.input({target:hex});assert.equal(editor.events.length,count);assert(hex.error);
 editor.shadowRoot.innerHTML='still mounted';editor.setConfig({...editor.config});assert.equal(editor.shadowRoot.innerHTML,'still mounted','HA config echo must not close native picker');
 for(const language of ['de','fr','es','it','pt','pl','nl','en-US']){
  editor.setConfig({...config,language});await editor._languageReady;
  const catalog=require(`./i18n/${language}.json`);
  assert.equal(editor.translate('Tastenbeleuchtung'),catalog.Tastenbeleuchtung);
 }
 editor.setConfig({...config,language:'auto'});editor.hass={locale:{language:'de-DE'}};await editor._languageReady;
 assert(editor.shadowRoot.innerHTML.includes('Tastenbeleuchtung'));
 editor.hass={locale:{language:'en-US'}};await editor._languageReady;assert(editor.shadowRoot.innerHTML.includes('Button lighting'));
 const restored=new Card();restored.setConfig(event.detail.config);restored.hass={states:{}};assert(restored.shadowRoot.innerHTML.includes('border:5px solid #00cfff'));
 console.log('PASS: ring presets/off/custom HEX, unchanged LCD, safe CSS, editor config preservation/events, picker stability, eight editor catalogs and locale changes');
})().catch(error=>{console.error(error);process.exitCode=1;});
