/** Two bundled launch cards. No network, audio, or progress changes. */
export function startIntro({app,L,motion,onDone}){
 let stage=0,timer,finished=false,video;
 const reduced=!motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clear=()=>{clearTimeout(timer);if(video){video.pause();video.removeAttribute('src');video.load();video=null;}};
 function finish(){if(finished)return;finished=true;clear();document.removeEventListener('visibilitychange',visibility);try{sessionStorage.setItem('sunward.boot','1')}catch{}onDone();}
 function advance(){if(finished)return;if(stage===1)showBrand();else finish();}
 function visibility(){if(!video)return;if(document.hidden)video.pause();else video.play().catch(()=>{});}
 function skipButton(){return `<button class="intro-skip" type="button">${L('Skip','Lewati')} <span aria-hidden="true">›</span></button>`;}
 function showBrand(){
  clear();stage=2;
  app.innerHTML=`<section class="intro intro-brand" data-intro="developer" aria-label="F7 Developer"><div class="intro-brand-media">${reduced?'<img src="branding/f7-poster.png" alt="F7 Developer">':'<video muted playsinline preload="auto" poster="branding/f7-poster.png" aria-label="F7 Developer"><source src="branding/f7-intro.mp4" type="video/mp4"></video>'}</div>${skipButton()}</section>`;
  app.querySelector('button').onclick=finish;
  video=app.querySelector('video');
  if(video){video.muted=true;video.onended=finish;video.onerror=()=>{clearTimeout(timer);timer=setTimeout(finish,1200);};video.querySelector('source').onerror=video.onerror;video.play().catch(()=>{});}
  timer=setTimeout(finish,reduced?1600:5500);
 }
 stage=1;
 app.innerHTML=`<section class="intro intro-title" data-intro="title" aria-label="Sunward Oath"><div class="intro-title-art"><img src="branding/launcher-foreground.png" alt="" draggable="false"></div><div class="intro-title-copy"><span class="intro-kicker">${L('AN ILLUSTRATED ADVENTURE','PETUALANGAN BERILUSTRASI')}</span><h1>SUNWARD<span>OATH</span></h1><p>${L('A promise. A journey.','Sebuah janji. Sebuah perjalanan.')}</p></div>${skipButton()}</section>`;
 app.querySelector('button').onclick=advance;
 timer=setTimeout(showBrand,1400);
 document.addEventListener('visibilitychange',visibility);
 return {skip:advance,pause:()=>video?.pause(),resume:()=>{if(video&&!document.hidden)video.play().catch(()=>{});}};
}
