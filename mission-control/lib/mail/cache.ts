import {readFile,writeFile,mkdir,rename,unlink} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";
export interface GmailMessage {
  id: string;
  threadId: string;
  date: string;
  sender: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  toRecipients: string[];
  labelIds: string[];
  body?: string;
}

export interface GmailThread {
  id: string;
  messages: GmailMessage[];
  lastDate: string;
  subject: string;
  snippet: string;
  isUnread: boolean;
  isStarred: boolean;
  isImportant: boolean;
  labels: string[];
}


function fileFor(root:string,userId:string){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))throw Error("Invalid account identifier");return path.join(root,"mail-users",userId+".json");}
export async function readMemberMail(root:string,userId:string):Promise<GmailThread[]|null>{
  const file=fileFor(root,userId);
  try{const data=JSON.parse(await readFile(file,"utf8"));if(!Array.isArray(data))throw Error("Invalid mail cache");return data;}
  catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return null;throw e;}
}
export async function writeMemberMail(root:string,userId:string,threads:GmailThread[]){
  const file=fileFor(root,userId),temporary=file+"."+randomUUID()+".tmp";await mkdir(path.dirname(file),{recursive:true,mode:0o700});
  try{await writeFile(temporary,JSON.stringify(threads),{encoding:"utf8",mode:0o600});await rename(temporary,file);}finally{await unlink(temporary).catch(()=>{});}
}
