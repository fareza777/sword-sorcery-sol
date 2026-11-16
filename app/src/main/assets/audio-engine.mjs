/** Offline sample player. Bound voices and shaped envelopes, no oscillator beeps. */
const names=['tap','page','clue','rune','wrong','heal','craft','guard','strike','dodge','ward','ally','win','parry','impact','ward-hit'];
let context,epoch=0,lastTap=-Infinity;
const buffers=new Map(),loading=new Map(),active=new Set();
async function buffer(name){
 if(buffers.has(name))return buffers.get(name);
 if(!loading.has(name))loading.set(name,fetch(`audio/sfx/${name}.wav`).then(r=>{if(!r.ok)throw Error('sound');return r.arrayBuffer()}).then(bytes=>context.decodeAudioData(bytes)).then(b=>{buffers.set(name,b);return b}).catch(()=>null).finally(()=>loading.delete(name)));
 return loading.get(name);
}
export async function sound(name,prefs={}){
 if(prefs.sfx===false||document.hidden)return;
 if(!names.includes(name))name='tap';
 const now=performance.now();if(name==='tap'&&now-lastTap<80)return;if(name==='tap')lastTap=now;
 try{
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
  context??=new Audio({latencyHint:'interactive'});const stamp=epoch;
  if(context.state==='suspended')await context.resume();
  const decoded=await buffer(name);if(!decoded||stamp!==epoch||prefs.sfx===false||document.hidden)return;
  while(active.size>=6){const oldest=active.values().next().value;oldest.stop();active.delete(oldest);}
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=decoded;
  gain.gain.value=Math.max(0,Math.min(1,Number(prefs.effectsVolume??.65)));
  source.connect(gain);gain.connect(context.destination);active.add(source);
  source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};source.start();
  if(name==='tap')for(const key of ['page','guard','parry','strike','impact','ward','ward-hit','dodge'])buffer(key);
 }catch{}
}
export function pauseEffects(){epoch++;for(const source of active){try{source.stop()}catch{}}active.clear();context?.suspend().catch(()=>{});}
