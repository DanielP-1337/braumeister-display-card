const assert=require('node:assert/strict');
const fs=require('node:fs');
global.HTMLElement=class{attachShadow(){this.shadowRoot={innerHTML:'',addEventListener(){}};}};
global.window={};const registry={};global.customElements={get:k=>registry[k],define:(k,v)=>registry[k]=v};
global.fetch=async()=>{throw Error('No external language files installed');};
require('./dist/braumeister-display-card.js');
const Card=registry['braumeister-display-card'];
(async()=>{
 for(const language of ['en-US','de-DE','fr','es','it','pt','pl','nl']) {
  const card=new Card();card.setConfig({language});await card._languageReady;
  const code=language==='de-DE'?'de':language;
  const catalog=JSON.parse(fs.readFileSync(`i18n/${code}.json`,'utf8'));
  assert.equal(card.translate('Rezepte bearbeiten'),catalog['Rezepte bearbeiten']);
  assert.equal(card.translate('Statuscode 6010'),catalog['Rezepte bearbeiten']);
 }
 const card=new Card();card.setConfig({language:'xx'});await card._languageReady;
 assert.equal(card.translate('Rezepte bearbeiten'),'Edit recipes');
 global.fetch=async()=>({ok:true,json:async()=>({'Rezepte bearbeiten':'Custom label'})});
 card.setConfig({language:'de',i18n_path:'/local/custom-test'});await card._languageReady;
 assert.equal(card.translate('Rezepte bearbeiten'),'Custom label');
 assert.equal(card.translate('Zeit'),'Zeit');
 console.log('PASS: HACS single-file bundle, eight offline catalogs, locale fallback and custom overrides');
})().catch(error=>{console.error(error);process.exitCode=1;});
