import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {NODES,CHAPTERS,ITEMS,EVENTS,QUESTS} from '../app/src/main/assets/story.mjs';import ART from '../app/src/main/assets/art.mjs';import * as E from '../app/src/main/assets/engine.mjs';
import {VOICE_JOBS} from '../tools/voice-jobs.mjs';
import {pages,pick,visit,fight,walkthrough} from './playthrough.mjs';

test('all story destinations, localization pairs, item references, and art are valid',()=>{
 for(const n of Object.values(NODES)){
  assert.ok(CHAPTERS[n.ch]);assert.ok(ART[n.art],n.art);assert.ok(n.lines.length);
  for(const t of n.lines)assert.ok(t.length===2&&t.every(x=>typeof x==='string'&&x.trim()),n.id+' missing translation');
  for(const c of [...n.choices,...n.locations||[]]){assert.ok(NODES[c.to],c.to);assert.ok(c.label.length===2&&c.label.every(Boolean));for(const k of Object.keys(c.fx?.items||{}))assert.ok(ITEMS[k],k);}
  for(const k of [n.win,n.lose])if(k)assert.ok(NODES[k]);
 }
 for(const file of Object.values(ART))assert.ok(fs.existsSync('app/src/main/assets/'+file),file);
 const audio=JSON.parse(fs.readFileSync('app/src/main/assets/audio/manifest.json'));assert.equal(Object.keys(audio).length,VOICE_JOBS.length);for(const j of VOICE_JOBS)assert.ok(audio[j.key],j.key);
 for(const file of Object.values(audio))assert.ok(fs.statSync('app/src/main/assets/'+file).size>300,file);
});
for(const ending of ['council','free','crown','king','home'])test('complete six chapters and reach ending: '+ending,()=>{
 const s=walkthrough();assert.ok(QUESTS.filter(q=>!q.expansion).every(q=>E.has(s,q.done)),'all original side quests complete');
 if(ending==='home'){E.go(s,'retreat');pick(s,'ending_home');}else{E.advance(s);pick(s,'ending_'+ending)}
 assert.equal(s.ending,ending);assert.equal(NODES[s.id].kind,'ending');assert.ok(E.restore(E.serialize(s)));
});
test('all optional branches are reachable in the static story graph',()=>{
 const seen=new Set();const walk=id=>{if(seen.has(id))return;seen.add(id);const n=NODES[id];for(const c of [...n.choices,...n.locations||[]])walk(c.to);for(const k of [n.win,n.lose])if(k)walk(k);if(n.kind==='map'){walk(CHAPTERS[n.ch].exit);walk('camp_talk_'+n.ch)}};walk('intro');walk('retreat');assert.equal(seen.size,Object.keys(NODES).length,[...Object.keys(NODES)].filter(k=>!seen.has(k)).join(','));
});
test('no farming relations or supplies by repeating a completed choice',()=>{
 const s=E.fresh();E.go(s,'forge');pages(s);E.choose(s,0);const count=s.inventory.balm;E.go(s,'forge');pages(s);assert.equal(E.available(s,0),'done');assert.throws(()=>E.choose(s,0));assert.equal(s.inventory.balm,count);
});
test('wrong rune sequence persists its cost and never blocks offline completion',()=>{
 const s=E.fresh();s.mana=0;E.go(s,'rune_puzzle');for(const r of ['sun','sun','sun'])E.rune(s,r);assert.equal(s.mana,0);assert.equal(s.puzzleMistakes,1);for(const r of ['leaf','water','sun'])E.rune(s,r);assert.equal(s.id,'rune_open');assert.ok(E.has(s,'runes'));
});
test('duel telegraphs reward correct choices; defeat permits recovery',()=>{
 for(const enemy of ['brambleback','captain','guardian']){
  const s=E.fresh();E.go(s,{brambleback:'bridge_duel',captain:'captain_duel',guardian:'guardian_duel'}[enemy]);
  while(s.duel){E.duelMove(s,E.telegraph(s)[0]==='sweep'?'guard':E.telegraph(s)[0]==='rush'?'dodge':'strike')}
  assert.equal(s.wounds,0);
 }
 const s=E.fresh();E.go(s,'bridge_duel');s.stamina=10;for(const move of ['strike','strike','guard','strike'])if(s.duel)E.duelMove(s,move);assert.equal(s.id,'bridge_loss');assert.equal(s.wounds,1);pick(s,'forest_map');s.stamina=0;s.mana=0;E.rest(s);assert.equal(s.stamina,4);assert.equal(s.mana,2);
});
test('inventory restores resources and cannot consume quest items or act during a duel',()=>{
 const s=E.fresh();s.stamina=1;E.useItem(s,'bread');assert.equal(s.stamina,5);assert.equal(s.inventory.bread,1);s.inventory.ribbon=1;assert.throws(()=>E.useItem(s,'ribbon'));E.go(s,'bridge_duel');assert.throws(()=>E.useItem(s,'bread'));
});
test('save validation rejects corrupt, future-version, and invalid resource states',()=>{
 assert.equal(E.restore('not json'),null);assert.equal(E.restore('null'),null);for(const change of [{version:999},{id:'missing'},{stamina:-1},{mana:11},{wounds:99},{page:9},{chapter:5},{inventory:{unknown:1}}])assert.equal(E.restore(JSON.stringify({...E.fresh(),...change})),null);
 const s=E.fresh();E.go(s,'bridge_duel');E.duelMove(s,'guard');const restored=E.restore(E.serialize(s));assert.deepEqual(restored.duel,s.duel);
});
test('chapter objectives cannot be skipped',()=>{const s=E.fresh();E.go(s,'village_map');assert.equal(E.canAdvance(s),false);assert.throws(()=>E.advance(s));});
test('event choices apply persistent consequences once and survive save reload',()=>{
 for(let i=0;i<EVENTS.length;i++)for(let j=0;j<EVENTS[i].choices.length;j++){let s=E.fresh();s.event={index:i,to:'village_map'};s=E.restore(E.serialize(s));E.eventChoice(s,j);assert.equal(s.event,null);assert.ok(E.restore(E.serialize(s)));assert.throws(()=>E.eventChoice(s,j));}
});
test('thirty seeded complete journeys preserve all mechanics and council eligibility',()=>{for(let seed=1;seed<=30;seed++){const s=walkthrough(seed);E.advance(s);pages(s);assert.equal(E.available(s,0),null);}});
