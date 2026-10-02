import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {readMemberMail,writeMemberMail} from '../lib/mail/cache';
test('mail cache never falls back to the unowned historical cache or another member',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'guiding-mail-fixture-'));const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 try{await writeFile(path.join(root,'gmail-threads.json'),'[{"private":"legacy fixture"}]');assert.equal(await readMemberMail(root,a),null);
 await writeMemberMail(root,a,[]);assert.deepEqual(await readMemberMail(root,a),[]);assert.equal(await readMemberMail(root,b),null);
 assert.equal(await readFile(path.join(root,'gmail-threads.json'),'utf8'),'[{"private":"legacy fixture"}]');
 await assert.rejects(readMemberMail(root,'../gmail-threads'));await assert.rejects(writeMemberMail(root,'../../outside',[]));}
 finally{await rm(root,{recursive:true,force:true});}
});
