const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const read=n=>fs.readFileSync(path.join(base,n),'utf8');
function fn(source,name){const start=source.indexOf('function '+name+'(');assert(start>=0,name);let i=source.indexOf('{',start),depth=1,j=i+1;for(;depth&&j<source.length;j++){if(source[j]==='{')depth++;else if(source[j]==='}')depth--;}return source.slice(start,j);}
test('Cinematic and Claude Pixel bundles compile',()=>{for(const f of ['visual-room.bundle.js','visual-room-pixel.bundle.js'])new vm.Script(read(f),{filename:f});});
test('Missing photos do not abort a drawing frame',()=>{const s=read('visual-room/08-world.js');const calls=[];const tg={save(){},restore(){},drawImage(){calls.push('draw');}};const c=vm.createContext({tg});vm.runInContext(fn(s,'ready')+'\n'+fn(s,'drawPhoto'),c);c.drawPhoto(undefined,0,0,10,10,1);c.drawPhoto({complete:true,naturalWidth:0},0,0,10,10,1);assert.equal(calls.length,0);c.drawPhoto({complete:true,naturalWidth:100},0,0,10,10,1);assert.equal(calls.length,1);});
test('Pixel and failed image downloads retain drawn architecture',()=>{const s=read('visual-room/08-world.js');let fills=0;const tg=new Proxy({save(){},restore(){},fillRect(){fills++},createLinearGradient(){return {addColorStop(){}}}}, {get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>(t[k]=v,true)});const c=vm.createContext({tg,PHOTO:{},G:{pyr:{x:100,w:100,h:80},gy:200,temple:{x:300,y:100},s:1},THd:400,TWd:600,blocks:[],goldAmt:0,seasonAmt:()=>0,lerp:(a,b,k)=>a+(b-a)*k,smooth:x=>Math.max(0,Math.min(1,x))});for(const name of ['ready','drawPhoto','drawPyramid','drawTemple'])vm.runInContext(fn(s,name),c);c.drawPyramid(1,0);c.drawTemple(1,0);assert(fills>=4,'both buildings must remain visible without photos');});
function loader(fetch){const mount={innerHTML:'Loading'};const retry={};let script;const c=vm.createContext({window:{},document:{getElementById:id=>id==='vr-mount'?mount:id==='vr-retry'?retry:null,createElement:()=>({remove(){}}),body:{appendChild:s=>script=s}},fetch,AbortController,setTimeout:()=>1,clearTimeout(){}});const src=read('visual-room-loader.html').split('<script>')[1].split('</script>')[0];vm.runInContext(src,c);return {mount,retry,get script(){return script}};}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('Loader offers retry when settings are offline',async()=>{const l=loader(()=>Promise.reject(new Error('offline')));await settle();assert.match(l.mount.innerHTML,/Erneut versuchen/);assert.equal(typeof l.retry.onclick,'function');});
test('Failed bundle request offers retry after settings have loaded',async()=>{const l=loader(()=>Promise.resolve({ok:true,json:()=>Promise.resolve({bundle_url:'https://example.test/room.js'})}));await settle();assert(l.script);l.script.onerror();assert.match(l.mount.innerHTML,/Erneut versuchen/);});
