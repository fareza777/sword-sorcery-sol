import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import ART from '../app/src/main/assets/art.mjs';import {NODES,EVENTS,CHAPTERS} from '../app/src/main/assets/story.mjs';
const path='app/src/main/assets/';
test('every scene, story page, encounter and planned asset uses completed generated artwork',()=>{
 const plan={jobs:['1.1','1.2'].flatMap(v=>JSON.parse(fs.readFileSync('tools/art-plan-v'+v+'.json')).jobs)},sources=JSON.parse(fs.readFileSync('tools/art-sources.json'));
 assert.ok(Object.keys(ART).length===108);
 for(const j of plan.jobs){assert.ok(sources[j.key],j.key);assert.ok(!j.redo,j.key+' requires review');assert.ok(ART[j.key],j.key);}
 const keys=[...Object.values(NODES).flatMap(n=>[n.art,...n.artPages||[]]),...EVENTS.map(e=>e.art),...CHAPTERS.map(c=>c.art)];
 for(const k of keys){assert.ok(ART[k],k);assert.ok(ART[k].endsWith('.webp'),k+' must be generated art');}
 for(const file of Object.values(ART)){const bytes=fs.readFileSync(path+file);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
 assert.deepEqual(fs.readdirSync(path+'art').filter(f=>f.endsWith('.svg')),['emblem.svg']);
});
test('animated character layers contain genuine WebP alpha transparency',()=>{
 for(const key of [...['rowan_idle','rowan_strike','rowan_ward','enemy_brambleback','enemy_sentinel','enemy_captain','enemy_guardian'],...JSON.parse(fs.readFileSync('tools/art-plan-v1.2.json')).jobs.filter(j=>['actor','icon','prop'].includes(j.kind)).map(j=>j.key)]){
  const b=fs.readFileSync(path+ART[key]);let transparent=false;
  for(let at=12;at+8<b.length;){const kind=b.toString('ascii',at,at+4),length=b.readUInt32LE(at+4);if(kind==='VP8X')transparent=!!(b[at+8]&16);at+=8+length+(length%2);}
  assert.ok(transparent,key+' needs a transparent background');
 }
});
test('all three original music themes are bundled complete for offline playback',()=>{
 for(const key of ['briarwick-morning','river-lanterns','keepers-of-light']){const b=fs.readFileSync(path+'audio/'+key+'.wav');assert.equal(b.toString('ascii',8,12),'WAVE');assert.equal(b.readUInt32LE(24),22050);assert.equal(b.readUInt32LE(40)/b.readUInt32LE(28),64);}
});
