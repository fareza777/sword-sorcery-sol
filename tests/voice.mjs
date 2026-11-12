import {chromium} from 'playwright';import assert from 'node:assert/strict';import * as E from '../app/src/main/assets/engine.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
for(const [id,event,track,inspect]of [['forge_search',null,'inspect-forge_search-cups.mp3',true],['sentinel_duel',null,'duel-sentinel-0.mp3'],['mirror_puzzle',null,'mirror_puzzle-0.mp3'],['bells_puzzle',null,'bells_puzzle-0.mp3'],['camp_talk_3',null,'camp_talk_3-0.mp3'],['intro',null,'intro-0.mp3'],['bridge_duel',null,'duel-brambleback-0.mp3'],['forest_map',{index:1,to:'fox'},'event-1.mp3']]){
 const p=await browser.newPage({viewport:{width:390,height:844}});const s=E.fresh();E.go(s,id);s.event=event;
 await p.addInitScript(s=>{sessionStorage.setItem('sunward.boot','1');localStorage.setItem('sunward.save.v1',s);localStorage.setItem('sunward.prefs',JSON.stringify({voice:false,music:false,motion:false}))},E.serialize(s));
 await p.goto('http://127.0.0.1:4173');await p.locator('[data-action=continue]').click();if(inspect)await p.locator('[data-action=inspect-point][data-index="0"]').click();await p.locator('[data-action=listen]').click();
 await p.waitForFunction(()=>document.querySelector('#voice').readyState>=2);assert.ok((await p.locator('#voice').getAttribute('src')).endsWith(track));await p.close();
}await browser.close();console.log('PASS: Listen replays conversation, investigation, sentinel, beam puzzle, forging, camp, and encounter voice tracks.');
