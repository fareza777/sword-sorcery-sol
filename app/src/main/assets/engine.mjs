import {NODES,CHAPTERS,EVENTS,ITEMS} from './story.mjs';
export const VERSION=1;
export function fresh(seed=Date.now()>>>0){return {version:VERSION,id:'intro',page:0,chapter:0,stamina:10,mana:8,wounds:0,inventory:{bread:2,tonic:1},relations:{rook:0,iona:0,mira:0,tessa:0},flags:[],seen:[],taken:[],journal:[],events:[],travel:0,rests:0,seed:seed||42,puzzle:[],puzzleMistakes:0,duel:null,event:null,ending:null,steps:0};}
export const has=(s,f)=>s.flags.includes(f);
export const maxStamina=s=>10-s.wounds;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function apply(s,fx={}){
 for(const f of fx.flags||[])if(!has(s,f))s.flags.push(f);
 s.wounds=clamp(s.wounds+(fx.wounds||0),0,3);
 s.stamina=clamp(s.stamina+(fx.stamina||0),0,maxStamina(s));
 s.mana=clamp(s.mana+(fx.mana||0),0,10);
 for(const [k,v]of Object.entries(fx.items||{}))s.inventory[k]=(s.inventory[k]||0)+v;
 for(const [k,v]of Object.entries(fx.remove||{}))s.inventory[k]=Math.max(0,(s.inventory[k]||0)-v);
 for(const [k,v]of Object.entries(fx.relations||{}))s.relations[k]=clamp((s.relations[k]||0)+v,-5,15);
 if(fx.ending)s.ending=fx.ending;
 return s;
}
export function reason(s,need={}){
 if((need.flags||[]).some(f=>!has(s,f)))return 'clue';
 if((need.notFlags||[]).some(f=>has(s,f)))return 'done';
 if(need.stamina>s.stamina)return 'stamina';
 if(need.mana>s.mana)return 'mana';
 if(Object.entries(need.items||{}).some(([k,v])=>(s.inventory[k]||0)<v))return 'item';
 if(Object.entries(need.relations||{}).some(([k,v])=>(s.relations[k]||0)<v))return 'trust';
 return null;
}
export function go(s,id){
 if(!NODES[id])throw Error('Unknown scene '+id);
 const n=NODES[id];s.id=id;s.page=0;s.chapter=n.ch;s.steps++;s.puzzle=[];s.duel=null;
 if(!s.seen.includes(id)){s.seen.push(id);apply(s,n.enter);if(n.kind!=='map')s.journal.push(id);}
 s.journal=s.journal.slice(-200);
 if(n.kind==='duel')s.duel={round:0,hp:6,guard:3,log:null};
 return n;
}
export function available(s,index){
 const n=NODES[s.id],c=n.choices[index];if(!c)return 'missing';
 if(s.page<n.lines.length-1)return 'page';
 if(s.event)return 'event';
 if(Object.keys(c.fx||{}).length&&s.taken.includes(n.id+':'+index))return 'done';
 return reason(s,c.need);
}
export function choose(s,index){
 const lock=available(s,index);if(lock)throw Error('Choice locked: '+lock);
 const n=NODES[s.id],c=n.choices[index];
 if(Object.keys(c.fx||{}).length)s.taken.push(n.id+':'+index);
 apply(s,c.fx);return go(s,c.to);
}
export function nextPage(s){const n=NODES[s.id];if(s.page<n.lines.length-1){s.page++;return true;}return false;}
function random(s){s.seed=(Math.imul(1664525,s.seed)+1013904223)>>>0;return s.seed/4294967296;}
export function travel(s,index){
 const n=NODES[s.id];if(n.kind!=='map'||!n.locations[index])throw Error('Invalid destination');
 if(s.stamina<1)throw Error('Rest before traveling');
 apply(s,{stamina:-1});s.travel++;
 const to=n.locations[index].to;
 // One chapter-specific encounter, with deterministic random timing, preserved by autosave.
 if(!s.events.includes(s.chapter)&&s.travel>=2&&(random(s)<0.42||s.travel%4===0)){
   s.event={index:s.chapter,to};s.events.push(s.chapter);return 'event';
 }
 go(s,to);return 'scene';
}
export function eventChoice(s,index){
 if(!s.event)throw Error('No event');const c=EVENTS[s.event.index].choices[index];
 if(!c||reason(s,c.need))throw Error('Invalid event choice');
 const to=s.event.to;apply(s,c.fx);s.event=null;go(s,to);
}
export function canAdvance(s){return CHAPTERS[s.chapter].required.every(f=>has(s,f));}
export function advance(s){if(NODES[s.id].kind!=='map'||!canAdvance(s))throw Error('Objectives remain');go(s,CHAPTERS[s.chapter].exit);}
export function rest(s){if(NODES[s.id].kind!=='map'||s.event)throw Error('Rest at a safe camp');apply(s,{stamina:4,mana:2});s.rests++;}
export function useItem(s,key){
 const item=ITEMS[key];if(!item?.use||!(s.inventory[key]>0)||s.event||s.duel)throw Error('Cannot use item');
 const resource=Object.keys(item.use)[0];
 if(resource==='stamina'&&s.stamina===maxStamina(s)||resource==='mana'&&s.mana===10||resource==='wounds'&&s.wounds===0)throw Error('Already recovered');
 s.inventory[key]--;apply(s,item.use);
}
export const TELEGRAPHS={
 brambleback:[['sweep','A broad shoulder rises. A high sweep is coming.','Bahu lebar terangkat. Serangan menyapu dari atas.'],['rush','It digs both feet into the earth. A rush is coming.','Kedua kakinya menekan tanah. Terjangan akan datang.'],['open','It pauses to pull at the chain. Its guard is open.','Ia berhenti menarik rantai. Pertahanannya terbuka.']],
 captain:[['rush','Varric lowers his blade and steps forward. A thrust.','Varric merendahkan pedang dan melangkah maju. Tusukan.'],['sweep','His sword circles above his shoulder. A high cut.','Pedangnya berputar di atas bahu. Tebasan tinggi.'],['open','His last strike has carried him off balance.','Serangan terakhir membuatnya kehilangan keseimbangan.']],
 guardian:[['sweep','The antlers tilt sideways. A sweeping strike.','Tanduknya miring ke samping. Serangan menyapu.'],['rush','Its hooves scrape the tiles. It is about to charge.','Kukunya menggaruk lantai. Ia siap menerjang.'],['open','Mira calls out. The guardian turns toward her voice.','Mira berseru. Sang penjaga menoleh ke arah suaranya.']]
};
export function telegraph(s){const n=NODES[s.id];return TELEGRAPHS[n.enemy]?.[s.duel?.round%3];}
export function duelMove(s,move){
 if(!s.duel||NODES[s.id].kind!=='duel')throw Error('No duel');
 const d=s.duel,n=NODES[s.id],tell=telegraph(s)[0];
 const costs={guard:[0,0],dodge:[2,0],strike:[2,0],ward:[0,2]};
 if(!costs[move])throw Error('Invalid move');const [sp,mp]=costs[move];
 if(s.stamina<sp||s.mana<mp)throw Error('Not enough energy');
 apply(s,{stamina:-sp,mana:-mp});let damage=0,hit=0;
 if(move==='ward'){damage=2;}
 if(move==='guard'){if(tell==='sweep')damage=2;else if(tell==='rush'){damage=0;hit=1;}else damage=0;}
 if(move==='dodge'){damage=tell==='rush'?2:1;}
 if(move==='strike'){damage=tell==='open'?3:1;if(tell!=='open')hit=1;}
 d.hp=Math.max(0,d.hp-damage);d.guard-=hit;d.round++;d.log={damage,hit,move};
 if(d.hp<=0){go(s,n.win);return 'win';}
 if(d.guard<=0||d.round>=6){apply(s,{wounds:1,stamina:2,mana:1});go(s,n.lose);return 'lose';}
 return 'continue';
}
export function rune(s,key){
 const n=NODES[s.id];if(n.kind!=='puzzle'||!['leaf','water','sun'].includes(key))throw Error('Invalid rune');
 s.puzzle.push(key);
 if(s.puzzle.length<3)return 'pending';
 if(s.puzzle.every((v,i)=>v===n.solution[i])){go(s,n.win);return 'solved';}
 s.puzzle=[];s.puzzleMistakes++;apply(s,{mana:-1});return 'wrong';
}
export function serialize(s){return JSON.stringify({...s,savedAt:Date.now()});}
export function restore(text){
 try{
 const s=JSON.parse(text);
 if(s.version!==VERSION||!NODES[s.id]||!Number.isInteger(s.page)||s.page<0||s.page>=NODES[s.id].lines.length)return null;
 if(s.chapter!==NODES[s.id].ch||!Number.isInteger(s.chapter)||!Array.isArray(s.flags)||!Array.isArray(s.seen)||!Array.isArray(s.taken)||!Array.isArray(s.journal)||!Array.isArray(s.events))return null;
 for(const k of ['stamina','mana','wounds','seed','steps','travel','rests'])if(!Number.isFinite(s[k]))return null;
 if(s.wounds<0||s.wounds>3||s.stamina<0||s.stamina>maxStamina(s)||s.mana<0||s.mana>10)return null;
 if(!s.inventory||Object.entries(s.inventory).some(([k,v])=>!ITEMS[k]||!Number.isInteger(v)||v<0||v>100))return null;
 if(!s.relations||['rook','iona','mira','tessa'].some(k=>!Number.isFinite(s.relations[k])))return null;
 if(!Array.isArray(s.puzzle)||s.puzzle.length>2||s.puzzle.some(k=>!['leaf','water','sun'].includes(k)))return null;
 if(s.event&&(!EVENTS[s.event.index]||!NODES[s.event.to]))return null;
 if(NODES[s.id].kind==='duel'&&(!s.duel||!Number.isInteger(s.duel.round)||s.duel.round<0||s.duel.round>=6||s.duel.hp<=0||s.duel.hp>6||s.duel.guard<=0||s.duel.guard>3))return null;
 return s;
 }catch{return null;}
}
export function relationship(v){return v>=6?'close':v>=2?'warm':v<0?'strained':'unsure';}
