/**
 * TRINITY OS · Gmail Threads API
 * ─────────────────────────────────
 * Serves cached Gmail thread data fetched via the Gmail MCP.
 * Supports filtering by label (inbox, unread, starred, sent, all).
 *
 * GET /api/gmail/threads?filter=inbox&limit=20
 */
import { NextRequest } from 'next/server';
import {voiceSession} from '@/lib/voice/server';
import {json,failure,HttpError,sameOrigin} from '@/lib/auth/http';
import {readMemberMail,writeMemberMail} from '@/lib/mail/cache';
import path from 'path';

const CACHE_DIR = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'private', 'mail-cache');

export async function GET(req: NextRequest) {
 try {
  const {user}=await voiceSession();
  const filter = req.nextUrl.searchParams.get('filter') ?? 'all';
  const n=Number(req.nextUrl.searchParams.get('limit')??30),limit=Number.isSafeInteger(n)?Math.max(1,Math.min(100,n)):30;
  const cached=await readMemberMail(CACHE_DIR,user.id);
  if(!cached)return json({ok:true,available:false,userScoped:true,userId:user.id,total:0,totalUnread:null,threads:[]});
  const totalUnread=cached.filter(t=>t.isUnread).length;
  let threads=[...cached];
  // Filter
  switch (filter) {
    case 'inbox':
      threads = threads.filter(t => t.labels.includes('INBOX'));
      break;
    case 'unread':
      threads = threads.filter(t => t.isUnread);
      break;
    case 'starred':
      threads = threads.filter(t => t.isStarred);
      break;
    case 'important':
      threads = threads.filter(t => t.isImportant);
      break;
    case 'sent':
      threads = threads.filter(t => t.labels.includes('SENT'));
      break;
  }

  // Sort newest first
  threads.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());

  return json({
    ok: true, available:true,userScoped:true,userId:user.id,totalUnread,
    filter,
    total: threads.length,
    threads: threads.slice(0, limit),
  });
 }catch(e){return failure(e);}
}

// Legacy refresh boundary, now scoped to a verified member. Existing global cache is untouched.
export async function POST(req: NextRequest) {
  try {
    sameOrigin(req);const {user}=await voiceSession();
    const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'Daten fehlen.');
    const parts:Uint8Array[]=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1_000_000){await reader.cancel();throw new HttpError(413,'Cache zu groß.');}parts.push(value);}
    let data;try{data=JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw new HttpError(400,'Ungültiges JSON.');}
    const threads=data?.threads;
    if(!Array.isArray(threads)||threads.length>500||!threads.every(t=>t&&typeof t.id==='string'&&typeof t.lastDate==='string'&&typeof t.subject==='string'&&typeof t.snippet==='string'&&typeof t.isUnread==='boolean'&&typeof t.isStarred==='boolean'&&typeof t.isImportant==='boolean'&&Array.isArray(t.labels)&&t.labels.every((l:unknown)=>typeof l==='string')&&Array.isArray(t.messages)&&t.messages.length>0&&t.messages.every((m:Record<string,unknown>)=>m&&['id','threadId','date','sender','senderName','senderEmail','subject','snippet'].every(k=>typeof m[k]==='string')&&Array.isArray(m.labelIds)&&Array.isArray(m.toRecipients))))throw new HttpError(400,'Ungültige Maildaten.');
    await writeMemberMail(CACHE_DIR,user.id,threads);
    return json({ok:true,cached:threads.length,userScoped:true});
  }catch(e){return failure(e);}
}
