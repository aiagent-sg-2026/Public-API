import assert from 'node:assert/strict';
import fs from 'node:fs';
import { browser, evidence, root } from './lib/pages-origin-browser.mjs';

const report={origin:'https://yapweijun1996.github.io',publication:'unpublished local app bundle',checks:[],errors:[]};
const unnamed=(nodes)=>nodes.filter(n=>!n.ignored&&['button','combobox','textbox','spinbutton','searchbox','tab','radio','link'].includes(n.role?.value)&&!(n.name?.value||'').trim());
try{
  const live=await browser(root+'/dist');
  try{
    await live.nav('un-sdg-goals'); const r=await live.run(); assert.equal(r.ok,true,r.error); assert.equal(r.data.length,17);
    const dom=await live.ev(`(()=>{const s=document.querySelector('.demo-preview'),c=s.querySelector('.sdg-goals-preview');return {layout:s.dataset.previewLayout,count:Number(c.dataset.goalCount),codes:c.dataset.goalCodes,complete:c.dataset.completeOfficialSet,rows:[...c.querySelectorAll('.sdg-goal-list>li')].map(x=>({code:x.dataset.goalCode,uri:x.dataset.goalUri,title:x.querySelector('h4')?.textContent,description:x.querySelector('p')?.textContent})),generic:(s.innerText||'').includes('UN Sustainable Development Goals record 1'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}})()`);
    assert.equal(dom.layout,'sdg-goals'); assert.equal(dom.count,17); assert.equal(dom.complete,'true'); assert.equal(dom.generic||dom.overflow,false);
    assert.deepEqual(dom.rows,r.data.map(x=>({code:String(x.code),uri:String(x.uri),title:String(x.title),description:String(x.description)})));
    await live.viewport(390,844); assert.equal(await live.ev(`document.documentElement.scrollWidth>document.documentElement.clientWidth+1`),false); assert.equal(unnamed((await live.call('Accessibility.getFullAXTree')).nodes).length,0);
    report.checks.push({id:'un-sdg-goals',source:'live provider',layout:dom.layout,count:17,rawToDom:'exact',mobileOverflow:false,unnamedControls:0});
  }finally{report.errors.push(...live.errors.map(String));await live.close()}

  const url='https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json';
  const sample=[{OBJECT_NAME:'ISS (ZARYA)',OBJECT_ID:'1998-067A',EPOCH:'2026-06-19T12:16:41.638656',MEAN_MOTION:15.49315858,ECCENTRICITY:0.00045965,INCLINATION:51.6332,RA_OF_ASC_NODE:288.5889,ARG_OF_PERICENTER:205.0015,MEAN_ANOMALY:155.0751,CLASSIFICATION_TYPE:'U',NORAD_CAT_ID:25544,ELEMENT_SET_NO:999,REV_AT_EPOCH:57211}];
  const synthetic=await browser(root+'/dist',{fixtures:new Map([[url,{body:sample}]])});
  try{
    await synthetic.nav('celestrak-satellites'); const r=await synthetic.run(); assert.equal(r.ok,true,r.error);
    const dom=await synthetic.ev(`(()=>{const s=document.querySelector('.demo-preview'),c=s.querySelector('.celestrak-satellites-preview'),f=c.querySelector('[data-satellite-index="1"]');return {layout:s.dataset.previewLayout,group:c.dataset.requestedGroup,count:Number(c.dataset.satelliteCount),norad:Number(c.dataset.primaryNoradId),objectId:c.dataset.primaryObjectId,epoch:c.dataset.primaryEpoch,meanMotion:Number(c.dataset.primaryMeanMotionRevDay),inclination:Number(c.dataset.primaryInclinationDegrees),text:f.innerText,generic:(s.innerText||'').includes('CelesTrak Satellite Tracker record 1'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}})()`);
    assert.deepEqual({layout:dom.layout,group:dom.group,count:dom.count,norad:dom.norad,objectId:dom.objectId,epoch:dom.epoch,meanMotion:dom.meanMotion,inclination:dom.inclination},{layout:'satellite-orbits',group:'stations',count:1,norad:25544,objectId:'1998-067A',epoch:sample[0].EPOCH,meanMotion:sample[0].MEAN_MOTION,inclination:sample[0].INCLINATION});
    assert(dom.text.includes('rev/day')&&dom.text.includes('Eccentricity')); assert.equal(dom.generic||dom.overflow,false);
    assert.deepEqual(synthetic.fixtureRequests.map(x=>({url:x.url,source:x.source,status:x.status})),[{url,source:'synthetic-fixture',status:200}]); assert.deepEqual(synthetic.blockedProviders,[]);
    await synthetic.viewport(390,844); assert.equal(await synthetic.ev(`document.documentElement.scrollWidth>document.documentElement.clientWidth+1`),false); assert.equal(unnamed((await synthetic.call('Accessibility.getFullAXTree')).nodes).length,0);
    report.checks.push({id:'celestrak-satellites',source:'official-documentation-shaped synthetic fixture',providerRequest:'intercepted; no live cadence-limited probe',layout:dom.layout,rawToDom:'exact fixture',mobileOverflow:false,unnamedControls:0});
  }finally{report.errors.push(...synthetic.errors.map(String));await synthetic.close()}
  assert.deepEqual(report.errors,[]); report.verdict='PASS';
}catch(error){report.verdict='FAIL';report.error=String(error);}
fs.writeFileSync(`${evidence}/sdg-celestrak-verification.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,evidence:`${evidence}/sdg-celestrak-verification.json`},null,2));
process.exit(report.verdict==='PASS'?0:1);
