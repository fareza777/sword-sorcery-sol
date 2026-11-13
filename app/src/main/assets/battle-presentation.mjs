import ART from './art.mjs';
const NAMES={brambleback:['Brambleback','Brambleback'],sentinel:['Stone Sentinel','Penjaga Batu'],captain:['Captain Varric','Kapten Varric'],guardian:['Crown Guardian','Penjaga Mahkota']};

export function createBattlePresentation({L,ico,getPrefs}){
 function name(enemy){return L(...NAMES[enemy]);}
 function hud(state,node){
  const d=state.duel,percent=d.hp/d.maxHp*100;
  return `<div class="duel-info enemy-health-panel"><div class="enemy-heading"><strong>${name(node.enemy)}</strong><span class="enemy-hp-number">HP <b data-enemy-hp>${d.hp}</b><span> / ${d.maxHp}</span></span></div><div class="enemy-healthbar" role="progressbar" aria-label="${name(node.enemy)} HP" aria-valuemin="0" aria-valuemax="${d.maxHp}" aria-valuenow="${d.hp}"><i class="enemy-hp-trail" style="width:${percent}%"></i><i class="enemy-hp-fill" style="width:${percent}%"></i></div><div class="battle-round"><span>${L('Round','Ronde')} ${d.round+1}/${d.roundLimit}</span><span>${ico('shield')}${L('Guard','Pertahanan')} <b data-player-guard>${d.guard}</b>/3</span></div></div>`;
 }
 function animate({move,result,hp,maxHp,guard,damage,hit}){
  const frame=document.querySelector('#app .art-frame'),stage=frame?.querySelector('.battle-stage');
  if(!stage)return 0;
  const motion=getPrefs().motion!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const updateHUD=()=>{
   document.querySelector('.enemy-healthbar')?.setAttribute('aria-valuenow',String(hp));
   const number=document.querySelector('[data-enemy-hp]');if(number)number.textContent=hp;
   const shield=document.querySelector('[data-player-guard]');if(shield)shield.textContent=guard;
   const fill=document.querySelector('.enemy-hp-fill'),trail=document.querySelector('.enemy-hp-trail');
   if(fill)fill.style.width=hp/maxHp*100+'%';
   if(trail){if(motion)setTimeout(()=>{trail.style.width=hp/maxHp*100+'%';},90);else trail.style.width=hp/maxHp*100+'%';}
  };
  if(!motion){updateHUD();return 0;}
  const duration=Math.max({guard:900,ward:1000,strike:850,dodge:750}[move]||850,result==='continue'?0:1000),contact=move==='ward'?300:220;
  stage.dataset.pose=move;stage.dataset.resolving='true';
  if(result==='win')stage.dataset.finished='true';if(hit)stage.dataset.hit='true';
  const fx=(id,cls)=>ART[id]?`<img class="${cls}" src="${ART[id]}" alt="">`:'';
  const effect=document.createElement('div');effect.className='combat-effects';effect.style.setProperty('--contact',contact+'ms');effect.setAttribute('aria-hidden','true');
  effect.innerHTML=`${damage?`<span class="combat-number enemy-damage">−${damage} HP</span>`:''}${hit?`<span class="combat-number guard-damage">−${hit} ${L('guard','pertahanan')}</span>`:''}${move==='strike'?fx('fx_sword_arc','combat-slash-art')+fx('fx_metal_sparks','combat-hit-art'):''}${move==='ward'?fx('fx_sun_guard','combat-aegis'):''}${move==='guard'&&damage?fx('fx_metal_sparks','combat-parry-art')+'<i class="parry-glint"></i>':''}`;
  frame.append(effect);
  setTimeout(()=>{
   updateHUD();const announcement=document.createElement('span');announcement.className='combat-announcement';announcement.setAttribute('role','status');announcement.textContent=L(`Enemy HP ${hp}/${maxHp}. Your guard ${guard}/3.`,`HP musuh ${hp}/${maxHp}. Pertahananmu ${guard}/3.`);frame.append(announcement);
  },contact);
  return duration;
 }
 return {hud,animate};
}
