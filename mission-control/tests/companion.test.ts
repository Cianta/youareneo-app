import test from 'node:test';
import assert from 'node:assert/strict';
import {microphoneConstraints,microphoneError} from '../lib/assistant/microphone';
import {companionMood} from '../lib/assistant/companion';
import {dayPhase,weatherMood} from '../lib/assistant/ambience';
import {preferencesOf} from '../lib/assistant/preferences';
import {collectSnapshot,snapshotOf,restoreSnapshot} from '../lib/workspace/snapshot';
test('microphone failures explain device absence, permission denial and unavailable device distinctly',()=>{
 const permission=microphoneError(new DOMException('private SDK detail','NotAllowedError'));
 assert(permission.includes('blockiert'));assert(!permission.includes('private SDK detail'));
 assert(microphoneError(new DOMException('','NotFoundError')).includes('Kein Mikrofon'));
 assert(microphoneError(new DOMException('','NotReadableError')).includes('andere App'));
 assert(microphoneError(new DOMException('','OverconstrainedError')).includes('Systemstandard'));
 assert.deepEqual(microphoneConstraints('selected-device'),{audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,deviceId:{exact:'selected-device'}},video:false});
 assert(!('deviceId' in (microphoneConstraints().audio as object)));
});
test('companion gives rest precedence and does not invent mail signals',()=>{
 assert.equal(companionMood({completed:0,activeMinutes:0,unreadMail:null}).mood,'calm');
 assert.equal(companionMood({completed:1,activeMinutes:3,unreadMail:null}).mood,'celebrate');
 assert.equal(companionMood({completed:12,activeMinutes:46,unreadMail:10}).mood,'rest');
 assert.equal(companionMood({completed:0,activeMinutes:10,unreadMail:2}).mood,'focus');
 assert.equal(companionMood({completed:12,activeMinutes:99,unreadMail:4,adaptive:false}).mood,'calm');
});
test('daylight boundaries and weather map actual codes, with weather off by default',()=>{
 assert.deepEqual([4,5,8.99,9,16.99,17,20.99,21].map(dayPhase),['night','dawn','dawn','day','day','dusk','dusk','night']);
 assert.equal(weatherMood(45),'fog');assert.equal(weatherMood(61),'rain');assert.equal(weatherMood(73),'snow');assert.equal(weatherMood(2),'cloud');assert.equal(weatherMood(0),'clear');
 assert.equal(preferencesOf({}).weatherEnabled,false);
 assert.equal(preferencesOf({weatherPlace:{name:'Invalid',latitude:999,longitude:2}}).weatherPlace,null);
 assert.equal(preferencesOf({companion:'foreign',energyColor:'bad',atmosphere:999}).atmosphere,15);
});
const notebook=JSON.stringify({state:{entries:[],isOpen:false},version:0});
function storage(){const map=new Map<string,string>();return {map,getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v)},removeItem:(k:string)=>{map.delete(k)}};}
test('snapshot only includes consciously selected workspace keys, never sessions or arbitrary stores',()=>{
 const s=storage();s.setItem('trinity-notebook',notebook);s.setItem('session','secret fixture');
 const snap=collectSnapshot(s,['trinity-notebook']);assert.deepEqual(Object.keys(snap.stores),['trinity-notebook']);
 assert.throws(()=>collectSnapshot(s,['session']));assert.throws(()=>snapshotOf({version:1,stores:{session:'{}'}}));
 assert.throws(()=>snapshotOf({version:1,stores:{'trinity-notebook':JSON.stringify({state:{entries:[],setEntries:'clobbered'},version:0})}}));
 assert.throws(()=>snapshotOf({version:1,stores:{'trinity-notebook':'{"state":{"entries":[],"__proto__":{}},"version":0}'}}));
 assert.throws(()=>snapshotOf({version:1,stores:{'trinity-notebook':JSON.stringify({state:{entries:[{password:'secret'}]},version:0})}}));
 assert.throws(()=>snapshotOf({version:2,stores:{}}));
});
test('restore preserves unrelated stores and keeps a recoverable pre-restore copy',()=>{
 const s=storage();s.setItem('trinity-notebook',notebook);s.setItem('session','untouched');
 const changed=JSON.stringify({state:{entries:[],isOpen:true},version:0});restoreSnapshot(s,{version:1,stores:{'trinity-notebook':changed}});
 assert.equal(s.getItem('session'),'untouched');assert.equal(s.getItem('trinity-notebook'),changed);
 assert.equal(JSON.parse(s.getItem('guiding-workspace-before-restore')!).stores['trinity-notebook'],notebook);
});
test('failed local restore rolls back earlier writes; failed backup never starts replacement',()=>{
 const s=storage();s.setItem('trinity-notebook',notebook);const snapshot={version:1 as const,stores:{'trinity-notebook':notebook,'trinity-birth-profiles-v1':JSON.stringify({state:{profiles:{}},version:0})}};
 let failed=false;const original=s.setItem;s.setItem=(k,v)=>{if(k==='trinity-birth-profiles-v1'&&!failed){failed=true;throw Error('quota')}original(k,v)};
 assert.throws(()=>restoreSnapshot(s,snapshot));assert.equal(s.getItem('trinity-notebook'),notebook);assert.equal(s.getItem('trinity-birth-profiles-v1'),null);
 const s2=storage();s2.setItem('trinity-notebook','original');s2.setItem=()=>{throw Error('quota')};assert.throws(()=>restoreSnapshot(s2,snapshot));assert.equal(s2.getItem('trinity-notebook'),'original');
});
