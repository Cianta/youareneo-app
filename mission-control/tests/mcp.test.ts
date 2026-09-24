import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {database} from '../lib/mcp/store';
import {authorization,grantCode,exchange,hash,bearer,validRedirect,resource,READ,WRITE} from '../lib/mcp/oauth';
import {POST as mcpPost} from '../app/mcp/route';
const dir=mkdtempSync(join(tmpdir(),'trinity-mcp-test-'));
process.env.TRINITY_MCP_ENABLED='true';process.env.TRINITY_MCP_DB=join(dir,'test.sqlite');process.env.TRINITY_PUBLIC_URL='https://trinity.example';
const redirect='http://127.0.0.1:4321/callback',verifier='a'.repeat(64);
function params(client='test-client',scope=READ){return new URLSearchParams({client_id:client,redirect_uri:redirect,response_type:'code',scope,code_challenge_method:'S256',code_challenge:hash(verifier),resource:resource(),state:'state-value'});}
function token(user:string,scope=READ){const p=params('test-client',scope),url=new URL(grantCode(user,p));return exchange(new URLSearchParams({grant_type:'authorization_code',client_id:'test-client',redirect_uri:redirect,resource:resource(),code:url.searchParams.get('code')!,code_verifier:verifier}))!;}
function request(access:string,body:unknown){return new Request(resource(),{method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify(body)});}
test('OAuth PKCE, audience, one-use codes, refresh replay and tenant isolation',async()=>{try{const db=database();db.prepare('INSERT INTO clients VALUES(?,?,?)').run('test-client','Test Agent',JSON.stringify([redirect]));
 assert.equal(validRedirect('javascript:alert(1)'),false);assert.equal(validRedirect('http://evil.example/cb'),false);assert.equal(validRedirect(redirect),true);
 const wrong=params();wrong.set('redirect_uri','https://evil.example');assert.throws(()=>authorization(wrong));
 const code=new URL(grantCode('alice',params())).searchParams.get('code')!;const form=new URLSearchParams({grant_type:'authorization_code',client_id:'test-client',redirect_uri:redirect,resource:resource(),code,code_verifier:'b'.repeat(64)});assert.throws(()=>exchange(form));form.set('code_verifier',verifier);form.set('resource','https://evil.example/mcp');assert.throws(()=>exchange(form));form.set('resource',resource());const a=exchange(form)!;assert.throws(()=>exchange(form));assert.equal(bearer(request(a.access_token,{}))?.user_id,'alice');
 const refresh=new URLSearchParams({grant_type:'refresh_token',client_id:'test-client',resource:resource(),refresh_token:a.refresh_token});const renewed=exchange(refresh)!;assert(renewed.access_token);assert.throws(()=>exchange(refresh));assert.equal(bearer(request(renewed.access_token,{})),null);
 db.prepare('INSERT INTO vault VALUES(?,?,?)').run('alice',JSON.stringify([{id:'secret',title:'Alice only',kind:'Notiz',markdown:'PRIVATE'}]),new Date().toISOString());const bob=token('bob');let response=await mcpPost(request(bob.access_token,{jsonrpc:'2.0',id:1,method:'tools/list',params:{}}));assert.equal(response.status,200);let data=await response.json();assert.equal(data.result.tools.length,2);assert(!data.result.tools.some((t:{name:string})=>t.name==='propose_note'));
 response=await mcpPost(request(bob.access_token,{jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'read_document',arguments:{id:'secret'}}}));data=await response.json();assert.equal(data.result.isError,true);assert(!JSON.stringify(data).includes('PRIVATE'));
 const alice=token('alice',`${READ} ${WRITE}`);response=await mcpPost(request(alice.access_token,{jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'propose_note',arguments:{title:'Idea',body:'A new idea'}}}));data=await response.json();assert(!data.error);assert.equal((db.prepare('SELECT user_id FROM inbox').get() as {user_id:string}).user_id,'alice');
 db.prepare('UPDATE grants SET revoked=1 WHERE user_id=?').run('bob');response=await mcpPost(request(bob.access_token,{jsonrpc:'2.0',id:4,method:'tools/list',params:{}}));assert.equal(response.status,401);
 }finally{rmSync(dir,{recursive:true,force:true});}});
