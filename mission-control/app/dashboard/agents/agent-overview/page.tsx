'use client';
import {
  useState, useRef, useCallback, useEffect, useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { useAgentStore, withSelfContext } from '@/lib/store';
import { SelfContextToggle } from '@/components/shared/SelfContextToggle';
import { AiCompanyBuilder } from '@/components/agents/AiCompanyBuilder';
import { cn, AGENT_COLORS, STATUS_COLORS } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import {
  Send, Mic, MicOff, X, Loader2, ChevronRight,
  Paintbrush, Layers, Link2, Plus, Check, Trash2,
  Play, Pause, FileText, Volume2, Film, Image as ImageIcon,
  MessageSquare, GitBranch, ChevronDown, ChevronLeft,
  Zap, Workflow,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
interface FileAttachment { id:string; name:string; mime:string; dataUrl:string; size:number; }
interface ChatMessage { id:string; role:'user'|'agent'; text:string; timestamp:string; attachments?:FileAttachment[]; }
interface WFCard { id:string; agentId:string; x:number; y:number; }
interface WFConnection { id:string; fromCardId:string; toCardId:string; label:string; color:string; }
interface WFGroup { id:string; name:string; instruction:string; color:string; cardIds:string[]; }
interface SavedWorkflow { id:string; name:string; cards:WFCard[]; connections:WFConnection[]; groups:WFGroup[]; active:boolean; }
interface WorkflowStepResponse { cardId:string; agentId:string; agentName:string; agentIcon:string; input:string; output:string; done:boolean; }

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const CONN_COLORS  = ['#11CAA0','#f59e0b','#ef4444','#3b82f6','#a78bfa','#ec4899','#f97316','#06b6d4','#84cc16','#e2e8f0'];
const GROUP_COLORS = ['#11CAA0','#f59e0b','#ef4444','#3b82f6','#a78bfa','#ec4899','#f97316','#e2c97e'];
const LS_KEY  = 'trinity-agent-workflows-v1';
const CARD_W  = 172;
const CARD_H  = 96;

// Design tokens
const MINT   = '#11CAA0';
const BDR    = 'rgba(255,255,255,0.07)';     // internal card borders
const SEP    = 'rgba(15,50,120,0.6)';         // column separator lines
const BG1    = 'rgba(8,13,22,0.98)';          // darkest panel bg
const BG2    = 'rgba(11,16,26,0.96)';         // slightly lighter
const BG3    = 'rgba(14,20,32,0.94)';         // canvas bg

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function genId(p='id'){return `${p}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;}
function formatBytes(n:number){if(n<1024)return`${n}B`;if(n<1048576)return`${(n/1024).toFixed(0)}KB`;return`${(n/1048576).toFixed(1)}MB`;}
function ts(){return new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});}

function topoSort(cards:WFCard[],conns:WFConnection[]):string[]{
  const inDeg:Record<string,number>={},adj:Record<string,string[]>={};
  cards.forEach(c=>{inDeg[c.id]=0;adj[c.id]=[];});
  conns.forEach(conn=>{adj[conn.fromCardId]?.push(conn.toCardId);inDeg[conn.toCardId]=(inDeg[conn.toCardId]??0)+1;});
  const q=cards.filter(c=>(inDeg[c.id]??0)===0).map(c=>c.id),r:string[]=[];
  while(q.length){const id=q.shift()!;r.push(id);adj[id]?.forEach(nx=>{if(--inDeg[nx]===0)q.push(nx);});}
  return r;
}

function edgePt(rect:{cx:number;cy:number;w:number;h:number},tx:number,ty:number){
  const dx=tx-rect.cx,dy=ty-rect.cy;
  if(!dx&&!dy)return{x:rect.cx,y:rect.cy};
  const t=Math.min(Math.abs(rect.w/2/dx)||Infinity,Math.abs(rect.h/2/dy)||Infinity);
  return{x:rect.cx+t*dx,y:rect.cy+t*dy};
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE THUMB
// ═══════════════════════════════════════════════════════════════════════════════
function FilThumb({att,onRemove}:{att:FileAttachment;onRemove:()=>void}){
  const isImg=att.mime.startsWith('image/'),isVid=att.mime.startsWith('video/'),isAud=att.mime.startsWith('audio/');
  return(
    <div className="relative group shrink-0">
      {isImg
        // eslint-disable-next-line @next/next/no-img-element
        ?<img src={att.dataUrl} alt={att.name} className="w-16 h-16 rounded-xl object-cover" style={{border:`1px solid ${BDR}`}}/>
        :<div className={cn('w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1.5',
            isVid?'bg-violet-900/20':isAud?'bg-amber-900/20':'bg-white/5')} style={{border:`1px solid ${BDR}`}}>
            {isVid?<Film size={18} className="text-violet-400"/>:isAud?<Volume2 size={18} className="text-amber-400"/>:<FileText size={18} className="text-slate-400"/>}
            <span className="text-[8px] text-slate-500 truncate max-w-[56px] px-1 text-center">{att.name}</span>
          </div>}
      <button onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        <X size={9}/>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL SEPARATOR — visible 3-D column divider
// ═══════════════════════════════════════════════════════════════════════════════
function PanelSep(){
  return(
    <div className="shrink-0 w-[1px] self-stretch" style={{
      background:`linear-gradient(to bottom,transparent 0%,${SEP} 15%,rgba(20,70,180,0.75) 50%,${SEP} 85%,transparent 100%)`,
      boxShadow:`-1px 0 12px rgba(0,0,0,0.5),1px 0 6px rgba(15,60,160,0.12)`,
    }}/>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AgentOverviewPage(){
  const t = useT();
  const{agents}=useAgentStore();

  // Chat
  const[chatTab,         setChatTab]        =useState<'single'|'workflow'>('single');
  const[selectedAgentId, setSelectedAgentId]=useState(agents[0]?.id??'');
  const[workflowContext, setWorkflowContext]=useState<{wfName:string;agentId:string}|null>(null);
  const[messages,        setMessages]       =useState<ChatMessage[]>([]);
  const[chatInput,       setChatInput]      =useState('');
  const[isStreaming,     setIsStreaming]    =useState(false);
  const[pendingFiles,    setPendingFiles]   =useState<FileAttachment[]>([]);
  const[isRecording,     setIsRecording]   =useState(false);
  const[wfResponses,     setWfResponses]   =useState<WorkflowStepResponse[]>([]);
  const[wfViewIdx,       setWfViewIdx]     =useState(0);
  const[wfRunning,       setWfRunning]     =useState(false);

  // Canvas
  const[wfCards,         setWfCards]       =useState<WFCard[]>([]);
  const[wfConns,         setWfConns]       =useState<WFConnection[]>([]);
  const[wfGroups,        setWfGroups]      =useState<WFGroup[]>([]);
  const[connectMode,     setConnectMode]   =useState(false);
  const[connectColor,    setConnectColor]  =useState(MINT);
  const[pendingFromId,   setPendingFromId] =useState<string|null>(null);
  const[selectedConnId,  setSelectedConnId]=useState<string|null>(null);
  const[editConnLabel,   setEditConnLabel] =useState('');
  const[groupMode,       setGroupMode]     =useState(false);
  const[groupColor,      setGroupColor]    =useState(MINT);
  const[pendingGrpCards, setPendingGrpCards]=useState<Set<string>>(new Set());
  const[newGrpName,      setNewGrpName]   =useState('');
  const[newGrpInstr,     setNewGrpInstr]  =useState('');
  const[dragCardId,      setDragCardId]   =useState<string|null>(null);
  const[dragOffset,      setDragOffset]   =useState({x:0,y:0});
  const[agentDropdown,   setAgentDropdown]=useState(false);
  const agentDropBtnRef = useRef<HTMLButtonElement>(null);
  const[agentDropPos,   setAgentDropPos]  =useState({top:0,left:0});

  // Workflows panel
  const[workflows,  setWorkflows] =useState<SavedWorkflow[]>([]);
  const[activeWfId, setActiveWfId]=useState<string|null>(null);
  const[newWfName,  setNewWfName] =useState('');
  const[showNewWf,  setShowNewWf] =useState(false);

  // Responsive: auf breiten Screens alles nebeneinander & fixiert, auf schmalen
  // (2K & darunter) den 4-Spalten-Workspace auf lesbaren Mindestbreiten halten
  // und den Bereich scrollbar machen, statt alles zusammenzuquetschen.
  const[wide,       setWide]      =useState(true);
  useEffect(()=>{
    const calc=()=>setWide(window.innerWidth>=1800);
    calc();
    window.addEventListener('resize',calc);
    return()=>window.removeEventListener('resize',calc);
  },[]);

  // Refs
  const canvasRef =useRef<HTMLDivElement>(null);
  const chatEndRef=useRef<HTMLDivElement>(null);
  const abortRef  =useRef<AbortController|null>(null);
  const mediaRef  =useRef<MediaRecorder|null>(null);
  const fileRef   =useRef<HTMLInputElement>(null);

  // Derived
  const selectedAgent=agents.find(a=>a.id===selectedAgentId)??agents[0];
  const chatAgent=workflowContext?agents.find(a=>a.id===workflowContext.agentId)??selectedAgent:selectedAgent;
  const activeWf=workflows.find(w=>w.id===activeWfId)??null;

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);

  // Persistence
  useEffect(()=>{
    try{const raw=localStorage.getItem(LS_KEY);if(raw){const d=JSON.parse(raw);setWorkflows(d.workflows??[]);}}catch{}
  },[]);
  useEffect(()=>{
    try{localStorage.setItem(LS_KEY,JSON.stringify({workflows}));}catch{}
  },[workflows]);

  // Auto-save canvas → active workflow
  useEffect(()=>{
    if(!activeWfId)return;
    setWorkflows(prev=>prev.map(w=>w.id===activeWfId?{...w,cards:[...wfCards],connections:[...wfConns],groups:[...wfGroups]}:w));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[wfCards,wfConns,wfGroups,activeWfId]);

  // Card rects — always in sync with state
  const cardRects=useMemo(()=>{
    const r:Record<string,{cx:number;cy:number;w:number;h:number}>={};
    wfCards.forEach(c=>{r[c.id]={cx:c.x+CARD_W/2,cy:c.y+CARD_H/2,w:CARD_W,h:CARD_H};});
    return r;
  },[wfCards]);

  // Files
  const handleFiles=(files:FileList|null)=>{
    if(!files)return;
    Array.from(files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=e=>setPendingFiles(prev=>[...prev,{id:genId('f'),name:file.name,mime:file.type||'application/octet-stream',dataUrl:e.target?.result as string,size:file.size}]);
      reader.readAsDataURL(file);
    });
  };

  // Voice
  const toggleRec=useCallback(async()=>{
    if(isRecording){mediaRef.current?.stop();setIsRecording(false);return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const rec=new MediaRecorder(stream);const chunks:BlobPart[]=[];
      rec.ondataavailable=e=>chunks.push(e.data);
      rec.onstop=()=>{
        const blob=new Blob(chunks,{type:'audio/webm'});
        const r=new FileReader();
        r.onload=ev=>setPendingFiles(prev=>[...prev,{id:genId('voice'),name:`Sprachaufnahme-${ts()}.webm`,mime:'audio/webm',dataUrl:ev.target?.result as string,size:blob.size}]);
        r.readAsDataURL(blob);stream.getTracks().forEach(t=>t.stop());
      };
      rec.start();mediaRef.current=rec;setIsRecording(true);
    }catch{alert('Mikrofon-Zugriff verweigert.');}
  },[isRecording]);

  // Single chat
  const sendSingle=useCallback(async()=>{
    const text=chatInput.trim();if(!text&&!pendingFiles.length)return;
    const agent=chatAgent;if(!agent)return;
    const tstamp=ts();
    const userMsg:ChatMessage={id:genId('msg'),role:'user',text,timestamp:tstamp,attachments:pendingFiles.length?[...pendingFiles]:undefined};
    setMessages(prev=>[...prev,userMsg]);setChatInput('');setPendingFiles([]);setIsStreaming(true);
    const history=[...messages,userMsg].map(m=>({role:m.role==='user'?'user':'assistant' as 'user'|'assistant',content:m.text+(m.attachments?.length?`\n[${m.attachments.map(a=>a.name).join(', ')}]`:'')}));
    const agentMsg:ChatMessage={id:genId('msg-a'),role:'agent',text:'',timestamp:tstamp};
    setMessages(prev=>[...prev,agentMsg]);
    try{
      abortRef.current?.abort();abortRef.current=new AbortController();
      const res=await fetch(`/api/agents/${agent.id}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:withSelfContext(history)}),signal:abortRef.current.signal});
      if(!res.ok||!res.body)throw new Error(`HTTP ${res.status}`);
      const reader=res.body.getReader();const dec=new TextDecoder();let buf='';
      while(true){
        const{done,value}=await reader.read();if(done)break;
        buf+=dec.decode(value,{stream:true});
        const lines=buf.split('\n');buf=lines.pop()??'';
        for(const line of lines){if(!line.startsWith('data: '))continue;const p=line.slice(6).trim();if(p==='[DONE]')break;try{const{text:c}=JSON.parse(p);if(c)setMessages(prev=>prev.map(m=>m.id===agentMsg.id?{...m,text:m.text+c}:m));}catch{}}
      }
    }catch(err:unknown){if((err as Error)?.name!=='AbortError')setMessages(prev=>prev.map(m=>m.id===agentMsg.id?{...m,text:t('⚠ Verbindungsfehler.')}:m));}
    finally{setIsStreaming(false);}
  },[chatInput,pendingFiles,messages,chatAgent]);

  // Workflow execution
  const runWorkflow=useCallback(async(userInput:string,wf:SavedWorkflow)=>{
    if(!wf.cards.length)return;
    setWfRunning(true);setWfResponses([]);setWfViewIdx(0);
    const order=topoSort(wf.cards,wf.connections);let prevOutput=userInput;
    for(const cardId of order){
      const card=wf.cards.find(c=>c.id===cardId);if(!card)continue;
      const agent=agents.find(a=>a.id===card.agentId);if(!agent)continue;
      const incoming=wf.connections.find(c=>c.toCardId===cardId);
      const connLabel=incoming?.label??'';
      const group=wf.groups.find(g=>g.cardIds.includes(cardId));
      const groupInstr=group?`\n\n[Gruppe "${group.name}"]: ${group.instruction}`:'';
      const prompt=connLabel?`${connLabel}:\n\n${prevOutput}${groupInstr}`:`${prevOutput}${groupInstr}`;
      const step:WorkflowStepResponse={cardId,agentId:agent.id,agentName:agent.displayName,agentIcon:agent.icon,input:prompt,output:'',done:false};
      setWfResponses(prev=>[...prev,step]);setWfViewIdx(prev=>Math.max(prev,0));
      try{
        const res=await fetch(`/api/agents/${agent.id}/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:prompt}]})});
        if(!res.ok||!res.body)throw new Error();
        const reader=res.body.getReader();const dec=new TextDecoder();let buf='';let out='';
        while(true){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});const lines=buf.split('\n');buf=lines.pop()??'';for(const line of lines){if(!line.startsWith('data: '))continue;const p=line.slice(6).trim();if(p==='[DONE]')break;try{const{text:c}=JSON.parse(p);if(c){out+=c;setWfResponses(prev=>prev.map(s=>s.cardId===cardId?{...s,output:out}:s));}}catch{}}}
        prevOutput=out;setWfResponses(prev=>prev.map(s=>s.cardId===cardId?{...s,done:true}:s));
      }catch{setWfResponses(prev=>prev.map(s=>s.cardId===cardId?{...s,output:'⚠ Fehler',done:true}:s));prevOutput='⚠ Fehler';}
    }
    setWfRunning(false);
    setMessages(prev=>[...prev,{id:genId('wf-out'),role:'agent',text:prevOutput,timestamp:ts()}]);
  },[agents]);

  const sendWorkflow=useCallback(async()=>{
    const text=chatInput.trim();if(!text)return;
    const wf=workflows.find(w=>w.id===activeWfId);if(!wf)return;
    setMessages(prev=>[...prev,{id:genId('msg'),role:'user',text,timestamp:ts()}]);setChatInput('');
    await runWorkflow(text,wf);
  },[chatInput,workflows,activeWfId,runWorkflow]);

  const onSend=()=>{chatTab==='workflow'&&activeWfId?sendWorkflow():sendSingle();};

  // Canvas drag
  const onCardMouseDown=useCallback((e:React.MouseEvent,cardId:string)=>{
    if((e.target as HTMLElement).closest('button'))return;
    if(connectMode){
      if(!pendingFromId){setPendingFromId(cardId);return;}
      if(pendingFromId===cardId){setPendingFromId(null);return;}
      const exists=wfConns.some(c=>(c.fromCardId===pendingFromId&&c.toCardId===cardId)||(c.fromCardId===cardId&&c.toCardId===pendingFromId));
      if(!exists)setWfConns(prev=>[...prev,{id:genId('conn'),fromCardId:pendingFromId,toCardId:cardId,label:'',color:connectColor}]);
      setPendingFromId(null);return;
    }
    if(groupMode){setPendingGrpCards(prev=>{const n=new Set(prev);n.has(cardId)?n.delete(cardId):n.add(cardId);return n;});return;}
    e.preventDefault();
    const card=wfCards.find(c=>c.id===cardId);if(!card||!canvasRef.current)return;
    const rect=canvasRef.current.getBoundingClientRect();
    setDragCardId(cardId);setDragOffset({x:e.clientX-rect.left-card.x,y:e.clientY-rect.top-card.y});
  },[connectMode,groupMode,pendingFromId,wfConns,connectColor,wfCards]);

  const onCanvasMouseMove=useCallback((e:React.MouseEvent)=>{
    if(!dragCardId||!canvasRef.current)return;
    const r=canvasRef.current.getBoundingClientRect();
    setWfCards(cs=>cs.map(c=>c.id===dragCardId?{...c,x:Math.max(0,e.clientX-r.left-dragOffset.x),y:Math.max(0,e.clientY-r.top-dragOffset.y)}:c));
  },[dragCardId,dragOffset]);

  const onCanvasMouseUp=useCallback(()=>setDragCardId(null),[]);

  const addAgentCard=(agentId:string)=>{
    setWfCards(prev=>[...prev,{id:genId('wc'),agentId,x:40+Math.random()*220,y:40+Math.random()*160}]);
    setAgentDropdown(false);
  };

  const createGroup=()=>{
    if(!newGrpName.trim()||!pendingGrpCards.size)return;
    setWfGroups(prev=>[...prev,{id:genId('grp'),name:newGrpName.trim(),instruction:newGrpInstr.trim(),color:groupColor,cardIds:Array.from(pendingGrpCards)}]);
    setPendingGrpCards(new Set());setNewGrpName('');setNewGrpInstr('');setGroupMode(false);
  };

  const saveWorkflow=()=>{
    if(!newWfName.trim())return;
    const wf:SavedWorkflow={id:genId('wf'),name:newWfName.trim(),cards:[...wfCards],connections:[...wfConns],groups:[...wfGroups],active:true};
    setWorkflows(prev=>[...prev,wf]);setActiveWfId(wf.id);setNewWfName('');setShowNewWf(false);
  };

  const loadWorkflow=(wf:SavedWorkflow)=>{setWfCards(wf.cards);setWfConns(wf.connections);setWfGroups(wf.groups);setActiveWfId(wf.id);};
  const deleteWorkflow=(id:string)=>{setWorkflows(prev=>prev.filter(w=>w.id!==id));if(activeWfId===id)setActiveWfId(null);};
  const toggleWorkflowActive=(id:string)=>setWorkflows(prev=>prev.map(w=>w.id===id?{...w,active:!w.active}:w));

  const selConn=wfConns.find(c=>c.id===selectedConnId)??null;
  useEffect(()=>{if(selConn)setEditConnLabel(selConn.label);},[selectedConnId]);// eslint-disable-line

  // ─────────────────────────────────────────────────────────────────────────────
  // TOOLBAR BUTTON helper
  // ─────────────────────────────────────────────────────────────────────────────
  const TB=({active,color,onClick,icon,label}:{active?:boolean;color?:string;onClick:()=>void;icon:React.ReactNode;label:string})=>(
    <button onClick={onClick}
      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
        active?'shadow-[0_0_14px_rgba(0,0,0,0.4)]':'hover:bg-white/8')}
      style={active?{background:`${color||MINT}22`,border:`1px solid ${color||MINT}55`,color:color||MINT}:{border:`1px solid ${BDR}`,color:'#94a3b8'}}>
      {icon} {label}
    </button>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return(
    <div className={cn('h-full flex flex-col',wide?'overflow-hidden':'overflow-auto scrollbar-thin')} style={{fontFamily:"'Inter',system-ui,sans-serif"}}>

      {/* AI-Firma-Builder — großer Bereich oben */}
      <AiCompanyBuilder/>

      {/* ════════════════════════════════════════════════════════
          UNIFIED HEADER — one continuous horizontal line
      ════════════════════════════════════════════════════════ */}
      <div className={cn('shrink-0 flex',!wide&&'min-w-[1280px]')} style={{borderBottom:`1px solid ${SEP}`,background:'rgba(7,11,19,0.99)',backdropFilter:'blur(12px)'}}>

        {/* Col 1 header */}
        <div className="w-44 shrink-0 flex items-center px-4 py-3">
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{color:MINT}}>{t('Agenten')}</span>
        </div>
        <PanelSep/>

        {/* Col 2 header: tabs + agent info */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Tab bar */}
          <div className="flex" style={{borderBottom:`1px solid rgba(15,50,120,0.4)`}}>
            {([['single','Einzel Chat'],['workflow','Workflow Chat']] as const).map(([tab,label])=>(
              <button key={tab} onClick={()=>setChatTab(tab)}
                className="flex-1 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150"
                style={chatTab===tab
                  ?{color:MINT,borderBottom:`2px solid ${MINT}`,background:'rgba(17,202,160,0.06)'}
                  :{color:'#4b6080',borderBottom:'2px solid transparent',background:'transparent'}}>
                {(tab==='single'?'💬  ':'🔀  ')+t(label)}
              </button>
            ))}
          </div>
          {/* Agent info */}
          <div className="flex items-center gap-3 px-4 py-2.5" style={{background:'rgba(10,15,24,0.9)'}}>
            <span className="text-2xl leading-none">{chatAgent?.icon??'🤖'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{color:'#e2e8f0'}}>
                {workflowContext?`⚡ Workflow — ${workflowContext.wfName}`:(chatAgent?.displayName??'Agent')}
              </p>
              <p className="text-[10px] mt-0.5 truncate" style={{color:'#4b6080'}}>
                {chatTab==='workflow'?(activeWf?`Workflow: ${activeWf.name}`:'Kein Workflow aktiv'):(chatAgent?.model??'—')}
              </p>
            </div>
            {chatAgent&&<div className={cn('w-2.5 h-2.5 rounded-full ring-2 ring-black shrink-0',STATUS_COLORS[chatAgent.status])}/>}
          </div>
        </div>

        {/* Col 3 header: canvas toolbar */}
        <div className="flex-1 min-w-0 flex flex-col" style={{zIndex:10,position:'relative'}}>
          <div className="flex items-center gap-2 px-4 py-3 flex-wrap" style={{background:'rgba(8,12,20,0.98)'}}>
            {/* Label */}
            <div className="flex items-center gap-2 mr-1">
              <Workflow size={13} style={{color:MINT}}/>
              <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{color:'#4b6080'}}>{t('Digital Workflow')}</span>
            </div>

            <div className="w-px h-4 mx-1 shrink-0" style={{background:BDR}}/>

            {/* Agent add — Portal-Dropdown */}
            <div className="relative">
              <button
                ref={agentDropBtnRef}
                onClick={()=>{
                  if(!agentDropdown && agentDropBtnRef.current){
                    const r=agentDropBtnRef.current.getBoundingClientRect();
                    setAgentDropPos({top:r.bottom+6, left:r.left});
                  }
                  setAgentDropdown(v=>!v);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
                style={{background:`${MINT}18`,border:`1px solid ${MINT}40`,color:MINT}}>
                <Plus size={12}/> {t('Agent hinzufügen')} <ChevronDown size={10}/>
              </button>
            </div>
            {agentDropdown && typeof window!=='undefined' && createPortal(
              <>
                {/* Backdrop zum Schließen */}
                <div className="fixed inset-0" style={{zIndex:99998}} onClick={()=>setAgentDropdown(false)}/>
                <div
                  className="fixed rounded-xl shadow-2xl py-2 w-52"
                  style={{
                    top:agentDropPos.top, left:agentDropPos.left,
                    zIndex:99999, overflow:'hidden',
                    background:'rgba(9,13,22,0.99)',
                    border:`1px solid rgba(255,255,255,0.1)`,
                    backdropFilter:'blur(16px)',
                  }}>
                  <p className="px-3 pb-1.5 text-[9px] uppercase tracking-widest" style={{color:'#2a4060'}}>{t('Wähle Agenten')}</p>
                  {agents.map(a=>{
                    const ac=AGENT_COLORS[a.id]??AGENT_COLORS.system;
                    return(
                      <button key={a.id} onClick={()=>{ addAgentCard(a.id); setAgentDropdown(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all hover:bg-white/8"
                        style={{color:'#94a3b8'}}>
                        <span className="text-base">{a.icon}</span>
                        <span className={cn('truncate',ac.text)}>{a.displayName}</span>
                      </button>
                    );
                  })}
                </div>
              </>,
              document.body
            )}

            <div className="w-px h-4 mx-0.5 shrink-0" style={{background:BDR}}/>

            <TB active={connectMode} color={MINT} onClick={()=>{setConnectMode(v=>!v);setPendingFromId(null);setSelectedConnId(null);if(groupMode){setGroupMode(false);setPendingGrpCards(new Set());}}}
              icon={<Paintbrush size={12}/>} label={connectMode?t('Verbinden ✓'):t('Verbinden')}/>

            {connectMode&&(
              <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg" style={{border:`1px solid ${BDR}`}}>
                {CONN_COLORS.map(c=>(
                  <button key={c} onClick={()=>setConnectColor(c)}
                    className={cn('w-4 h-4 rounded-full transition-all hover:scale-125',connectColor===c?'ring-2 ring-white ring-offset-1 ring-offset-black scale-125':'')}
                    style={{backgroundColor:c}}/>
                ))}
              </div>
            )}

            <div className="w-px h-4 mx-0.5 shrink-0" style={{background:BDR}}/>

            <TB active={groupMode} color="#e2c97e" onClick={()=>{setGroupMode(v=>!v);if(connectMode){setConnectMode(false);setPendingFromId(null);}if(groupMode){setPendingGrpCards(new Set());setNewGrpName('');setNewGrpInstr('');}}}
              icon={<Layers size={12}/>} label={groupMode?t('Gruppe ✓'):t('Gruppieren')}/>

            {connectMode&&pendingFromId&&(
              <span className="text-[11px] font-medium animate-pulse ml-2" style={{color:MINT}}>✦ Zweite Karte wählen</span>
            )}
            {wfConns.length>0&&!groupMode&&!connectMode&&(
              <span className="text-[11px] ml-auto flex items-center gap-1.5" style={{color:'#2a4060'}}>
                <Link2 size={10}/>{wfConns.length} {t(wfConns.length!==1?'Verbindungen':'Verbindung')}
              </span>
            )}
          </div>

          {/* Group confirmation bar */}
          {groupMode&&pendingGrpCards.size>=1&&(
            <div className="flex items-center gap-2 px-4 py-2.5" style={{background:'rgba(226,201,126,0.06)',borderTop:`1px solid rgba(226,201,126,0.25)`}}>
              <div className="flex gap-1 shrink-0">
                {GROUP_COLORS.map(c=><button key={c} onClick={()=>setGroupColor(c)}
                  className={cn('w-4 h-4 rounded-full transition-all hover:scale-110',groupColor===c?'ring-2 ring-white ring-offset-1 ring-offset-black scale-110':'')}
                  style={{backgroundColor:c}}/>)}
              </div>
              <input value={newGrpName} onChange={e=>setNewGrpName(e.target.value)} placeholder={t("Gruppenname…")}
                className="w-32 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none"
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(226,201,126,0.3)',color:'#e2e8f0'}}/>
              <input value={newGrpInstr} onChange={e=>setNewGrpInstr(e.target.value)} placeholder="Gruppenauftrag…"
                className="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none"
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(226,201,126,0.3)',color:'#e2e8f0'}}/>
              <button onClick={createGroup} disabled={!newGrpName.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:brightness-110 disabled:opacity-40 shrink-0"
                style={{background:'rgba(226,201,126,0.2)',border:'1px solid rgba(226,201,126,0.5)',color:'#e2c97e'}}>
                <Check size={11}/> Bestätigen ({pendingGrpCards.size})
              </button>
              <button onClick={()=>{setPendingGrpCards(new Set());setNewGrpName('');setNewGrpInstr('');setGroupMode(false);}}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{color:'#4b6080'}}><X size={13}/></button>
            </div>
          )}
        </div>
        <PanelSep/>

        {/* Col 4 header */}
        <div className="w-52 shrink-0 flex items-center px-4 py-3">
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{color:MINT}}>{t('Workflows')}</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          CONTENT ROW
      ════════════════════════════════════════════════════════ */}
      <div className={cn('flex flex-1 min-h-0',wide?'overflow-hidden':'min-w-[1280px] min-h-[600px] shrink-0')}>

        {/* ── Col 1: Agent list ───────────────────────────────── */}
        <div className="w-44 shrink-0 flex flex-col overflow-hidden" style={{background:BG1}}>
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2 scrollbar-thin">
            {agents.map(agent=>{
              const ac=AGENT_COLORS[agent.id]??AGENT_COLORS.system;
              const isSel=agent.id===selectedAgentId;
              return(
                <button key={agent.id}
                  onClick={()=>{setSelectedAgentId(agent.id);setWorkflowContext(null);setChatTab('single');setMessages([]);}}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all duration-150 relative"
                  style={isSel
                    ?{background:'rgba(17,202,160,0.10)',border:`1px solid rgba(17,202,160,0.28)`,boxShadow:`0 0 14px rgba(17,202,160,0.08) inset`}
                    :{background:'transparent',border:'1px solid transparent'}}>
                  {isSel&&<div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full" style={{background:MINT}}/>}
                  <div className="relative shrink-0">
                    <span className="text-xl leading-none">{agent.icon}</span>
                    <span className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#080d14]',STATUS_COLORS[agent.status])}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-semibold truncate leading-tight',isSel?ac.text:'text-slate-300')}>{agent.displayName}</p>
                    <p className="text-[10px] mt-0.5 capitalize" style={{color:'#3d5a80'}}>{agent.status}</p>
                  </div>
                  {isSel&&<ChevronRight size={11} style={{color:MINT}} className="shrink-0"/>}
                </button>
              );
            })}
          </div>
        </div>
        <PanelSep/>

        {/* ── Col 2: Chat ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{background:BG2}}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin min-h-0">
            {messages.length===0&&(
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pb-12">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                  style={{background:'rgba(17,202,160,0.08)',border:`1px solid rgba(17,202,160,0.18)`,boxShadow:'0 0 32px rgba(17,202,160,0.06) inset'}}>
                  {chatAgent?.icon??'🤖'}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{color:'#64748b'}}>{chatAgent?.displayName??'Agent'} {t('wartet')}</p>
                  {chatTab==='workflow'&&!activeWf&&(
                    <p className="text-xs mt-1.5" style={{color:'#2a4060'}}>{t('Wähle rechts einen Workflow oder erstelle einen neuen')}</p>
                  )}
                </div>
              </div>
            )}
            {messages.map(msg=>{
              const isUser=msg.role==='user';
              return(
                <div key={msg.id} className={cn('flex gap-2.5',isUser&&'flex-row-reverse')}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                    style={isUser
                      ?{background:'rgba(17,202,160,0.15)',border:`1px solid rgba(17,202,160,0.25)`}
                      :{background:'rgba(255,255,255,0.05)',border:`1px solid ${BDR}`}}>
                    {isUser?'👤':(chatAgent?.icon??'🤖')}
                  </div>
                  <div className={cn('flex flex-col gap-1.5 max-w-[85%]',isUser&&'items-end')}>
                    {msg.attachments?.map(att=>(
                      <div key={att.id} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs',isUser?'bg-teal-900/20':'bg-white/4')}
                        style={{border:`1px solid ${BDR}`}}>
                        <FileText size={11} style={{color:'#4b6080'}} className="shrink-0"/>
                        <span className="truncate max-w-[120px]" style={{color:'#94a3b8'}}>{att.name}</span>
                        <span style={{color:'#2a4060'}}>{formatBytes(att.size)}</span>
                      </div>
                    ))}
                    {(msg.text||msg.role==='agent')&&(
                      <div className={cn('rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
                        isUser?'rounded-tr-sm':'rounded-tl-sm')}
                        style={isUser
                          ?{background:'rgba(17,202,160,0.14)',border:`1px solid rgba(17,202,160,0.22)`,color:'#d1fae5'}
                          :{background:'rgba(255,255,255,0.05)',border:`1px solid ${BDR}`,color:'#cbd5e1'}}>
                        {msg.text||<span className="flex items-center gap-2" style={{color:'#4b6080'}}><Loader2 size={12} className="animate-spin"/>{t('Antwortet…')}</span>}
                      </div>
                    )}
                    <span className="text-[10px]" style={{color:'#1e3050'}}>{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef}/>
          </div>

          {/* Workflow chain viewer */}
          {chatTab==='workflow'&&wfResponses.length>0&&(
            <div className="shrink-0 px-4 py-3" style={{borderTop:`1px solid ${SEP}`,background:'rgba(7,11,18,0.95)'}}>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={10} style={{color:MINT}}/>
                <p className="text-[10px] uppercase tracking-widest font-semibold flex-1" style={{color:'#2a4060'}}>{t('Workflow-Verlauf')}</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={()=>setWfViewIdx(i=>Math.max(0,i-1))} disabled={wfViewIdx===0}
                    className="p-1 rounded-md transition-colors hover:bg-white/10 disabled:opacity-30" style={{color:'#4b6080'}}><ChevronLeft size={11}/></button>
                  <span className="text-[10px] font-mono" style={{color:'#4b6080'}}>{wfViewIdx+1}/{wfResponses.length}</span>
                  <button onClick={()=>setWfViewIdx(i=>Math.min(wfResponses.length-1,i+1))} disabled={wfViewIdx>=wfResponses.length-1}
                    className="p-1 rounded-md transition-colors hover:bg-white/10 disabled:opacity-30" style={{color:'#4b6080'}}><ChevronRight size={11}/></button>
                </div>
              </div>
              {wfResponses[wfViewIdx]&&(
                <div className="rounded-xl p-3" style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${BDR}`}}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{wfResponses[wfViewIdx].agentIcon}</span>
                    <p className="text-xs font-semibold" style={{color:'#94a3b8'}}>{wfResponses[wfViewIdx].agentName}</p>
                    {!wfResponses[wfViewIdx].done&&<Loader2 size={10} className="animate-spin ml-auto" style={{color:MINT}}/>}
                    {wfResponses[wfViewIdx].done&&<span className="ml-auto text-[10px] font-medium" style={{color:'#22c55e'}}>✓ fertig</span>}
                  </div>
                  <p className="text-xs line-clamp-3 leading-relaxed" style={{color:'#64748b'}}>{wfResponses[wfViewIdx].output||'…'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <PanelSep/>

        {/* ── Col 3: Canvas ───────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-hidden relative" ref={canvasRef}
          style={{
            background:`radial-gradient(ellipse at 35% 35%,rgba(17,202,160,0.05),transparent 55%),radial-gradient(ellipse at 75% 65%,rgba(59,130,246,0.04),transparent 55%),${BG3}`,
            cursor:connectMode?'crosshair':groupMode?'cell':'default',
          }}
          onMouseMove={onCanvasMouseMove} onMouseUp={onCanvasMouseUp} onMouseLeave={onCanvasMouseUp}
          onClick={()=>setSelectedConnId(null)}>

          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{backgroundImage:`radial-gradient(circle,rgba(17,202,160,0.20) 1px,transparent 1px)`,backgroundSize:'28px 28px'}}/>

          {/* Group backgrounds */}
          {wfGroups.map(grp=>{
            const cards=wfCards.filter(c=>grp.cardIds.includes(c.id));if(!cards.length)return null;
            const xs=cards.map(c=>c.x),ys=cards.map(c=>c.y);
            const minX=Math.min(...xs)-20,minY=Math.min(...ys)-40,maxX=Math.max(...xs)+CARD_W+20,maxY=Math.max(...ys)+CARD_H+20;
            return(
              <div key={grp.id} className="absolute rounded-2xl pointer-events-none"
                style={{left:minX,top:minY,width:maxX-minX,height:maxY-minY,border:`2px dashed ${grp.color}55`,backgroundColor:`${grp.color}09`}}>
                <div className="absolute top-0 left-4 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{background:`${grp.color}22`,border:`1px solid ${grp.color}66`,color:grp.color}}>
                  {grp.name}
                  {grp.instruction&&<span className="font-normal opacity-75 ml-1">· {grp.instruction}</span>}
                </div>
                <button className="absolute top-2 right-2.5 pointer-events-auto transition-colors hover:text-red-400"
                  style={{color:'#2a4060'}} onClick={()=>setWfGroups(p=>p.filter(g=>g.id!==grp.id))}><X size={11}/></button>
              </div>
            );
          })}

          {/* SVG connections */}
          <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{width:'100%',height:'100%',zIndex:10}}>
            {wfConns.map(conn=>{
              const from=cardRects[conn.fromCardId],to=cardRects[conn.toCardId];if(!from||!to)return null;
              const fp=edgePt(from,to.cx,to.cy),tp=edgePt(to,from.cx,from.cy);
              const mx=(fp.x+tp.x)/2,my=(fp.y+tp.y)/2;
              const pathD=`M ${fp.x} ${fp.y} C ${mx} ${fp.y}, ${mx} ${tp.y}, ${tp.x} ${tp.y}`;
              const isSel=selectedConnId===conn.id;
              return(
                <g key={conn.id}>
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth={20} style={{pointerEvents:'stroke',cursor:'pointer'}}
                    onClick={e=>{e.stopPropagation();setSelectedConnId(isSel?null:conn.id);}}/>
                  {isSel&&<path d={pathD} fill="none" stroke={conn.color} strokeWidth={6} opacity={0.15} style={{pointerEvents:'none'}}/>}
                  <path d={pathD} fill="none" stroke={conn.color} strokeWidth={isSel?2.5:1.5}
                    strokeDasharray={isSel?'8,4':undefined} opacity={isSel?1:0.7} style={{pointerEvents:'none'}}/>
                  <circle cx={tp.x} cy={tp.y} r={5} fill={conn.color} opacity={0.9} style={{pointerEvents:'none'}}/>
                  <circle cx={fp.x} cy={fp.y} r={3.5} fill={conn.color} opacity={0.55} style={{pointerEvents:'none'}}/>
                  {conn.label&&(
                    <g style={{pointerEvents:'none'}}>
                      <rect x={mx-conn.label.length*3.5-6} y={my-16} width={conn.label.length*7+12} height={16} rx={5} fill="rgba(7,11,19,0.85)"/>
                      <text x={mx} y={my-5} textAnchor="middle" fill={conn.color} fontSize={10} fontWeight={700} opacity={0.95}>{conn.label}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Connection popover */}
          {selConn&&cardRects[selConn.fromCardId]&&cardRects[selConn.toCardId]&&(()=>{
            const from=cardRects[selConn.fromCardId],to=cardRects[selConn.toCardId];
            const px=(from.cx+to.cx)/2,py=(from.cy+to.cy)/2;
            return(
              <div className="absolute z-40 p-4 rounded-2xl shadow-2xl"
                style={{left:Math.max(8,px-110),top:Math.max(8,py-130),width:220,background:'rgba(8,12,21,0.98)',border:`1px solid rgba(255,255,255,0.12)`,backdropFilter:'blur(16px)'}}
                onClick={e=>e.stopPropagation()}>
                <p className="text-[10px] uppercase tracking-widest mb-2.5 font-semibold" style={{color:'#2a4060'}}>{t('Verbindungs-Label')}</p>
                <input value={editConnLabel} onChange={e=>setEditConnLabel(e.target.value)} placeholder={t("z.B. zusammenfassen")} autoFocus
                  className="w-full rounded-xl px-3 py-2 text-xs font-medium outline-none mb-3"
                  style={{background:'rgba(255,255,255,0.06)',border:`1px solid rgba(255,255,255,0.12)`,color:'#e2e8f0'}}/>
                <div className="flex flex-wrap gap-1 mb-3">
                  {CONN_COLORS.map(c=>(
                    <button key={c} onClick={()=>setWfConns(p=>p.map(x=>x.id===selConn.id?{...x,color:c}:x))}
                      className={cn('w-5 h-5 rounded-full transition-all hover:scale-110',selConn.color===c?'ring-2 ring-white ring-offset-1 ring-offset-black scale-110':'')}
                      style={{backgroundColor:c}}/>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>{setWfConns(p=>p.map(x=>x.id===selConn.id?{...x,label:editConnLabel}:x));setSelectedConnId(null);}}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110"
                    style={{background:`${MINT}20`,border:`1px solid ${MINT}45`,color:MINT}}>
                    <Check size={11}/> {t('Speichern')}
                  </button>
                  <button onClick={()=>{setWfConns(p=>p.filter(x=>x.id!==selConn.id));setSelectedConnId(null);}}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110"
                    style={{background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',color:'#ef4444'}}>
                    <Trash2 size={11}/>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Agent Cards */}
          {wfCards.map(card=>{
            const agent=agents.find(a=>a.id===card.agentId);if(!agent)return null;
            const ac=AGENT_COLORS[agent.id]??AGENT_COLORS.system;
            const isPending=pendingFromId===card.id;
            const isGrpSel=groupMode&&pendingGrpCards.has(card.id);
            const isDragging=dragCardId===card.id;
            return(
              <div key={card.id}
                style={{
                  position:'absolute',left:card.x,top:card.y,width:CARD_W,height:CARD_H,
                  cursor:connectMode||groupMode?'pointer':isDragging?'grabbing':'grab',
                  zIndex:isDragging?50:isPending?20:1,
                  transition:isDragging?'none':'box-shadow 0.15s',
                  background:'linear-gradient(135deg,rgba(14,20,32,0.98),rgba(10,14,22,0.98))',
                  border:isPending?`2px solid ${MINT}`:isGrpSel?'2px solid #e2c97e':`1px solid rgba(255,255,255,0.10)`,
                  boxShadow:isDragging?'0 12px 48px rgba(0,0,0,0.7)'
                    :isPending?`0 0 20px rgba(17,202,160,0.35)`
                    :isGrpSel?'0 0 18px rgba(226,201,126,0.3)'
                    :'0 2px 16px rgba(0,0,0,0.4)',
                  borderRadius:16,
                }}
                onMouseDown={e=>onCardMouseDown(e,card.id)}
                className="select-none flex flex-col overflow-hidden">
                {/* Colour accent bar top */}
                <div className="h-0.5 w-full shrink-0" style={{background:`linear-gradient(to right,${MINT}99,transparent)`}}/>

                <div className="flex items-start gap-2.5 px-3 pt-2.5 pb-1 flex-1">
                  <div className="relative shrink-0">
                    <span className="text-xl leading-none">{agent.icon}</span>
                    <span className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2',STATUS_COLORS[agent.status])} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={cn('text-xs font-bold leading-tight truncate',ac.text)}>{agent.displayName}</p>
                    <p className="text-[10px] mt-0.5 capitalize" style={{color:'#3d5a80'}}>{agent.status}</p>
                  </div>
                  {/* Trash — always visible, clearly red */}
                  <button
                    onClick={()=>setWfCards(p=>p.filter(c=>c.id!==card.id))}
                    onMouseDown={e=>e.stopPropagation()}
                    title="Karte entfernen"
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    style={{background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.28)',color:'rgba(239,68,68,0.75)'}}>
                    <Trash2 size={12}/>
                  </button>
                </div>

                {/* Chat starten */}
                <div className="px-3 pb-3">
                  <button
                    onClick={e=>{e.stopPropagation();setSelectedAgentId(agent.id);setWorkflowContext({wfName:activeWf?.name??'Workflow',agentId:agent.id});setChatTab('workflow');setMessages([]);}}
                    onMouseDown={e=>e.stopPropagation()}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:brightness-115"
                    style={{background:`${MINT}12`,border:`1px solid ${MINT}28`,color:`${MINT}cc`}}>
                    <MessageSquare size={10}/> {t('Chat starten')}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {wfCards.length===0&&(
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center"
                  style={{background:'rgba(17,202,160,0.05)',border:`1px solid rgba(17,202,160,0.14)`,boxShadow:'0 0 32px rgba(17,202,160,0.04) inset'}}>
                  <GitBranch size={34} style={{color:'rgba(17,202,160,0.35)'}}/>
                </div>
                <p className="text-sm font-semibold" style={{color:'#3d5a80'}}>{t('Agent hinzufügen → Workflow bauen')}</p>
              </div>
            </div>
          )}
        </div>
        <PanelSep/>

        {/* ── Col 4: Saved Workflows ──────────────────────────── */}
        <div className="w-52 shrink-0 flex flex-col overflow-hidden" style={{background:BG1}}>
          <div className="flex-1 overflow-y-auto py-3 space-y-2 px-2.5 scrollbar-thin">
            {workflows.length===0&&(
              <div className="text-center py-8 space-y-2">
                <Workflow size={24} className="mx-auto" style={{color:'rgba(17,202,160,0.2)'}}/>
                <p className="text-xs" style={{color:'#1e3050'}}>{t('Noch keine Workflows')}</p>
              </div>
            )}
            {workflows.map(wf=>{
              const isLoaded=activeWfId===wf.id;
              return(
                <div key={wf.id} onClick={()=>loadWorkflow(wf)}
                  className="rounded-xl p-3 transition-all cursor-pointer group"
                  style={{
                    background:isLoaded?'rgba(17,202,160,0.08)':'rgba(255,255,255,0.03)',
                    border:`1px solid ${isLoaded?'rgba(17,202,160,0.35)':'rgba(255,255,255,0.07)'}`,
                    boxShadow:isLoaded?'0 0 14px rgba(17,202,160,0.06) inset':'none',
                  }}>
                  <div className="flex items-start gap-2 mb-2.5">
                    <GitBranch size={12} className="mt-0.5 shrink-0" style={{color:isLoaded?MINT:'#2a4060'}}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate leading-snug" style={{color:isLoaded?'#e2e8f0':'#94a3b8'}}>{wf.name}</p>
                      <p className="text-[10px] mt-0.5" style={{color:'#1e3050'}}>{wf.cards.length} {t('Agenten')} · {wf.connections.length} {t('Verbindungen')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={e=>{e.stopPropagation();toggleWorkflowActive(wf.id);}}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:brightness-110"
                      style={wf.active
                        ?{background:`${MINT}15`,border:`1px solid ${MINT}35`,color:MINT}
                        :{background:'rgba(255,255,255,0.04)',border:`1px solid ${BDR}`,color:'#2a4060'}}>
                      {wf.active?<><Play size={8}/> {t('Aktiv')}</>:<><Pause size={8}/> {t('Inaktiv')}</>}
                    </button>
                    <button onClick={e=>{e.stopPropagation();deleteWorkflow(wf.id);}} title={t("Löschen")}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-red-500/15 hover:text-red-400"
                      style={{border:`1px solid ${BDR}`,color:'#1e3050'}}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          UNIFIED FOOTER ROW — one continuous border-top
      ════════════════════════════════════════════════════════ */}
      <div className={cn('shrink-0 flex',!wide&&'min-w-[1280px]')} style={{borderTop:`1px solid ${SEP}`,background:'rgba(6,10,17,0.99)'}}>

        {/* Col 1 footer: empty */}
        <div className="w-44 shrink-0"/>
        <PanelSep/>

        {/* Col 2 footer: chat input */}
        <div className="flex-1 min-w-0 p-3">
          {pendingFiles.length>0&&(
            <div className="flex flex-wrap gap-2 mb-2.5 pb-2.5" style={{borderBottom:`1px solid ${BDR}`}}>
              {pendingFiles.map(f=><FilThumb key={f.id} att={f} onRemove={()=>setPendingFiles(p=>p.filter(x=>x.id!==f.id))}/>)}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button onClick={()=>fileRef.current?.click()}
              className="p-2.5 rounded-xl transition-colors hover:bg-white/10 shrink-0" style={{color:'#2a4060'}}>
              <ImageIcon size={15}/>
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={e=>handleFiles(e.target.files)}/>
            <SelfContextToggle className="mb-0.5" />
            <button onClick={toggleRec}
              className={cn('p-2.5 rounded-xl transition-all shrink-0',isRecording?'animate-pulse':'hover:bg-white/10')}
              style={{color:isRecording?'#ef4444':'#2a4060'}}>
              {isRecording?<MicOff size={15}/>:<Mic size={15}/>}
            </button>
            <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();onSend();}}}
              placeholder={chatTab==='workflow'&&activeWf?`An Workflow "${activeWf.name}" senden…`:`An ${chatAgent?.displayName??'Agent'} senden…`}
              rows={2}
              className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none leading-relaxed"
              style={{background:'rgba(255,255,255,0.05)',border:`1px solid rgba(255,255,255,0.10)`,color:'#cbd5e1',
                fontFamily:"'Inter',system-ui,sans-serif"}}/>
            <button onClick={onSend} disabled={!chatInput.trim()||(chatTab==='workflow'&&!activeWf)||isStreaming||wfRunning}
              className="p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 shrink-0"
              style={{background:`${MINT}22`,border:`1px solid ${MINT}45`,color:MINT}}>
              <Send size={15}/>
            </button>
          </div>
        </div>
        <PanelSep/>

        {/* Col 3 footer: canvas save */}
        <div className="flex-1 min-w-0 flex items-center gap-2 px-4 py-3">
          {showNewWf?(
            <>
              <input value={newWfName} onChange={e=>setNewWfName(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')saveWorkflow();if(e.key==='Escape'){setShowNewWf(false);setNewWfName('');}}}
                placeholder={t("Workflow-Name…")} autoFocus
                className="flex-1 rounded-xl px-3.5 py-2 text-sm font-medium outline-none"
                style={{background:'rgba(17,202,160,0.08)',border:`1px solid rgba(17,202,160,0.3)`,color:'#e2e8f0'}}/>
              <button onClick={saveWorkflow} disabled={!newWfName.trim()||!wfCards.length}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-30"
                style={{background:`${MINT}20`,border:`1px solid ${MINT}45`,color:MINT}}>
                <Check size={12}/> {t('Speichern')}
              </button>
              <button onClick={()=>{setShowNewWf(false);setNewWfName('');}} className="p-2 rounded-xl hover:bg-white/10 transition-colors" style={{color:'#2a4060'}}><X size={14}/></button>
            </>
          ):(
            <>
              <p className="text-xs flex-1" style={{color:'#1e3050'}}>
                {wfCards.length} {t(wfCards.length!==1?'Karten':'Karte')} · {wfConns.length} {t(wfConns.length!==1?'Verbindungen':'Verbindung')}
              </p>
              <button onClick={()=>setShowNewWf(true)} disabled={!wfCards.length}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110 disabled:opacity-30"
                style={{background:'rgba(255,255,255,0.04)',border:`1px solid rgba(255,255,255,0.10)`,color:'#4b6080'}}>
                <Plus size={12}/> {t('Workflow speichern')}
              </button>
            </>
          )}
        </div>
        <PanelSep/>

        {/* Col 4 footer: add workflow */}
        <div className="w-52 shrink-0 flex items-center px-2.5 py-3">
          <button onClick={()=>setShowNewWf(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:brightness-110"
            style={{background:'rgba(17,202,160,0.06)',border:`1px dashed rgba(17,202,160,0.25)`,color:`${MINT}99`}}>
            <Plus size={12}/> {t('Neuer Workflow')}
          </button>
        </div>
      </div>
    </div>
  );
}
