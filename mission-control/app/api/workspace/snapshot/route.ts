import {failure,HttpError,json,sameOrigin} from "@/lib/auth/http";
import {voiceSession} from "@/lib/voice/server";
import {snapshotOf,MAX_SNAPSHOT_BYTES} from "@/lib/workspace/snapshot";
export const dynamic="force-dynamic";
export async function GET(){
  try {const {sb,user,canSave}=await voiceSession();const {data,error}=await sb.from("guiding_workspace_snapshots").select("revision,payload,updated_at").eq("user_id",user.id).maybeSingle();if(error)throw error;return json({userId:user.id,canSave,snapshot:data});}
  catch(e){return failure(e);}
}
export async function PUT(req:Request){
  try {
    sameOrigin(req);const {sb,user}=await voiceSession(true);
    if(Number(req.headers.get("content-length"))>MAX_SNAPSHOT_BYTES+1000)throw new HttpError(413,"Die Sicherung ist zu groß.");
    // Bound streamed bodies too; do not trust Content-Length.
    const reader=req.body?.getReader();if(!reader)throw new HttpError(400,"Sicherung fehlt.");let size=0;const parts:Uint8Array[]=[];
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_SNAPSHOT_BYTES+1000){await reader.cancel();throw new HttpError(413,"Die Sicherung ist zu groß.");}parts.push(value);}
    let body;try{body=JSON.parse(Buffer.concat(parts).toString("utf8"));}catch{throw new HttpError(400,"Ungültige Sicherung.");}
    if(body.userId!==user.id)throw new HttpError(409,"Das Konto hat gewechselt. Bitte erneut prüfen.");
    if(!Number.isSafeInteger(body.revision)||body.revision<0)throw new HttpError(400,"Ungültige Version.");
    let payload;try{payload=snapshotOf(body.payload);}catch(e){throw new HttpError(400,e instanceof Error?e.message:"Ungültige Sicherung.");}
    const row={user_id:user.id,revision:body.revision+1,payload,updated_at:new Date().toISOString()};
    const result=body.revision===0 ? await sb.from("guiding_workspace_snapshots").insert(row).select("revision,updated_at").single() : await sb.from("guiding_workspace_snapshots").update(row).eq("user_id",user.id).eq("revision",body.revision).select("revision,updated_at").maybeSingle();
    if(result.error?.code==="23505"||!result.error&&!result.data)throw new HttpError(409,"Auf dem Server liegt ein neuerer Stand. Lade ihn zuerst, bevor du etwas ersetzt.");
    if(result.error)throw result.error;
    return json({userId:user.id,...result.data});
  }catch(e){return failure(e);}
}
