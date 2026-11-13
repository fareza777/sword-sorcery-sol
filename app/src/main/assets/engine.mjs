import {EVIDENCE_LINKS,knownCards,GEAR,STANCES} from './adventure-data.mjs';
import {NODES,CHAPTERS,EVENTS,ITEMS,RECIPES,ACHIEVEMENTS} from './story.mjs';
// Save version stays compatible with 1.0. New systems are hydrated on restore.
export const VERSION=1;
export function fresh(seed=Date.now()>>>0){return {version:VERSION,features:3,textPage:0,cases:[],equipment:{shoulder:null,charm:null},id:'intro',page:0,chapter:0,stamina:10,mana:8,wounds:0,inventory:{bread:2,tonic:1,herbs:2,dew:2,honey:1,copper_wire:1,silver:4},relations:{rook:0,iona:0,mira:0,tessa:0},flags:[],seen:[],taken:[],journal:[],events:[],encounters:[],artSeen:[],investigations:{},mechanisms:{},beams:{},crafted:0,assists:0,travel:0,rests:0,seed:seed||42,puzzle:[],puzzleMistakes:0,duel:null,event:null,ending:null,steps:0};}
export const has=(s,f)=>s.flags.includes(f);
export const maxStamina=s=>10-s.wounds;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function milestones(s){for(const [flag,needs]of [['investigation_done',['forge_examined','gate_examined']],['river_quest_done',['river_done','archive_done']],['light_quest_done',['observatory_done','bird_done']]])if(needs.every(f=>has(s,f))&&!has(s,flag))s.flags.push(flag);}
export function apply(s,fx={}){
 for(const f of fx.flags||[])if(!has(s,f))s.flags.push(f);
 s.wounds=clamp(s.wounds+(fx.wounds||0),0,3);s.stamina=clamp(s.stamina+(fx.stamina||0),0,maxStamina(s));s.mana=clamp(s.mana+(fx.mana||0),0,10);
 for(const[k,v]of Object.entries(fx.items||{}))s.inventory[k]=(s.inventory[k]||0)+v;
 for(const[k,v]of Object.entries(fx.remove||{}))s.inventory[k]=Math.max(0,(s.inventory[k]||0)-v);
 for(const[k,v]of Object.entries(fx.relations||{}))s.relations[k]=clamp((s.relations[k]||0)+v,-5,15);
 if(has(s,'medicine_done')&&!has(s,'reward_sunleaf')){s.flags.push('reward_sunleaf');s.inventory.sunleaf_guard=(s.inventory.sunleaf_guard||0)+1}if(fx.ending)s.ending=fx.ending;milestones(s);return s;
}
export function reason(s,need={}){
 if((need.flags||[]).some(f=>!has(s,f)))return 'clue';if((need.notFlags||[]).some(f=>has(s,f)))return 'done';
 if(need.stamina>s.stamina)return 'stamina';if(need.mana>s.mana)return 'mana';
 if(Object.entries(need.items||{}).some(([k,v])=>(s.inventory[k]||0)<v))return 'item';
 if(Object.entries(need.relations||{}).some(([k,v])=>(s.relations[k]||0)<v))return 'trust';return null;
}
export function go(s,id){
 if(!NODES[id])throw Error('Unknown scene '+id);const n=NODES[id];
 s.id=id;s.page=0;s.textPage=0;s.chapter=n.ch;s.steps++;s.puzzle=[];s.duel=null;s.event=null;
 s.artSeen??=[];if(!s.artSeen.includes(n.art))s.artSeen.push(n.art);
 if(!s.seen.includes(id)){s.seen.push(id);apply(s,n.enter);if(n.kind!=='map')s.journal.push(id)}s.journal=s.journal.slice(-250);
 if(n.kind==='duel')s.duel={round:0,hp:n.maxHp||6,maxHp:n.maxHp||6,guard:3,roundLimit:n.roundLimit||6,assistUsed:false,stance:'balanced',focus:0,calm:0,armorReady:s.equipment?.shoulder==='sunleaf',bellReady:s.equipment?.charm==='river_bell',log:null};return n;
}
export function available(s,index){const n=NODES[s.id],c=n.choices[index];if(!c)return 'missing';if(s.page<n.lines.length-1)return 'page';if(s.event)return 'event';if(Object.keys(c.fx||{}).length&&s.taken.includes(n.id+':'+index))return 'done';return reason(s,c.need);}
export function choose(s,index){const lock=available(s,index);if(lock)throw Error('Choice locked: '+lock);const n=NODES[s.id],c=n.choices[index];if(Object.keys(c.fx||{}).length)s.taken.push(n.id+':'+index);apply(s,c.fx);return go(s,c.to);}
export function nextPage(s){const n=NODES[s.id];if(s.page<n.lines.length-1){s.page++;s.textPage=0;const a=n.artPages?.[s.page];if(a&&!s.artSeen.includes(a))s.artSeen.push(a);return true}return false;}
function random(s){s.seed=(Math.imul(1664525,s.seed)+1013904223)>>>0;return s.seed/4294967296;}
export function travel(s,index){
 const n=NODES[s.id];if(n.kind!=='map'||s.event||!n.locations[index])throw Error('Invalid destination');if(s.stamina<1)throw Error('Rest before traveling');
 apply(s,{stamina:-1});s.travel++;const to=n.locations[index].to;s.encounters??=[...s.events];
 const options=EVENTS.map((e,i)=>({e,i})).filter(({e,i})=>e.chapter===s.chapter&&!s.encounters.includes(i));
 if(options.length&&s.travel>=2&&(random(s)<0.38||s.travel%5===0)){
  const index=options[Math.floor(random(s)*options.length)].i;s.event={index,to};s.encounters.push(index);if(!s.events.includes(s.chapter))s.events.push(s.chapter);
  if(!s.artSeen.includes(EVENTS[index].art))s.artSeen.push(EVENTS[index].art);return 'event';
 }go(s,to);return 'scene';
}
export function eventChoice(s,index){if(!s.event)throw Error('No event');const c=EVENTS[s.event.index].choices[index];if(!c||reason(s,c.need))throw Error('Invalid event choice');const to=s.event.to;apply(s,c.fx);s.event=null;go(s,to);}
export function canAdvance(s){return CHAPTERS[s.chapter].required.every(f=>has(s,f));}
export function advance(s){if(NODES[s.id].kind!=='map'||s.event||!canAdvance(s))throw Error('Objectives remain');go(s,CHAPTERS[s.chapter].exit);}
export function rest(s){if(NODES[s.id].kind!=='map'||s.event)throw Error('Rest at a safe camp');apply(s,{stamina:4+(s.chapter===1&&has(s,'sentinel_spared')?1:0),mana:2});s.rests++;}
export function useItem(s,key){const item=ITEMS[key];if(!item?.use||!(s.inventory[key]>0)||s.event||s.duel)throw Error('Cannot use item');const r=Object.keys(item.use)[0];if(r==='stamina'&&s.stamina===maxStamina(s)||r==='mana'&&s.mana===10||r==='wounds'&&s.wounds===0)throw Error('Already recovered');s.inventory[key]--;apply(s,item.use);}
export const TELEGRAPHS={
 brambleback:[['sweep','A broad shoulder rises. A high sweep is coming.','Bahu lebar terangkat. Serangan menyapu dari atas.'],['rush','It digs both feet into the earth. A rush is coming.','Kedua kakinya menekan tanah. Terjangan akan datang.'],['open','It pauses to pull at the chain. Its guard is open.','Ia berhenti menarik rantai. Pertahanannya terbuka.']],
 captain:[['rush','Varric lowers his blade and steps forward. A thrust.','Varric merendahkan pedang dan melangkah maju. Tusukan.'],['sweep','His sword circles above his shoulder. A high cut.','Pedangnya berputar di atas bahu. Tebasan tinggi.'],['open','His last strike has carried him off balance.','Serangan terakhir membuatnya kehilangan keseimbangan.']],
 guardian:[['sweep','The antlers tilt sideways. A sweeping strike.','Tanduknya miring ke samping. Serangan menyapu.'],['rush','Its hooves scrape the tiles. It is about to charge.','Kukunya menggaruk lantai. Ia siap menerjang.'],['open','Mira calls out. The guardian turns toward her voice.','Mira berseru. Sang penjaga menoleh ke arah suaranya.']],
 sentinel:[['sweep','Stone shoulders turn. A wide warning sweep.','Bahu batu berputar. Sapuan peringatan yang lebar.'],['rush','The sentinel plants its feet beside the broken bell.','Penjaga menancapkan kaki di dekat lonceng rusak.'],['open','It pauses to protect the cracked leg. A clear opening.','Ia berhenti melindungi kaki retaknya. Celah terbuka.']]
};
TELEGRAPHS.brambleback.push(['feint','Its shoulder rises, but the chain pulls low. A feint. Step aside.','Bahunya terangkat, tetapi rantainya tertarik rendah. Tipuan. Menghindarlah.']);
TELEGRAPHS.captain.push(['feint','His blade rises, but his front foot stays planted. A low feint. Step aside.','Pedangnya terangkat, tetapi kaki depannya tetap menancap. Tipuan rendah. Menghindarlah.']);
TELEGRAPHS.guardian.push(['flare','The binding flares gold. A Sun Ward will steady the surge.','Ikatannya menyala keemasan. Perisai Surya akan menahan lonjakannya.']);
TELEGRAPHS.sentinel.push(['feint','The bell swings low while its hand rises. A warning feint. Step aside.','Lonceng berayun rendah saat tangannya terangkat. Tipuan peringatan. Menghindarlah.']);
export function telegraph(s){const n=NODES[s.id],pattern=n.pattern||[0,1,2,1,0,2,0];if(s.duel&&duelPhase(s)===2&&s.duel.round%3===0)return TELEGRAPHS[n.enemy]?.[3];return TELEGRAPHS[n.enemy]?.[pattern[(s.duel?.round||0)%pattern.length]];}
export function stance(s,id){if(!s.duel||!STANCES.some(v=>v.id===id))throw Error('No stance');s.duel.stance=id;}
export function duelPhase(s){return s.duel&&s.duel.hp<=Math.ceil(s.duel.maxHp/2)?2:1;}
export function peacefulMove(s){if(!s.duel||s.duel.hp>Math.ceil(s.duel.maxHp/2)||s.duel.calm<2)return null;const enemy=NODES[s.id].enemy;
 if(enemy==='brambleback'&&s.stamina>=2)return {id:'release',to:'bridge_kind',cost:{stamina:-2},fx:{flags:['road_clear','beast_spared'],relations:{rook:2}}};
 if(enemy==='sentinel'&&(s.inventory.copper_wire||0)>0)return {id:'repair',to:'sentinel_repair',cost:{remove:{copper_wire:1}},fx:{flags:['sentinel_done','sentinel_spared'],items:{ward_shard:2},relations:{rook:2}}};
 if(enemy==='guardian'&&has(s,'case_ward')&&s.mana>=1)return {id:'release',to:'guardian_free',cost:{mana:-1},fx:{flags:['guardian_gentle']}};
 if(enemy==='captain'&&has(s,'case_witness')&&has(s,'case_escort'))return {id:'appeal',to:'captain_stands_down',cost:{},fx:{}};return null;
}
export function duelMove(s,move){
 if(!s.duel||NODES[s.id].kind!=='duel')throw Error('No duel');const d=s.duel,n=NODES[s.id],tell=telegraph(s)[0];
 if(['release','repair','appeal'].includes(move)){const p=peacefulMove(s);if(!p||p.id!==move)throw Error('Create a safe opening first');apply(s,p.cost);apply(s,p.fx);go(s,p.to);return 'win';}
 if(move==='observe'){if(d.focus)throw Error('Use the opening you read');d.focus=1;d.calm++;d.round++;apply(s,{stamina:1,mana:1});d.log={damage:0,hit:0,move};if(d.round>=d.roundLimit){apply(s,{wounds:1,stamina:2,mana:1});go(s,n.lose);return 'lose'}return 'continue';}
 const style=d.stance||'balanced',cost={guard:[0,0],dodge:[style==='nimble'?1:2,0],strike:[style==='nimble'?3:2,0],ward:[0,style==='focused'?3:2]}[move];if(!cost)throw Error('Invalid move');
 const [sp,mp]=cost,shard=move==='ward'&&(s.inventory.ward_shard||0)>0;if(s.stamina<sp||s.mana<(shard?0:mp))throw Error('Not enough energy');if(shard)s.inventory.ward_shard--;apply(s,{stamina:-sp,mana:shard?0:-mp});let damage=0,hit=0;
 const perfect=(move==='guard'&&tell==='sweep')||(move==='dodge'&&['rush','feint'].includes(tell))||(move==='strike'&&tell==='open')||(move==='ward'&&tell==='flare');
 if(move==='ward')damage=style==='focused'?3:2;
 if(move==='guard'){if(tell==='sweep')damage=2;else if(tell==='feint'&&d.focus)damage=2;else if(['rush','feint','flare'].includes(tell))hit=1;}
 if(move==='dodge')damage=['rush','feint'].includes(tell)?2:1;
 if(move==='strike'){damage=tell==='open'?3:1;if(tell!=='open')hit=1;if(style==='guarded')damage=Math.max(0,damage-1);}
 if(d.focus){damage++;d.focus=0}if(style==='guarded'&&move==='guard')hit=Math.max(0,hit-1);
 if(hit&&d.armorReady){hit--;d.armorReady=false}if(perfect){d.calm++;if(d.bellReady){apply(s,{mana:1});d.bellReady=false}}
 d.hp=Math.max(0,d.hp-damage);d.guard-=hit;d.round++;d.log={damage,hit,move,perfect};
 if(d.hp<=0){go(s,n.win);return 'win'}if(d.guard<=0||d.round>=d.roundLimit){apply(s,{wounds:1,stamina:2,mana:1});go(s,n.lose);return 'lose'}return 'continue';
}
export function rune(s,key){
 const n=NODES[s.id],allowed=n.kind==='forge'?['heat','hammer','cool']:['leaf','water','sun'];if(!['puzzle','forge'].includes(n.kind)||!allowed.includes(key))throw Error('Invalid rune');s.puzzle.push(key);if(s.puzzle.length<3)return 'pending';
 if(s.puzzle.every((v,i)=>v===n.solution[i])){go(s,n.win);return 'solved'}s.puzzle=[];s.puzzleMistakes++;apply(s,n.kind==='forge'?{stamina:-1}:{mana:-1});return 'wrong';
}
export function inspect(s,index){const n=NODES[s.id];if(n.kind!=='inspect'||s.event||!n.hotspots[index])throw Error('No clue here');s.investigations??={};const found=s.investigations[n.id]??=[],h=n.hotspots[index];if(!found.includes(h.id)){found.push(h.id);apply(s,h.fx)}return h;}
export function finishInspection(s){const n=NODES[s.id];if(n.kind!=='inspect'||!n.hotspots.every(h=>s.investigations?.[n.id]?.includes(h.id)))throw Error('More clues remain');go(s,n.win);}
export function toggleGate(s,index){const n=NODES[s.id];if(n.kind!=='mechanism'||!Number.isInteger(index)||index<0||index>2)throw Error('Invalid gate');s.mechanisms??={};const gates=s.mechanisms[n.id]??=[false,false,false];gates[index]=!gates[index];return gates;}
export function finishMechanism(s){const n=NODES[s.id];if(n.kind!=='mechanism'||!n.goal.every((v,i)=>s.mechanisms?.[n.id]?.[i]===v))throw Error('Water is not safe yet');go(s,n.win);}
export const MIRROR_CELLS=[0,2,3,5];
export function beamPath(rotations=[1,0,0,0]){let row=1,col=0,dir=1;const path=[],seen=new Set();let solved=false;for(let i=0;i<24;i++){if(row<0||row>1||col<0||col>2){solved=row===1&&col===3&&dir===1;break}const key=`${row},${col},${dir}`;if(seen.has(key))break;seen.add(key);const cell=row*3+col;path.push({row,col,dir});const mirror=MIRROR_CELLS.indexOf(cell);if(mirror>=0)dir=(rotations[mirror]===0?[1,0,3,2]:[3,2,1,0])[dir];row+=[-1,0,1,0][dir];col+=[0,1,0,-1][dir]}return {path,solved};}
export function turnMirror(s,index){const n=NODES[s.id];if(n.kind!=='beam'||!Number.isInteger(index)||index<0||index>3)throw Error('Invalid mirror');s.beams??={};const mirrors=s.beams[n.id]??=[1,0,0,0];mirrors[index]=1-mirrors[index];return beamPath(mirrors);}
export function finishBeam(s){const n=NODES[s.id];if(n.kind!=='beam'||!beamPath(s.beams?.[n.id]).solved)throw Error('Light has not reached the exit');go(s,n.win);}
export function craft(s,id){const r=RECIPES.find(r=>r.id===id);if(!r||s.event||s.duel||NODES[s.id].kind!=='map')throw Error('Craft at a safe camp');if(reason(s,{items:r.cost}))throw Error('Missing ingredients');apply(s,{remove:r.cost,items:r.result});s.crafted=(s.crafted||0)+1;return r;}
export function forage(s){if(s.event||NODES[s.id].kind!=='map'||has(s,'forage_'+s.chapter)||s.stamina<2)throw Error('Cannot gather now');apply(s,{stamina:-2,items:{herbs:2,dew:1,honey:1},flags:['forage_'+s.chapter]});}
export function trade(s,id){if(s.event||s.duel||NODES[s.id].kind!=='map')throw Error('Trade at camp');const r={wire:{cost:{silver:2},items:{copper_wire:1}},dew:{cost:{silver:2},items:{dew:2}},bread:{cost:{silver:2},items:{bread:1}}}[id];if(r&&((id==='bread'&&has(s,'medicine_done'))||(id==='wire'&&has(s,'record_returned'))))r.cost.silver=1;if(!r||reason(s,{items:r.cost}))throw Error('Cannot afford trade');apply(s,{remove:r.cost,items:r.items});}
export function allies(s){return [{id:'rook',name:'Rook',available:has(s,'rook_joined')&&s.relations.rook>=2,damage:2,fx:{stamina:1}},{id:'iona',name:'Iona',available:has(s,'iona_joined')&&s.relations.iona>=2,damage:1,fx:{mana:1}},{id:'mira',name:'Mira',available:has(s,'mira')&&s.relations.mira>=2,damage:3,fx:{}}];}
export function assist(s,id){if(!s.duel||s.duel.assistUsed)throw Error('No ally opening');const a=allies(s).find(a=>a.id===id&&a.available);if(!a)throw Error('Earn this companion’s trust');const n=NODES[s.id],d=s.duel;d.assistUsed=true;s.assists=(s.assists||0)+1;apply(s,a.fx);d.hp=Math.max(0,d.hp-a.damage);if(id==='iona')d.guard=Math.min(3,d.guard+1);d.log={damage:a.damage,hit:0,move:'ally',ally:id};if(d.hp<=0){go(s,n.win);return 'win'}return 'continue';}
export function achievements(s){return ACHIEVEMENTS.filter(a=>a.flags?a.flags.every(f=>has(s,f)):(s[a.counter]||0)>=a.target);}
export function serialize(s){return JSON.stringify({...s,savedAt:Date.now()});}
export function restore(text){try{
 const s=JSON.parse(text);if(s.version!==VERSION||!NODES[s.id]||!Number.isInteger(s.page)||s.page<0||s.page>=NODES[s.id].lines.length)return null;
 if(s.chapter!==NODES[s.id].ch||!Number.isInteger(s.chapter))return null;for(const k of ['flags','seen','taken','journal','events'])if(!Array.isArray(s[k]))return null;
 for(const k of ['stamina','mana','wounds','seed','steps','travel','rests'])if(!Number.isFinite(s[k]))return null;
 if(!Number.isInteger(s.wounds)||s.wounds<0||s.wounds>3||s.stamina<0||s.stamina>maxStamina(s)||s.mana<0||s.mana>10)return null;
 if(!s.inventory||Object.entries(s.inventory).some(([k,v])=>!Object.hasOwn(ITEMS,k)||!Number.isInteger(v)||v<0||v>999))return null;
 if(!s.relations||['rook','iona','mira','tessa'].some(k=>!Number.isFinite(s.relations[k])))return null;
 if(!Array.isArray(s.puzzle)||s.puzzle.length>2||s.puzzle.some(k=>!['leaf','water','sun','heat','hammer','cool'].includes(k)))return null;
 if(s.event&&(!EVENTS[s.event.index]||!NODES[s.event.to]))return null;
 if(NODES[s.id].kind==='duel'&&(!s.duel||!Number.isInteger(s.duel.round)||s.duel.round<0||!Number.isInteger(s.duel.hp)||!Number.isInteger(s.duel.guard)||s.duel.round>=(NODES[s.id].roundLimit||6)||s.duel.hp<=0||s.duel.hp>(NODES[s.id].maxHp||6)||s.duel.guard<=0||s.duel.guard>3))return null;
 s.features=3;s.textPage??=0;s.cases??=EVIDENCE_LINKS.filter(v=>has(s,'case_'+v.id)).map(v=>v.id);s.equipment??={shoulder:null,charm:null};if(!Number.isInteger(s.textPage)||s.textPage<0||s.textPage>12||!Array.isArray(s.cases)||s.cases.some(v=>!EVIDENCE_LINKS.some(l=>l.id===v)))return null;if(!s.equipment||typeof s.equipment!=='object'||Array.isArray(s.equipment)||Object.entries(s.equipment).some(([slot,id])=>!['shoulder','charm'].includes(slot)||(id!==null&&(!GEAR[id]||GEAR[id].slot!==slot))))return null;s.encounters??=[...s.events];s.artSeen??=s.seen.map(id=>NODES[id]?.art).filter(Boolean);s.investigations??={};s.mechanisms??={};s.beams??={};s.crafted??=0;s.assists??=0;
 if(!Array.isArray(s.encounters)||s.encounters.some(i=>!Number.isInteger(i)||!EVENTS[i])||!Array.isArray(s.artSeen)||s.artSeen.some(a=>typeof a!=='string'))return null;
 for(const k of ['crafted','assists'])if(!Number.isInteger(s[k])||s[k]<0)return null;
 for(const k of ['investigations','mechanisms','beams'])if(!s[k]||Array.isArray(s[k])||typeof s[k]!=='object')return null;
 for(const[id,keys]of Object.entries(s.investigations))if(NODES[id]?.kind!=='inspect'||!Array.isArray(keys)||keys.some(key=>!NODES[id].hotspots.some(h=>h.id===key)))return null;
 for(const[id,gates]of Object.entries(s.mechanisms))if(NODES[id]?.kind!=='mechanism'||!Array.isArray(gates)||gates.length!==3||gates.some(v=>typeof v!=='boolean'))return null;
 for(const[id,m]of Object.entries(s.beams))if(NODES[id]?.kind!=='beam'||!Array.isArray(m)||m.length!==4||m.some(v=>v!==0&&v!==1))return null;
 if(s.duel){s.duel.maxHp=NODES[s.id].maxHp||6;s.duel.roundLimit=NODES[s.id].roundLimit||6;s.duel.assistUsed??=false;s.duel.stance??='balanced';s.duel.focus??=0;s.duel.calm??=0;s.duel.armorReady??=false;s.duel.bellReady??=false;if(!STANCES.some(v=>v.id===s.duel.stance)||![0,1].includes(s.duel.focus)||!Number.isInteger(s.duel.calm)||s.duel.calm<0)return null}milestones(s);apply(s,{});return s;
}catch{return null}}
export function relationship(v){return v>=6?'close':v>=2?'warm':v<0?'strained':'unsure';}

