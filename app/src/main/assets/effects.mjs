import ART from './art.mjs';
let worldObservers=[];
// Reflections follow water already painted in each illustration.
const WATER_PATHS={
 world_river_open:['M48 43 C46 55 56 70 43 99','M53 48 C59 65 63 79 55 100','M43 64 C38 78 27 86 13 98'],
 river_lock:['M48 47 C49 60 47 78 42 98','M57 48 C62 64 61 79 66 99'],
 goblin:['M51 46 C45 61 55 82 44 100','M61 56 C67 72 61 88 65 100'],
 ferry:['M8 70 C27 67 37 77 56 75','M34 86 C51 81 67 90 90 86'],
 waterwheel:['M59 45 C58 66 51 77 43 99','M67 56 C64 77 69 86 62 100'],
 clan_festival:['M16 80 C31 76 39 84 53 81','M45 94 C60 89 74 95 93 91'],
 herbal_spring:['M19 77 C35 72 49 79 65 74','M43 89 C58 84 72 89 83 85']
};
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
 for(const o of worldObservers)o.disconnect();worldObservers=[];
 if(prefs.motion===false)return;
 for(const frame of document.querySelectorAll('#app .art-frame,#app .home-art')){
  if(frame.querySelector('.atmosphere'))continue;
  const layer=document.createElement('div');layer.className='atmosphere';layer.setAttribute('aria-hidden','true');
  const watery=/river|ferry|water|goblin|reeds|lock|spring|harbor|home/.test(art),magic=/rune|seal|tower|lantern|observatory|chart|crown|guardian|bell/.test(art);
  layer.classList.toggle('magic',magic);layer.classList.toggle('watery',watery);
  for(let i=0;i<(magic?4:2);i++){const mote=document.createElement('i');mote.style.setProperty('--x',(17+i*27)%91+'%');mote.style.setProperty('--y',(18+i*23)%84+'%');mote.style.setProperty('--delay',(-i*3.7)+'s');mote.style.setProperty('--duration',(11+i*3)+'s');layer.append(mote)}
  if(magic){const ray=document.createElement('span');ray.className='sunray';layer.append(ray)}frame.append(layer);
 }
 for(const frame of document.querySelectorAll('#app .art-frame')){
  const base=frame.querySelector(':scope > img');if(!base||frame.querySelector('.battle-stage'))continue;
  const key=(base.getAttribute('src')||art).split('/').pop().replace('.webp','');
  const leafy=/forest|bridge|grove|shrine|spring|garden|market|village|balcony|ruin_gate/.test(key),parts=[];
  if(['world_river_open','clan_festival'].includes(key)&&ART.env_lantern)parts.push('<img class="world-lantern" src="'+ART.env_lantern+'" alt="">');
  if(key==='world_river_open'&&ART.env_wheel)parts.push('<img class="world-wheel" src="'+ART.env_wheel+'" alt="">');
  if(leafy&&ART.env_leaf)parts.push('<img class="world-leaf" src="'+ART.env_leaf+'" alt=""><img class="world-leaf leaf-b" src="'+ART.env_leaf+'" alt="">');
  if(WATER_PATHS[key])parts.push('<svg class="water-flow" viewBox="0 0 100 100" preserveAspectRatio="none">'+WATER_PATHS[key].map((d,i)=>'<path d="'+d+'" style="--flow-delay:'+(-i*2.3)+'s"/>').join('')+'</svg>');
  if(!parts.length)continue;
  const layer=document.createElement('div');layer.className='world-parts';layer.setAttribute('aria-hidden','true');layer.innerHTML=parts.join('');frame.append(layer);
  const fit=()=>{if(!base.naturalWidth)return;const ratio=Math.min(frame.clientWidth/base.naturalWidth,frame.clientHeight/base.naturalHeight),w=base.naturalWidth*ratio,h=base.naturalHeight*ratio;Object.assign(layer.style,{width:w+'px',height:h+'px',left:(frame.clientWidth-w)/2+'px',top:(frame.clientHeight-h)/2+'px'});};base.addEventListener('load',fit,{once:true});fit();const observer=new ResizeObserver(fit);observer.observe(frame);worldObservers.push(observer);
 }
 document.querySelectorAll('#app .dialogue p').forEach(p=>p.classList.add('story-reveal'));
}
export function visual(name,prefs={}){
 if(prefs.motion===false)return;const frame=document.querySelector('#app .art-frame');if(!frame)return;
 frame.dataset.effect=name;const spark=document.createElement('div');spark.className='action-spark effect-'+name;spark.setAttribute('aria-hidden','true');frame.append(spark);setTimeout(()=>{spark.remove();delete frame.dataset.effect},620);
 const battle=frame.querySelector('.battle-stage');if(battle){battle.dataset.pose=name;setTimeout(()=>{delete battle.dataset.pose},520);}
}
