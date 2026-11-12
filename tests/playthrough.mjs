import assert from 'node:assert/strict';import {NODES,CHAPTERS,EVENTS} from '../app/src/main/assets/story.mjs';import * as E from '../app/src/main/assets/engine.mjs';
export const pages=s=>{while(E.nextPage(s));};
export function pick(s,to){pages(s);const i=NODES[s.id].choices.findIndex(c=>c.to===to);assert.ok(i>=0,`No choice ${s.id} → ${to}`);E.choose(s,i);assert.ok(E.restore(E.serialize(s)),'save should round trip '+s.id);}
export function visit(s,to){assert.equal(NODES[s.id].kind,'map');while(s.stamina<E.maxStamina(s)||s.mana<10)E.rest(s);const i=NODES[s.id].locations.findIndex(c=>c.to===to);assert.ok(i>=0);E.travel(s,i);if(s.event){const ev=EVENTS[s.event.index];E.eventChoice(s,ev.choices.findIndex(c=>!E.reason(s,c.need)));}}
export const fight=s=>{for(const move of ['guard','dodge','strike','ward','guard','guard']){if(NODES[s.id].kind!=='duel')break;E.duelMove(s,move)}assert.notEqual(NODES[s.id].kind,'duel');};
export function walkthrough(seed=17,expanded=false){
 const s=E.fresh(seed);E.go(s,'intro');pick(s,'forge_intro');pick(s,'village_map');
 visit(s,'market');pick(s,'market_truth');pick(s,'village_map');visit(s,'forge');pick(s,'forge_found');pick(s,'village_map');visit(s,'market');pick(s,'medicine_done');pick(s,'village_map');visit(s,'gate');pick(s,'badge');pick(s,'village_map');visit(s,'gate');pick(s,'gate_promise');pick(s,'village_map');if(expanded)extra(s,0);E.advance(s);
 pick(s,'rook_meet');pick(s,'forest_map');visit(s,'fox');pick(s,'fox_free');pick(s,'forest_map');visit(s,'bridge');pick(s,'bridge_duel');fight(s);pick(s,'bridge_kind');pick(s,'forest_map');visit(s,'ferry');pick(s,'ferry_pass');pick(s,'forest_map');if(expanded)extra(s,1);E.advance(s);
 pick(s,'goblin_table');pick(s,'goblin_map');visit(s,'council');pick(s,'council_yes');pick(s,'goblin_map');visit(s,'waterwheel');pick(s,'bell_found');pick(s,'goblin_map');visit(s,'child');pick(s,'child_done');pick(s,'goblin_map');visit(s,'memorial');pick(s,'names_done');pick(s,'goblin_map');if(expanded)extra(s,2);E.advance(s);
 pick(s,'iona_truth');pick(s,'tower_map');visit(s,'apprentice');pick(s,'apprentice_done');pick(s,'tower_map');visit(s,'study');pick(s,'letter_found');pick(s,'letter_honest');pick(s,'tower_map');visit(s,'rune_intro');pick(s,'rune_puzzle');for(const r of ['leaf','water','sun'])E.rune(s,r);pick(s,'tower_map');if(expanded)extra(s,3);E.advance(s);
 pick(s,'castle_map');visit(s,'guard');pick(s,'varric_exposed');pick(s,'captain_duel');fight(s);pick(s,'captain_aftermath');pick(s,'castle_map');visit(s,'gardener');pick(s,'garden_done');pick(s,'castle_map');visit(s,'workshop');pick(s,'mira_free');pages(s);E.choose(s,1);pick(s,'castle_map');if(expanded)extra(s,4);E.advance(s);
 pick(s,'crown_map');visit(s,'balcony');pick(s,'mira_future');pick(s,'crown_map');visit(s,'guardian');pick(s,'guardian_song');pick(s,'crown_map');visit(s,'seal_intro');pick(s,'seal_puzzle');for(const r of ['water','leaf','sun'])E.rune(s,r);pick(s,'crown_map');if(expanded)extra(s,5);return s;
}
function search(s){for(let i=0;i<NODES[s.id].hotspots.length;i++)E.inspect(s,i);E.finishInspection(s);}
function extra(s,ch){
 const hub=CHAPTERS[ch].hub;
 if(ch===0){visit(s,'forge');pick(s,'forge_search');search(s);pick(s,hub);visit(s,'gate');pick(s,'gate_search');search(s);pick(s,hub);}
 if(ch===1){visit(s,'cart_start');pick(s,'cart_saved');pick(s,hub);visit(s,'spring');pick(s,'spring_done');pick(s,hub);visit(s,'shrine');pick(s,'sentinel_repair');pick(s,hub);}
 if(ch===2){visit(s,'lock_start');pick(s,'lock_puzzle');E.toggleGate(s,0);E.toggleGate(s,2);E.finishMechanism(s);pick(s,hub);visit(s,'archive');pick(s,'archive_search');search(s);pick(s,'festival');pick(s,'festival_promise');pick(s,hub);}
 if(ch===3){visit(s,'observatory');pick(s,'mirror_puzzle');[0,1,3].forEach(i=>E.turnMirror(s,i));E.finishBeam(s);pick(s,hub);visit(s,'aviary');pick(s,'bird_done');pick(s,hub);}
 if(ch===4){visit(s,'kitchen');pick(s,'kitchen_search');search(s);pick(s,hub);visit(s,'prison');pick(s,'wren_free');pick(s,hub);visit(s,'dock');pick(s,'dock_done');pick(s,hub);}
 if(ch===5){visit(s,'bells_start');pick(s,'bells_puzzle');['heat','hammer','cool'].forEach(k=>E.rune(s,k));pick(s,hub);}
 E.go(s,'camp_talk_'+ch);pick(s,'camp_after_'+ch);pick(s,hub);
}
