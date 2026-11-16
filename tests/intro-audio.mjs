import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:393,height:797}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 window.introStages=[];new MutationObserver(()=>{const stage=document.querySelector('[data-intro]')?.dataset.intro;if(stage&&window.introStages.at(-1)!==stage)window.introStages.push(stage)}).observe(document,{childList:true,subtree:true});
 const Base=window.AudioContext;window.effectStarts=0;window.effectStops=0;
 if(Base)window.AudioContext=class extends Base{createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source),stop=source.stop.bind(source);source.start=(...args)=>{window.effectStarts++;return start(...args)};source.stop=(...args)=>{window.effectStops++;return stop(...args)};return source;}};
});
await page.goto('http://127.0.0.1:4173');await page.locator('[data-intro=title]').waitFor();
assert.equal(await page.locator('#music').evaluate(e=>e.paused),true);
await page.screenshot({path:'dist/preview-splash-title.png'});
await page.locator('[data-intro=developer] video').waitFor();
await page.waitForFunction(()=>document.querySelector('video')?.currentTime>2.8);
assert.equal(await page.locator('video').evaluate(e=>e.muted),true);
assert.equal(await page.locator('video').evaluate(e=>getComputedStyle(e).objectFit),'contain');
await page.screenshot({path:'dist/preview-splash-f7.png'});
await page.locator('[data-action=new]').waitFor();
assert.deepEqual(await page.evaluate(()=>introStages),['title','developer']);
assert.equal(await page.evaluate(()=>sessionStorage.getItem('sunward.boot')),'1');
await page.reload();await page.locator('[data-action=new]').waitFor();assert.equal(await page.locator('[data-intro]').count(),0);
// Compact phones, both languages and reduced motion retain a large usable skip control.
let layouts=0;
for(const [width,height] of [[320,568],[360,640],[393,797],[430,932]])for(const language of ['en','id']){
 await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(language=>{sessionStorage.removeItem('sunward.boot');localStorage.setItem('sunward.prefs',JSON.stringify({language,motion:false,voice:false,music:false,sfx:false}))},language);
 await page.reload();await page.locator('[data-intro=title]').waitFor();
 const check=async()=>{assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true);const box=await page.locator('.intro-skip').boundingBox();assert.ok(box.height>=44&&box.y+box.height<=height);assert.ok(await page.locator('.intro-skip').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=17));layouts++;};
 await check();await page.locator('.intro-skip').click();await page.locator('[data-intro=developer] img').waitFor();assert.equal(await page.locator('video').count(),0);await check();await page.locator('.intro-skip').click();await page.locator('[data-action=new]').waitFor();
}
// A failed bundled-video request falls back without hanging the game.
await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:393,height:797});
await page.evaluate(()=>{sessionStorage.removeItem('sunward.boot');localStorage.setItem('sunward.prefs',JSON.stringify({motion:true,voice:true,music:true,sfx:true}))});
await page.route('**/branding/f7-intro.mp4',route=>route.abort());await page.reload();await page.locator('[data-intro=title]').waitFor();await page.locator('.intro-skip').click();await page.locator('[data-intro=developer]').waitFor();await page.locator('[data-action=new]').waitFor();await page.unroute('**/branding/f7-intro.mp4');
// A real user interaction starts the local music; volume persists and ducks under voice.
await page.locator('[data-action=settings]').click();
await page.waitForFunction(()=>document.querySelector('#music').currentTime>.05);
assert.ok(Math.abs(await page.locator('#music').evaluate(e=>e.duration)-64)<.01);
await page.locator('[data-pref=musicVolume]').evaluate(e=>{e.value='.3';e.dispatchEvent(new Event('change',{bubbles:true}))});await page.waitForFunction(()=>Math.abs(document.querySelector('#music').volume-.3)<.003);
await page.evaluate(async()=>{const voice=document.querySelector('#voice');voice.src='audio/intro-0.mp3';await voice.play()});await page.waitForFunction(()=>Math.abs(document.querySelector('#music').volume-.069)<.003);
await page.evaluate(()=>document.querySelector('#voice').pause());await page.waitForFunction(()=>Math.abs(document.querySelector('#music').volume-.3)<.003);
const before=await page.evaluate(()=>effectStarts);
await page.evaluate(async()=>{const m=await import('./audio-engine.mjs');await m.sound('parry',{sfx:false})});assert.equal(await page.evaluate(()=>effectStarts),before);
await page.evaluate(async()=>{const m=await import('./audio-engine.mjs');await m.sound('parry',{sfx:true})});assert.equal(await page.evaluate(()=>effectStarts),before+1);
await page.evaluate(async()=>{(await import('./audio-engine.mjs')).pauseEffects()});assert.ok(await page.evaluate(()=>effectStops)>0);
await page.evaluate(async()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));await(await import('./audio-engine.mjs')).sound('win',{sfx:true})});assert.equal(await page.locator('#music').evaluate(e=>e.paused),true);assert.equal(await page.evaluate(()=>effectStarts),before+1);await page.evaluate(()=>delete document.hidden);
await browser.close();assert.deepEqual(errors,[]);
await fs.writeFile('dist/intro-audio-report.json',JSON.stringify({orderedSplashes:['Sunward Oath','F7 Developer'],officialVideoPlays:true,silentStartup:true,skip:true,videoErrorFallback:true,reducedMotionPoster:true,layouts,offlineMusicDecoded:true,ducking:true,volumePersisted:true,sampledEffects:true,muteAndBackground:true,errors},null,2));
console.log(`PASS: two ordered splashes, video playback/fallback, ${layouts} portrait layouts, local music, ducking, volumes, sampled SFX and background silence.`);
