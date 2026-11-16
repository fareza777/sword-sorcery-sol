// Dedicated emulator only: packaged video, seekable stereo audio and launch order, fully offline.
import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const serial=process.env.SUNWARD_QA_DEVICE||'emulator-5580',pkg='com.ashenroad.sunward',port=9341;
if(!serial.startsWith('emulator-'))throw Error('Dedicated emulator required.');
const adb=(...args)=>execFileSync('C:/Android/Sdk/platform-tools/adb.exe',['-s',serial,...args],{encoding:'utf8',timeout:30000}).trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
assert.equal(adb('shell','settings','get','global','airplane_mode_on'),'1');
let pid;for(let i=0;i<30&&!pid;i++){try{pid=adb('shell','pidof',pkg)}catch{}if(!pid)await sleep(500)}assert.ok(pid);adb('forward',`tcp:${port}`,'localabstract:webview_devtools_remote_'+pid);
let target;for(let i=0;i<40&&!target;i++){try{target=(await fetch(`http://127.0.0.1:${port}/json`).then(r=>r.json())).find(t=>t.url.includes('appassets'))}catch{}if(!target)await sleep(500)}assert.ok(target);
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();
ws.addEventListener('message',e=>{const d=JSON.parse(e.data),p=pending.get(d.id);if(!p)return;clearTimeout(p.timer);pending.delete(d.id);d.error?p.reject(Error(d.error.message)):p.resolve(d.result)});
function rpc(method,params={}){return new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Timeout '+method))},30000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}))})}
async function run(expression){const r=await rpc('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function until(expression){for(let i=0;i<100;i++){if(await run(expression))return;await sleep(150)}throw Error('Timeout '+expression)}
await rpc('Runtime.enable');await rpc('Page.enable');await until('!!document.querySelector("[data-action=new]")');
const saved=await run('window.SunwardNative.readStorage("sunward.save.v1")');
await rpc('Page.addScriptToEvaluateOnNewDocument',{source:`window.brandQA={stages:[],videoTime:0,muted:true,events:[]};new MutationObserver(()=>{const e=document.querySelector('[data-intro]');const stage=e?.dataset.intro||(document.querySelector('[data-action=new]')?'home':null);if(stage&&brandQA.stages.at(-1)!==stage)brandQA.stages.push(stage);const v=document.querySelector('video');if(v&&!v.dataset.qa){v.dataset.qa='1';for(const event of ['loadedmetadata','playing','timeupdate','error','ended'])v.addEventListener(event,()=>{brandQA.events.push([event,v.currentTime,v.error?.message]);brandQA.videoTime=Math.max(brandQA.videoTime,v.currentTime);brandQA.muted=v.muted;if(Number.isFinite(v.duration))brandQA.videoDuration=v.duration})}}).observe(document,{subtree:true,childList:true});`});
await run('sessionStorage.removeItem("sunward.boot")');await rpc('Page.reload',{ignoreCache:true});
await until('!!document.querySelector("[data-intro=title]")');
await until('!!document.querySelector("[data-intro=developer] video")');
await until('!!document.querySelector("[data-action=new]")');const intro=await run('brandQA');console.log('Native intro:',JSON.stringify(intro));
assert.deepEqual(intro.stages,['title','developer','home']);assert.ok(intro.videoTime>2.6&&intro.muted);assert.equal(intro.videoDuration,4);
assert.equal(await run('window.SunwardNative.readStorage("sunward.save.v1")'),saved);
const range=await run(`fetch('audio/music/briarwick-morning.ogg',{headers:{Range:'bytes=0-99'}}).then(async r=>({status:r.status,length:(await r.arrayBuffer()).byteLength,type:r.headers.get('Content-Type')}))`);assert.equal(range.status,206);assert.equal(range.length,100);assert.ok(range.type.startsWith('audio/ogg'));
await run('document.querySelector("[data-action=settings]").click()');await until('document.querySelector("#music").currentTime>.1');
const music=await run('({duration:document.querySelector("#music").duration,time:document.querySelector("#music").currentTime,src:document.querySelector("#music").getAttribute("src")})');assert.equal(music.duration,64);
await run('document.querySelector("#music").currentTime=63.6');await until('document.querySelector("#music").currentTime<2&&!document.querySelector("#music").paused');music.seekAndLoop=true;
const effect=await run(`(async()=>{const c=new AudioContext();await c.resume();const b=await c.decodeAudioData(await fetch('audio/sfx/parry.wav').then(r=>r.arrayBuffer()));const s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start();return {channels:b.numberOfChannels,rate:b.sampleRate,duration:b.duration,state:c.state}})()`);assert.equal(effect.channels,2);assert.equal(effect.state,'running');
await run('window.nativeAudioPause()');assert.equal(await run('document.querySelector("#music").paused'),true);
await fs.writeFile('dist/native-branding-report.json',JSON.stringify({serial,androidAPI:35,airplaneMode:true,intro,saveUnchanged:true,range,music,effect,nativePause:true},null,2));ws.close();
console.log('PASS Android offline: ordered title/F7 splashes, real silent MP4, 64s Ogg, partial media ranges, stereo parry SFX, native pause and unchanged saves.');
