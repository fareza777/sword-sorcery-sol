// Android WebView page-level CDP works with the emulator's bundled WebView version.
import {execFileSync} from 'node:child_process';import fs from 'node:fs/promises';import assert from 'node:assert/strict';import * as E from '../app/src/main/assets/engine.mjs';
const serial=process.env.SUNWARD_QA_DEVICE||'emulator-5580',pkg='com.ashenroad.sunward',port='9341';
if(!serial.startsWith('emulator-'))throw Error('Use a dedicated QA emulator, never the player’s phone.');
const adb=(...args)=>execFileSync('adb',['-s',serial,...args],{encoding:'utf8',timeout:25000}).trim(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws,next=0,pending=new Map();
function rpc(method,params={}){return new Promise((resolve,reject)=>{const id=++next,t=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},15000);pending.set(id,{resolve,reject,t});ws.send(JSON.stringify({id,method,params}));});}
async function run(expression){const r=await rpc('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function until(expression){for(let i=0;i<100;i++){if(await run(expression))return;await sleep(150)}throw Error('Timeout '+expression);}
async function connect(){
 let pid='';for(let i=0;i<30&&!pid;i++){try{pid=adb('shell','pidof',pkg)}catch{}if(!pid)await sleep(500)}assert.ok(pid);
 adb('forward','tcp:'+port,'localabstract:webview_devtools_remote_'+pid);let target;
 for(let i=0;i<30;i++){try{target=(await fetch('http://127.0.0.1:'+port+'/json').then(r=>r.json())).find(t=>t.url?.includes('appassets'));if(target)break}catch{}await sleep(500)}assert.ok(target);
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 ws.addEventListener('message',e=>{const d=JSON.parse(e.data),p=pending.get(d.id);if(!p)return;clearTimeout(p.t);pending.delete(d.id);if(d.error)p.reject(Error(d.error.message));else p.resolve(d.result)});
 await rpc('Runtime.enable');await rpc('Runtime.runIfWaitingForDebugger');await until('!!document.querySelector(".screen")');
}
async function press(a,extra=''){const sel=`[data-action="${a}"]${extra}`,q=`document.querySelector(${JSON.stringify('#overlay '+sel)})||document.querySelector(${JSON.stringify(sel)})`;await until(`!!(${q})`);await run(`(()=>{const e=${q};if(e.disabled)throw Error('Disabled button');e.click()})()`);}
const current=()=>run("import('./app.mjs').then(m=>m.getState())");async function pages(){while(await run('!!document.querySelector("[data-action=next]")'))await press('next');}
assert.equal(adb('shell','settings','get','global','airplane_mode_on'),'1');await connect();
if(await run('!!document.querySelector("[data-action=new]")')){await press('new');if(await run('!!document.querySelector("[data-action=confirm-new]")'))await press('confirm-new');else for(let i=0;i<3&&await run('!!document.querySelector("[data-action=onboard]")');i++)await press('onboard');await press('begin-chapter');}
assert.equal((await current()).id,'intro');await until('document.querySelector("#voice").readyState>=2&&document.querySelector("#voice").currentTime>0.05');
const speech=await run('({src:document.querySelector("#voice").src,duration:document.querySelector("#voice").duration,time:document.querySelector("#voice").currentTime})');assert.ok(speech.src.includes('/audio/intro-0.mp3'));
await pages();await press('choose','[data-index="0"]');const saved=await current();assert.equal(saved.id,'forge_intro');
ws.close();adb('shell','am','force-stop',pkg);adb('shell','am','start','-n',pkg+'/.MainActivity');await sleep(500);await connect();await press('continue');assert.equal((await current()).id,saved.id);
await press('pause');await press('settings');await run('(()=>{const e=document.querySelector("#language");e.value="id";e.dispatchEvent(new Event("change",{bubbles:true}))})()');assert.equal(await run('document.documentElement.lang'),'id');await press('close');
async function inject(id,flags=[]){await press('pause');await press('home');const s=E.fresh();E.go(s,id);E.apply(s,{flags,relations:{rook:8,iona:8,mira:8}});await run(`localStorage.setItem('sunward.save.v1',${JSON.stringify(E.serialize(s))})`);await press('continue');}
await inject('rune_puzzle');await press('hint');await press('hint-ad');await until('document.querySelector("#toast").textContent.includes("Iklan belum tersedia")');await press('close');
for(const key of ['leaf','water','sun'])await press('rune',`[data-rune="${key}"]`);assert.equal((await current()).id,'rune_open');
await inject('bridge_duel');for(const move of ['guard','dodge','strike'])await press('duel',`[data-move="${move}"]`);assert.equal((await current()).id,'bridge_spare');
for(const ending of ['council','free','crown','king','home']){await inject(ending==='home'?'retreat':'final_choice',['clan_promise','iona_honest','mira_heard','evidence']);await pages();const i={council:0,free:1,crown:2,king:3,home:0}[ending];if(!await run(`!!document.querySelector('[data-action="choose"][data-index="${i}"]')`))await press(i>=2?'choice-more':'choice-previous');await press('choose',`[data-index="${i}"]`);assert.equal((await current()).ending,ending);}
await pages();await rpc('Page.enable');const shot=await rpc('Page.captureScreenshot',{format:'png'});await fs.writeFile('dist/android-offline-ending.png',Buffer.from(shot.data,'base64'));
const info=await run('({width:innerWidth,height:innerHeight,bridge:!!window.SunwardNative,phoneLanguage:window.SunwardNative.language(),fonts:document.fonts.status,endingGallery:JSON.parse(localStorage.getItem("sunward.endings"))})');
await fs.writeFile('dist/android-test-report.json',JSON.stringify({device:serial,api:adb('shell','getprop','ro.build.version.sdk'),airplaneMode:true,offlineVoice:speech,coldRestartSave:true,puzzle:true,duel:true,optionalRewardedUnavailableHandled:true,endings:5,info},null,2));
console.log('PASS: Android offline VO playback, process-death autosave, Indonesian, puzzle, duel, five endings, and unavailable-ad recovery.');ws.close();process.exit(0);
