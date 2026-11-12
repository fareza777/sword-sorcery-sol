import {NODES,EVENTS} from '../app/src/main/assets/story.mjs';
import {TELEGRAPHS} from '../app/src/main/assets/engine.mjs';
export const VOICES={Rowan:'aura-2-orion-en',Mira:'aura-2-asteria-en',Rook:'aura-2-hermes-en',Iona:'aura-2-athena-en',Varric:'aura-2-odysseus-en','Elder Sedge':'aura-2-zeus-en',Pip:'aura-2-luna-en',Tessa:'aura-2-helena-en',Nell:'aura-2-andromeda-en',Oren:'aura-2-arcas-en',Wren:'aura-2-arcas-en',Cook:'aura-2-helena-en',Driver:'aura-2-arcas-en'};
export const VOICE_JOBS=[];
for(const n of Object.values(NODES)){
 if(!['map','duel'].includes(n.kind))n.lines.forEach((t,i)=>VOICE_JOBS.push({key:`${n.id}-${i}`,text:t[0],speaker:n.speaker}));
 if(n.kind==='inspect')for(const h of n.hotspots)VOICE_JOBS.push({key:`inspect-${n.id}-${h.id}`,text:h.text[0],speaker:n.speaker});
}
for(const[enemy,tells]of Object.entries(TELEGRAPHS))tells.forEach((t,i)=>VOICE_JOBS.push({key:`duel-${enemy}-${i}`,text:t[1],speaker:'Rowan'}));
EVENTS.forEach((e,i)=>VOICE_JOBS.push({key:`event-${i}`,text:e.lines[0][0],speaker:e.speaker}));
