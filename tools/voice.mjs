/** Build-time only. Run with DEEPGRAM_API_KEY in your environment. No key is written to disk. */
import fs from 'node:fs/promises';import {NODES,EVENTS} from '../app/src/main/assets/story.mjs';import {TELEGRAPHS} from '../app/src/main/assets/engine.mjs';
const root=new URL('../app/src/main/assets/audio/',import.meta.url);
const voices={Rowan:'aura-2-orion-en',Mira:'aura-2-asteria-en',Rook:'aura-2-hermes-en',Iona:'aura-2-athena-en',Varric:'aura-2-odysseus-en','Elder Sedge':'aura-2-zeus-en',Pip:'aura-2-luna-en',Tessa:'aura-2-helena-en',Nell:'aura-2-andromeda-en',Oren:'aura-2-arcas-en'};
const jobs=[];
for(const n of Object.values(NODES))if(!['map','duel','puzzle'].includes(n.kind))n.lines.forEach((t,i)=>jobs.push({key:`${n.id}-${i}`,text:t[0],speaker:n.speaker}));
for(const [enemy,tells]of Object.entries(TELEGRAPHS))tells.forEach((t,i)=>jobs.push({key:`duel-${enemy}-${i}`,text:t[1],speaker:'Rowan'}));
EVENTS.forEach((e,i)=>jobs.push({key:`event-${i}`,text:e.lines[0][0],speaker:e.speaker}));
// Rune instructions are also voiced, with the mage’s voice.
for(const n of Object.values(NODES))if(n.kind==='puzzle')jobs.push({key:`${n.id}-0`,text:n.lines[0][0],speaker:n.speaker});
await fs.mkdir(root,{recursive:true});const manifest={};let cursor=0,done=0;
async function worker(){while(cursor<jobs.length){const job=jobs[cursor++],out=new URL(`${job.key}.mp3`,root);let cached=false;try{cached=(await fs.stat(out)).size>300}catch{}
 if(!cached){if(!process.env.DEEPGRAM_API_KEY)throw Error('Set DEEPGRAM_API_KEY in the build environment.');let success=false;
 for(let attempt=0;attempt<4;attempt++){
  const model=voices[job.speaker]||'aura-2-apollo-en';
  const response=await fetch(`https://api.deepgram.com/v1/speak?model=${model}&encoding=mp3&bit_rate=48000`,{method:'POST',headers:{Authorization:`Token ${process.env.DEEPGRAM_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({text:job.text}),signal:AbortSignal.timeout(60000)});
  if(response.ok){const data=Buffer.from(await response.arrayBuffer());if(data.length<300)throw Error('Empty speech result');await fs.writeFile(out,data);success=true;break;}
  if(response.status===401||response.status===403)throw Error(`Deepgram authorization rejected (${response.status}).`);
  if(attempt===3)throw Error(`Deepgram ${response.status} for ${job.key}: ${(await response.text()).slice(0,160)}`);
  await new Promise(r=>setTimeout(r,1000*(attempt+1)));
 }if(!success)throw Error('Speech build incomplete');
 }
 manifest[job.key]=`audio/${job.key}.mp3`;done++;if(done%20===0)console.log(`Voices ${done}/${jobs.length}`);
}}
await Promise.all([worker(),worker(),worker()]);await fs.writeFile(new URL('manifest.json',root),JSON.stringify(manifest,null,2));
await fs.writeFile(new URL('../docs/voice-cast.json',import.meta.url),JSON.stringify({provider:'Deepgram Aura 2',language:'en',voices,tracks:done,characters:jobs.reduce((a,j)=>a+j.text.length,0)},null,2));
console.log(`Complete: ${done} offline speech tracks. No API credential stored.`);