export function linkEvidence(s,ids){if(s.duel||s.event||!Array.isArray(ids)||ids.length!==2||new Set(ids).size!==2)throw Error('Choose two distinct clues in safety');const known=knownCards(s).map(c=>c.id);if(ids.some(id=>!known.includes(id)))throw Error('Find these clues first');const link=EVIDENCE_LINKS.find(l=>l.cards.every(id=>ids.includes(id)));if(!link)return null;if(s.cases.includes(link.id))return link;s.cases.push(link.id);apply(s,link.fx);return link;}
export function equip(s,id){const g=GEAR[id];if(!g||s.duel||s.event||!(s.inventory[g.item]>0))throw Error('Equip owned gear in safety');s.equipment[g.slot]=s.equipment[g.slot]===id?null:id;return s.equipment;}
export function contextOptions(s){if(s.duel||s.event)return [];const n=NODES[s.id],list=[];n.choices.forEach((c,index)=>{const key=Object.keys(c.need?.items||{})[0];if(key&&(s.inventory[key]||0)>0&&!reason(s,c.need)&&!s.taken.includes(n.id+':'+index))list.push({id:'choice:'+index,key,label:c.label});});if(['archive','archive_done','council'].includes(s.id)&&has(s,'case_clan')&&(s.inventory.receipt||0)>0&&!has(s,'record_returned'))list.push({id:'return-record',key:'receipt',label:['Return the original • stronger trust, lose court proof','Kembalikan asli • tambah kepercayaan, lepas bukti pengadilan']});if(n.kind==='puzzle'&&(s.inventory.diagram||0)>0&&!has(s,'diagram_help_'+s.id))list.push({id:'diagram',key:'diagram',label:['Apply the diagram • prepare two runes','Pakai diagram • siapkan dua rune']});return list;}
export function contextUse(s,id){const option=contextOptions(s).find(o=>o.id===id);if(!option)throw Error('This item has no action here');if(id.startsWith('choice:')){s.page=NODES[s.id].lines.length-1;return choose(s,+id.split(':')[1]);}if(id==='return-record')apply(s,{remove:{receipt:1},flags:['record_returned'],relations:{rook:2},items:{silver:3}});if(id==='diagram'){s.puzzle=NODES[s.id].solution.slice(0,2);apply(s,{flags:['diagram_help_'+s.id]});}return option;}
