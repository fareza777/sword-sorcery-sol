import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {NODES,CHAPTERS,ITEMS,EVENTS,QUESTS} from '../app/src/main/assets/story.mjs';import ART from '../app/src/main/assets/art.mjs';import * as E from '../app/src/main/assets/engine.mjs';
export const pages=s=>{while(E.nextPage(s));};
export function pick(s,to){pages(s);const i=NODES[s.id].choices.findIndex(c=>c.to===to);assert.ok(i>=0,`No choice ${s.id} → ${to}`);E.choose(s,i);assert.ok(E.restore(E.serialize(s)),'save should round trip '+s.id);}
export function visit(s,to){assert.equal(NODES[s.id].kind,'map');while(s.stamina<E.maxStamina(s)||s.mana<10)E.rest(s);const i=NODES[s.id].locations.findIndex(c=>c.to===to);assert.ok(i>=0);E.travel(s,i);if(s.event){const ev=EVENTS[s.event.index];E.eventChoice(s,ev.choices.findIndex(c=>!E.reason(s,c.need)));}}
export const fight=s=>{for(const move of ['guard','dodge','strike','ward','guard','guard']){if(NODES[s.id].kind!=='duel')break;E.duelMove(s,move)}assert.notEqual(NODES[s.id].kind,'duel');};
export function walkthrough(seed=17){
 const s=E.fresh(seed);E.go(s,'intro');pick(s,'forge_intro');pick(s,'village_map');
 visit(s,'market');pick(s,'market_truth');pick(s,'village_map');visit(s,'forge');pick(s,'forge_found');pick(s,'village_map');visit(s,'market');pick(s,'medicine_done');pick(s,'village_map');visit(s,'gate');pick(s,'badge');pick(s,'village_map');visit(s,'gate');pick(s,'gate_promise');pick(s,'village_map');E.advance(s);
 pick(s,'rook_meet');pick(s,'forest_map');visit(s,'fox');pick(s,'fox_free');pick(s,'forest_map');visit(s,'bridge');pick(s,'bridge_duel');fight(s);pick(s,'bridge_kind');pick(s,'forest_map');visit(s,'ferry');pick(s,'ferry_pass');pick(s,'forest_map');E.advance(s);
 pick(s,'goblin_table');pick(s,'goblin_map');visit(s,'council');pick(s,'council_yes');pick(s,'goblin_map');visit(s,'waterwheel');pick(s,'bell_found');pick(s,'goblin_map');visit(s,'child');pick(s,'child_done');pick(s,'goblin_map');visit(s,'memorial');pick(s,'names_done');pick(s,'goblin_map');E.advance(s);
 pick(s,'iona_truth');pick(s,'tower_map');visit(s,'apprentice');pick(s,'apprentice_done');pick(s,'tower_map');visit(s,'study');pick(s,'letter_found');pick(s,'letter_honest');pick(s,'tower_map');visit(s,'rune_intro');pick(s,'rune_puzzle');for(const r of ['leaf','water','sun'])E.rune(s,r);pick(s,'tower_map');E.advance(s);
 pick(s,'castle_map');visit(s,'guard');pick(s,'varric_exposed');pick(s,'captain_duel');fight(s);pick(s,'captain_aftermath');pick(s,'castle_map');visit(s,'gardener');pick(s,'garden_done');pick(s,'castle_map');visit(s,'workshop');pick(s,'mira_free');pages(s);E.choose(s,1);pick(s,'castle_map');E.advance(s);
 pick(s,'crown_map');visit(s,'balcony');pick(s,'mira_future');pick(s,'crown_map');visit(s,'guardian');pick(s,'guardian_song');pick(s,'crown_map');visit(s,'seal_intro');pick(s,'seal_puzzle');for(const r of ['water','leaf','sun'])E.rune(s,r);pick(s,'crown_map');return s;
}
test('all story destinations, localization pairs, item references, and art are valid',()=>{
 for(const n of Object.values(NODES)){
  assert.ok(CHAPTERS[n.ch]);assert.ok(ART[n.art],n.art);assert.ok(n.lines.length);
  for(const t of n.lines)assert.ok(t.length===2&&t.every(x=>typeof x==='string'&&x.trim()),n.id+' missing translation');
  for(const c of [...n.choices,...n.locations||[]]){assert.ok(NODES[c.to],c.to);assert.ok(c.label.length===2&&c.label.every(Boolean));for(const k of Object.keys(c.fx?.items||{}))assert.ok(ITEMS[k],k);}
  for(const k of [n.win,n.lose])if(k)assert.ok(NODES[k]);
 }
 for(const file of Object.values(ART))assert.ok(fs.existsSync('app/src/main/assets/'+file),file);
 const audio=JSON.parse(fs.readFileSync('app/src/main/assets/audio/manifest.json'));assert.equal(Object.keys(audio).length,160);
 for(const file of Object.values(audio))assert.ok(fs.statSync('app/src/main/assets/'+file).size>300,file);
});
for(const ending of ['council','free','crown','king','home'])test('complete six chapters and reach ending: '+ending,()=>{
 const s=walkthrough();assert.ok(QUESTS.every(q=>E.has(s,q.done)),'all side quests complete');
 if(ending==='home'){E.go(s,'retreat');pick(s,'ending_home');}else{E.advance(s);pick(s,'ending_'+ending)}
 assert.equal(s.ending,ending);assert.equal(NODES[s.id].kind,'ending');assert.ok(E.restore(E.serialize(s)));
});
test('all optional branches are reachable in the static story graph',()=>{
 const seen=new Set();const walk=id=>{if(seen.has(id))return;seen.add(id);const n=NODES[id];for(const c of [...n.choices,...n.locations||[]])walk(c.to);for(const k of [n.win,n.lose])if(k)walk(k);if(n.kind==='map')walk(CHAPTERS[n.ch].exit);};walk('intro');walk('retreat');assert.equal(seen.size,Object.keys(NODES).length,[...Object.keys(NODES)].filter(k=>!seen.has(k)).join(','));
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
