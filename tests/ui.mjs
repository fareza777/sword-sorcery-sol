import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {NODES,ITEMS,EVENTS} from '../app/src/main/assets/story.mjs';import * as E from '../app/src/main/assets/engine.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[];const failures=[];let checks=0;
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
await ctx.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:4173');await p.locator('[data-action="new"]').waitFor();
await p.screenshot({path:'dist/01-title.png'});
await p.locator('[data-action="new"]').click();for(let i=0;i<3;i++)await p.locator('[data-action="onboard"]').click();await p.locator('[data-action="begin-chapter"]').click();
assert.equal(await p.evaluate(()=>document.documentElement.lang),'en');
async function current(){return p.evaluate(async()=> (await import('/app.mjs')).getState())}
let fast=false;
async function press(action,extra=''){const selector=`[data-action="${action}"]${extra}`;const inSheet=p.locator('#overlay '+selector);const el=(await inSheet.count()?inSheet:p.locator(selector)).first();if(fast)await el.dispatchEvent('click');else await el.click();}
async function pages(){while(await p.locator('[data-action="next"]').count())await press('next');}
async function pick(to){await pages();const s=await current(),index=NODES[s.id].choices.findIndex(c=>c.to===to);assert.ok(index>=0,s.id+' → '+to);if(!await p.locator(`[data-action="choose"][data-index="${index}"]`).count())await press(index>=2?'choice-more':'choice-previous');await press('choose',`[data-index="${index}"]`);assert.equal((await current()).id,to);}
async function visit(to){let s=await current();while(s.stamina<E.maxStamina(s)||s.mana<10){await press('rest');s=await current()}const i=NODES[s.id].locations.findIndex(c=>c.to===to);assert.ok(i>=0);await press('travel',`[data-index="${i}"]`);s=await current();if(s.event){const j=EVENTS[s.event.index].choices.findIndex(c=>!E.reason(s,c.need));await press('event',`[data-index="${j}"]`)}assert.equal((await current()).id,to);}
async function fight(){for(let i=0;i<6;i++){const s=await current();if(!s.duel)break;const tell=E.telegraph(s)[0],move=tell==='sweep'?'guard':tell==='rush'?'dodge':'strike';await press('duel',`[data-move="${move}"]`)}assert.ok(!(await current()).duel)}
async function nextChapter(){await press('advance');await press('begin-chapter');}
// Actual end-to-end journey through the rendered controls, including all six side quests.
await pick('forge_intro');await pick('village_map');await visit('market');await pick('market_truth');await pick('village_map');await visit('forge');await pick('forge_found');await pick('village_map');await visit('market');await pick('medicine_done');await pick('village_map');await visit('gate');await pick('badge');await pick('village_map');await visit('gate');await pick('gate_promise');await pick('village_map');await nextChapter();
await pick('rook_meet');await pick('forest_map');await visit('fox');await pick('fox_free');await pick('forest_map');await visit('bridge');await pick('bridge_duel');await fight();await pick('bridge_kind');await pick('forest_map');await visit('ferry');await pick('ferry_pass');await pick('forest_map');await nextChapter();
await pick('goblin_table');await pick('goblin_map');await p.screenshot({path:'dist/03-goblin-map.png'});await visit('council');await pick('council_yes');await pick('goblin_map');await visit('waterwheel');await pick('bell_found');await pick('goblin_map');await visit('child');await pick('child_done');await pick('goblin_map');await visit('memorial');await pick('names_done');await pick('goblin_map');await nextChapter();
await pick('iona_truth');await pick('tower_map');await visit('apprentice');await pick('apprentice_done');await pick('tower_map');await visit('study');await pick('letter_found');await pick('letter_honest');await pick('tower_map');await visit('rune_intro');await pick('rune_puzzle');for(const k of ['leaf','water','sun'])await press('rune',`[data-rune="${k}"]`);await pick('tower_map');await nextChapter();
await pick('castle_map');await visit('guard');await pick('varric_exposed');await pick('captain_duel');await p.screenshot({path:'dist/04-duel.png'});await fight();await pick('captain_aftermath');await pick('castle_map');await visit('gardener');await pick('garden_done');await pick('castle_map');await visit('workshop');await pick('mira_free');await pages();await press('choose','[data-index="1"]');await pick('castle_map');await nextChapter();
await pick('crown_map');await visit('balcony');await pick('mira_future');await pick('crown_map');await visit('guardian');await pick('guardian_song');await pick('crown_map');await visit('seal_intro');await pick('seal_puzzle');for(const k of ['water','leaf','sun'])await press('rune',`[data-rune="${k}"]`);await pick('crown_map');await press('advance');
const finalState=await current();await pick('ending_council');await pages();assert.equal((await current()).ending,'council');await p.screenshot({path:'dist/05-ending.png'});
// Resume is byte-for-byte accurate for narrative location and resources.
const saved=await current();await p.reload();await press('continue');const resumed=await current();for(const k of ['id','page','stamina','mana','wounds'])assert.equal(resumed[k],saved[k]);
await press('inventory');assert.ok(await p.locator('.inventory-item').count());await press('close');await press('relations');await press('close');await press('journal');assert.equal(await p.locator('.quest.done').count(),6);await press('close');
console.log('Rendered journey: all chapters, six side quests, council ending, resume, inventory, journal, and bonds passed.');
// Inspect every story beat in both languages, small/normal screens, and normal/larger text.
const variants=[
 {w:360,h:640,lang:'en',large:false},{w:360,h:640,lang:'id',large:false},
 {w:360,h:640,lang:'en',large:true},{w:360,h:640,lang:'id',large:true},
 {w:390,h:844,lang:'en',large:false},{w:390,h:844,lang:'id',large:true}
];
fast=true;
for(const v of variants){
 await p.setViewportSize({width:v.w,height:v.h});
 await press('pause');await press('settings');await p.locator('#language').selectOption(v.lang);if(await p.locator('#pref-large').isChecked()!==v.large)await p.locator('#pref-large').click();await press('close');
 for(const n of Object.values(NODES)){
  const s=E.fresh(12);s.inventory=Object.fromEntries(Object.keys(ITEMS).map(k=>[k,2]));s.relations={rook:8,iona:8,mira:8,tessa:8};E.go(s,n.id);s.page=n.lines.length-1;
  if(n.kind==='ending')s.ending=n.id.replace('ending_','');
  await press('pause');await press('home');await p.evaluate(s=>localStorage.setItem('sunward.save.v1',s),E.serialize(s));await press('continue');await p.locator('.screen').waitFor();assert.equal((await current()).id,n.id);
  await p.waitForFunction(()=>[...document.querySelectorAll('#app img')].every(i=>i.complete));
  const issues=await p.evaluate(()=>{
   const screen=document.querySelector('.screen'),h=innerHeight,w=innerWidth;const issues=[];
   if(screen.scrollHeight>screen.clientHeight+2)issues.push('screen overflow '+screen.scrollHeight+'/'+screen.clientHeight);
   for(const el of document.querySelectorAll('#app button,#app p,#app h2,#app .bottomnav')){const b=el.getBoundingClientRect();if(b.bottom>h+1||b.right>w+1||b.top<0||b.left<0)issues.push(el.className+' outside '+JSON.stringify({x:b.x,y:b.y,w:b.width,h:b.height}));}
   for(const img of document.querySelectorAll('#app img'))if(!img.complete||!img.naturalWidth)issues.push('image missing '+img.src);
   return issues;
  });
  checks++;if(issues.length){failures.push({variant:v,node:n.id,issues});if(failures.length<=3)await p.screenshot({path:`dist/layout-failure-${failures.length}.png`});}
 }
 console.log(`Layout ${v.w}×${v.h} ${v.lang} large=${v.large}: ${Object.keys(NODES).length} beats checked.`);
 await fs.writeFile('dist/ui-test-report.json',JSON.stringify({checks,variants,failures,errors,stage:'layout'},null,2));
}
fast=false;
// Locked council option still fits; all five endings can be selected through real UI.
await p.setViewportSize({width:390,height:844});
for(const ending of ['free','crown','king','home']){
 const s=structuredClone(finalState);if(ending==='home')E.go(s,'retreat');
 await press('pause');await press('home');await p.evaluate(s=>localStorage.setItem('sunward.save.v1',s),E.serialize(s));await press('continue');await pick('ending_'+ending);await pages();assert.equal((await current()).ending,ending);
}
// System language and localized settings are exercised through the UI.
await press('pause');await press('settings');await p.locator('#language').selectOption('id');assert.equal(await p.locator('.sheet h2').innerText(),'Atur sesukamu');await p.locator('#language').selectOption('system');assert.equal(await p.evaluate(()=>document.documentElement.lang),'en');await press('close');
assert.deepEqual(errors,[],'browser errors');
await fs.writeFile('dist/ui-test-report.json',JSON.stringify({checks,variants,failures,errors,renderedEndings:5,sideQuests:6,externalRequestsAllowed:false},null,2));
await browser.close();assert.deepEqual(failures,[],'layout failures; see dist/ui-test-report.json');console.log(`PASS: ${checks} layout checks; five endings; no browser errors.`);
