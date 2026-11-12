import {chromium} from 'playwright';import * as E from '../app/src/main/assets/engine.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
for(const [name,id,lang]of [['title',null,'en'],['dialogue','workshop','id'],['puzzle','rune_puzzle','id'],['final','final_choice','en'],['investigate','forge_search','id'],['water-gates','lock_puzzle','en'],['mirrors','mirror_puzzle','id'],['forging','bells_puzzle','id'],['duel','sentinel_duel','en'],['river-ending','ending_river','id']]){
 const p=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 let s=null;if(id){s=E.fresh();E.go(s,id)}
 await p.addInitScript(({s,lang})=>{localStorage.clear();sessionStorage.setItem('sunward.boot','1');localStorage.setItem('sunward.prefs',JSON.stringify({language:lang,voice:false,music:false,motion:false}));if(s)localStorage.setItem('sunward.save.v1',s)},{s:s?E.serialize(s):null,lang});
 await p.goto('http://127.0.0.1:4173');await p.locator('[data-action="new"]').waitFor();if(s)await p.locator('[data-action="continue"]').click();
 await p.waitForFunction(()=>[...document.images].every(x=>x.complete));await p.screenshot({path:`dist/preview-${name}.png`});
 console.log(name,await p.evaluate(()=>({height:innerHeight,content:document.querySelector('.screen').scrollHeight,font:getComputedStyle(document.querySelector('.dialogue p')||document.querySelector('.home-title p')).fontSize})));
 await p.close();
}await browser.close();
