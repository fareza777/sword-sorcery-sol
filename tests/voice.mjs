import {chromium} from 'playwright';import assert from 'node:assert/strict';import * as E from '../app/src/main/assets/engine.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
for(const [id,event,track]of [['intro',null,'intro-0.mp3'],['bridge_duel',null,'duel-brambleback-0.mp3'],['forest_map',{index:1,to:'fox'},'event-1.mp3']]){
 const p=await browser.newPage({viewport:{width:390,height:844}});const s=E.fresh();E.go(s,id);s.event=event;
 await p.addInitScript(s=>{sessionStorage.setItem('sunward.boot','1');localStorage.setItem('sunward.save.v1',s);localStorage.setItem('sunward.prefs',JSON.stringify({voice:false,music:false,motion:false}))},E.serialize(s));
 await p.goto('http://127.0.0.1:4173');await p.locator('[data-action=continue]').click();await p.locator('[data-action=listen]').click();
 await p.waitForFunction(()=>document.querySelector('#voice').readyState>=2);assert.ok((await p.locator('#voice').getAttribute('src')).endsWith(track));await p.close();
}await browser.close();console.log('PASS: Listen replays conversation, duel telegraph, and encounter voice tracks.');
