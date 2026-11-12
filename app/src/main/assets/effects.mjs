// Presentation effects never change game rules, crop illustrations, or require a network.
let context;
const sounds={tap:[620,.035,'sine'],page:[470,.06,'sine'],clue:[780,.16,'sine'],rune:[660,.24,'sine'],wrong:[190,.18,'triangle'],heal:[520,.24,'sine'],craft:[840,.18,'triangle'],guard:[180,.12,'triangle'],strike:[270,.12,'sawtooth'],dodge:[410,.08,'sine'],ward:[740,.25,'sine'],ally:[880,.28,'sine'],win:[990,.3,'sine']};
export function sound(name,prefs={}){
 if(prefs.sfx===false)return;
 try{
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();if(context.state==='suspended')context.resume().catch(()=>{});
  const [frequency,duration,type]=sounds[name]||sounds.tap,t=context.currentTime,gain=context.createGain(),osc=context.createOscillator();
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(name==='tap'?.025:.045,t+.01);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
  osc.type=type;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(frequency*(name==='wrong'?.55:1.4),t+duration);osc.connect(gain);gain.connect(context.destination);osc.start(t);osc.stop(t+duration+.02);
 }catch{}
}
export function pauseEffects(){context?.suspend().catch(()=>{});}
export function decorateScene(prefs,art=''){
 if(prefs.motion===false)return;
 for(const frame of document.querySelectorAll('#app .art-frame,#app .home-art')){
  if(frame.querySelector('.atmosphere'))continue;
  const layer=document.createElement('div');layer.className='atmosphere';layer.setAttribute('aria-hidden','true');
  const watery=/river|ferry|water|goblin|reeds|lock|spring|harbor|home/.test(art),magic=/rune|seal|tower|lantern|observatory|chart|crown|guardian|bell/.test(art);
  layer.classList.toggle('magic',magic);layer.classList.toggle('watery',watery);
  for(let i=0;i<(magic?11:7);i++){const mote=document.createElement('i');mote.style.setProperty('--x',(10+i*79/11)%95+'%');mote.style.setProperty('--y',(18+i*23)%84+'%');mote.style.setProperty('--delay',(-i*.61)+'s');mote.style.setProperty('--duration',(5+i%4)+'s');layer.append(mote)}
  if(magic){const ray=document.createElement('span');ray.className='sunray';layer.append(ray)}frame.append(layer);
 }
 document.querySelectorAll('#app .dialogue p').forEach(p=>p.classList.add('story-reveal'));
}
export function visual(name,prefs={}){
 if(prefs.motion===false)return;const frame=document.querySelector('#app .art-frame');if(!frame)return;
 frame.dataset.effect=name;const spark=document.createElement('div');spark.className='action-spark effect-'+name;spark.setAttribute('aria-hidden','true');frame.append(spark);setTimeout(()=>{spark.remove();delete frame.dataset.effect},620);
 const battle=frame.querySelector('.battle-stage');if(battle){battle.dataset.pose=name;setTimeout(()=>{delete battle.dataset.pose},520);}
}
