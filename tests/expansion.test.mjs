import test from 'node:test';import assert from 'node:assert/strict';import {NODES,QUESTS} from '../app/src/main/assets/story.mjs';import * as E from '../app/src/main/assets/engine.mjs';import {walkthrough,pages,pick} from './playthrough.mjs';
for(const ending of ['council','free','crown','king','home','river','beacon'])test('expanded complete journey, twelve side quests, ending '+ending,()=>{
 const s=walkthrough(27,true);assert.ok(QUESTS.every(q=>E.has(s,q.done)),QUESTS.filter(q=>!E.has(s,q.done)).map(q=>q.id).join(','));
 assert.ok([0,1,2,3,4,5].every(i=>E.has(s,'camp_talk_'+i)));
 if(ending==='home')E.go(s,'retreat');else E.advance(s);pick(s,'ending_'+ending);assert.equal(s.ending,ending);assert.ok(E.restore(E.serialize(s)));
});
test('investigation requires all clues and cannot duplicate clue rewards',()=>{
 const s=E.fresh();E.go(s,'forge_search');assert.throws(()=>E.finishInspection(s));E.inspect(s,0);E.inspect(s,0);assert.deepEqual(s.investigations.forge_search,['cups']);
 E.inspect(s,1);E.inspect(s,2);const restored=E.restore(E.serialize(s));E.finishInspection(restored);assert.equal(restored.id,'forge_search_done');assert.ok(E.has(restored,'forge_examined'));
});
test('sluice gates preserve their state and reject unsafe water routes',()=>{
 const s=E.fresh();E.go(s,'lock_puzzle');E.toggleGate(s,1);assert.throws(()=>E.finishMechanism(s));const r=E.restore(E.serialize(s));assert.deepEqual(r.mechanisms.lock_puzzle,[false,true,false]);E.toggleGate(r,1);E.toggleGate(r,0);E.toggleGate(r,2);E.finishMechanism(r);assert.equal(r.id,'lock_done');assert.ok(E.has(r,'river_done'));
});
test('mirror puzzle traces all sixteen configurations; only the intended route reaches the exit',()=>{
 let solutions=0;for(let bits=0;bits<16;bits++){const r=[0,1,2,3].map(i=>(bits>>i)&1),beam=E.beamPath(r);assert.ok(beam.path.length<=24);if(beam.solved){solutions++;assert.deepEqual(r,[0,1,0,1]);}}
 assert.equal(solutions,1);const s=E.fresh();E.go(s,'mirror_puzzle');assert.throws(()=>E.finishBeam(s));[0,1,3].forEach(i=>E.turnMirror(s,i));E.finishBeam(s);assert.equal(s.id,'observatory_done');
});
test('forging has no timer and wrong order costs stamina rather than mana',()=>{
 const s=E.fresh();E.go(s,'bells_puzzle');['cool','cool','cool'].forEach(k=>E.rune(s,k));assert.equal(s.stamina,9);assert.equal(s.mana,8);const r=E.restore(E.serialize(s));['heat','hammer','cool'].forEach(k=>E.rune(r,k));assert.equal(r.inventory.bells,1);assert.ok(E.has(r,'bells_done'));
});
test('crafting is atomic, camp-only and consumes the exact ingredients',()=>{
 const s=E.fresh();assert.throws(()=>E.craft(s,'balm'));E.go(s,'village_map');E.craft(s,'balm');assert.equal(s.inventory.herbs,0);assert.equal(s.inventory.balm,1);const before=E.serialize(s);assert.throws(()=>E.craft(s,'balm'));assert.equal(E.serialize(s).replace(/"savedAt":\d+/,''),before.replace(/"savedAt":\d+/,''));assert.throws(()=>E.craft(s,'missing'));
});
test('foraging happens once per chapter and cannot be rerolled by restoring',()=>{
 const s=E.fresh();E.go(s,'forest_map');E.forage(s);const herbs=s.inventory.herbs,r=E.restore(E.serialize(s));assert.throws(()=>E.forage(r));assert.equal(r.inventory.herbs,herbs);E.go(r,'goblin_map');E.forage(r);assert.equal(r.inventory.herbs,herbs+2);
});
test('fair trade cannot create negative currency',()=>{
 const s=E.fresh();E.go(s,'village_map');E.trade(s,'wire');assert.equal(s.inventory.silver,2);assert.equal(s.inventory.copper_wire,2);E.trade(s,'dew');assert.equal(s.inventory.silver,0);assert.throws(()=>E.trade(s,'bread'));assert.equal(s.inventory.silver,0);
});
test('trusted ally provides one tactical opening per duel',()=>{
 const s=E.fresh();E.apply(s,{flags:['rook_joined'],relations:{rook:1}});E.go(s,'bridge_duel');assert.throws(()=>E.assist(s,'rook'));E.apply(s,{relations:{rook:1}});E.assist(s,'rook');assert.equal(s.duel.hp,4);assert.equal(s.assists,1);assert.throws(()=>E.assist(s,'rook'));const r=E.restore(E.serialize(s));assert.ok(r.duel.assistUsed);
});
test('a sun shard pays for a ward even when mana is empty',()=>{
 const s=E.fresh();s.inventory.ward_shard=1;s.mana=0;E.go(s,'bridge_duel');E.duelMove(s,'ward');assert.equal(s.mana,0);assert.equal(s.inventory.ward_shard,0);assert.equal(s.duel.hp,4);assert.throws(()=>E.duelMove(s,'ward'));
});
test('old version-one mid-duel saves keep progress and gain safe feature defaults',()=>{
 const old={version:1,id:'bridge_duel',page:0,chapter:1,stamina:7,mana:4,wounds:0,inventory:{bread:1,tonic:1},relations:{rook:2,iona:0,mira:0,tessa:1},flags:['rook_joined'],seen:['intro','village_map','road_start','bridge_duel'],taken:['intro:0'],journal:['intro','road_start','bridge_duel'],events:[0],travel:3,rests:1,seed:11,puzzle:[],puzzleMistakes:0,duel:{round:1,hp:4,guard:3,log:null},event:null,ending:null,steps:7};
 const s=E.restore(JSON.stringify(old));assert.ok(s);assert.equal(s.id,old.id);assert.equal(s.stamina,7);assert.equal(s.duel.round,1);assert.equal(s.duel.maxHp,6);assert.deepEqual(s.encounters,[0]);assert.equal(s.inventory.herbs,undefined);E.duelMove(s,'dodge');assert.ok(E.restore(E.serialize(s)));
});
test('all newly introduced story nodes have complete bilingual text and meaningful exits',()=>{
 for(const n of Object.values(NODES)){assert.ok(n.lines.every(t=>t.length===2&&t.every(Boolean)));if(n.kind==='inspect')assert.ok(n.hotspots.every(h=>h.text.every(Boolean)&&h.label.every(Boolean)));if(['inspect','beam','mechanism','forge'].includes(n.kind))assert.ok(NODES[n.win]&&NODES[n.hub]);}
});

test('thirty seeded expanded journeys keep both new endings reachable',()=>{for(let seed=1;seed<=30;seed++){const base=walkthrough(seed,true);for(const id of ['river','beacon']){const s=structuredClone(base);E.advance(s);pick(s,'ending_'+id);assert.equal(s.ending,id)}}});
test('malformed feature maps are rejected safely',()=>{const s=E.fresh();for(const key of ['investigations','mechanisms','beams']){for(const value of [[],true,'bad']){const broken={...s,[key]:value};assert.equal(E.restore(JSON.stringify(broken)),null)}}});
