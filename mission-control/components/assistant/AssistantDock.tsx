"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, MicOff, Volume2, VolumeX, Settings, X, Square, Sun, Moon } from "lucide-react";
import { AssistantAvatar, type AvatarState } from "@/components/chat/AssistantAvatar";
import { useChatMicrophone } from "@/components/chat/useChatMicrophone";
import { useBrand } from "@/components/voice/BrandProvider";
import { emptyDraft, NOTE_TYPES, type NoteDraft } from "@/lib/voice/contracts";
import { isCaptureShortcut } from "@/lib/assistant/preferences";
import { useAssistantPreferences } from "./Preferences";
const Chat = dynamic(() => import("@/components/chat/ChatWorkspace"), {ssr:false, loading:() => <p role="status">Sprachchat wird geöffnet …</p>});
type Config = {userId:string; canSave:boolean; transcriptionReady:boolean; classificationReady:boolean; provider:string};
const typeLabels = {notiz:"Notiz", aufgabe:"Aufgabe", idee:"Idee", termin:"Termin"};
async function api(path:string, init?:RequestInit) {
  const r = await fetch(path, {cache:"no-store", ...init});
  const d = await r.json();
  if (!r.ok) throw Error(r.status === 401 ? "Bitte melde dich mit deinem NEO-Konto an." : d.error || "Die Verbindung wurde unterbrochen. Bitte erneut versuchen.");
  return d;
}
export default function AssistantDock() {
  const path = usePathname(), {assistantName} = useBrand(), {preferences, update} = useAssistantPreferences();
  const [panel, setPanel] = useState<"capture"|"chat"|"settings"|null>(null);
  const [draft, setDraft] = useState<NoteDraft|null>(null), [projects,setProjects] = useState<string[]>([]);
  const [config,setConfig] = useState<Config|null>(null), [phase,setPhase] = useState(""), [error,setError] = useState(""), [notice,setNotice] = useState("");
  const [ruleProject,setRuleProject] = useState(""), [rules,setRules] = useState(""), [ruleLoading,setRuleLoading] = useState(false);
  const [browserVoices,setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceCatalog,setVoiceCatalog] = useState<{ready:boolean; voices:{id:string; name:string}[]}>({ready:false,voices:[]});
  const [chatPulse,setChatPulse] = useState<{state:AvatarState; level:number}>({state:"idle",level:0});
  const intent = useRef(false), owner = useRef(""), controller = useRef<AbortController|null>(null), version = useRef(0), mounted = useRef(true);
  const currentDraft = useRef(draft); currentDraft.current = draft;
  const state = useRef({phase,preferences}); state.current = {phase,preferences};
  const receiveAudio = useRef<(blob:Blob)=>void>(()=>{});
  const mic = useChatMicrophone({onAudio:blob=>receiveAudio.current(blob),onSpeechStart:()=>{
    window.dispatchEvent(new Event("neo-stop-chat")); window.speechSynthesis?.cancel();
  }});
  const micRef = useRef(mic); micRef.current = mic;
  const noteSubmission = useRef<{key:string;id:string}|null>(null), ruleSubmission = useRef<{key:string;id:string}|null>(null);
  function cancel() {
    intent.current = false; version.current++; controller.current?.abort(); controller.current = null;
    mic.cancel(); setPhase("");
  }
  async function session(signal?:AbortSignal) {
    const c:Config = await api("/api/voice/config", {signal});
    if (signal?.aborted || !mounted.current) throw new DOMException("Abgebrochen", "AbortError");
    if (owner.current && owner.current !== c.userId) {
      setDraft(null); setProjects([]); setRules(""); setRuleProject(""); noteSubmission.current=null; ruleSubmission.current=null;
      owner.current=c.userId; setConfig(c);
      throw Error("Das Konto hat gewechselt. Bitte beginne einen neuen Entwurf.");
    }
    owner.current=c.userId; setConfig(c); return c;
  }
  async function organize(note:NoteDraft, token:number, signal:AbortSignal, target?:string|null) {
    const d=await api("/api/voice/classify", {method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({transcript:note.transcript,source:note.source,...(target ? {project:target} : {})}), signal});
    if (!mounted.current || token !== version.current || signal.aborted) return;
    setDraft(d.note); noteSubmission.current=null;
    setNotice(d.rulesApplied ? "Vorschlag mit deinen Ortsregeln. Prüfe ihn vor dem Speichern." : "Vorschlag bereit. Du kannst Text, Ort und Typ ändern.");
  }
  receiveAudio.current = blob => {
    intent.current=false;
    const token=++version.current, abort=new AbortController(); controller.current?.abort(); controller.current=abort;
    setPanel("capture"); setPhase("Sprache wird in Text umgewandelt …"); setError(""); setNotice("");
    void (async()=>{
      try {
        const c=await session(abort.signal);
        const form=new FormData(); form.set("audio",blob,blob.type.includes("mp4") ? "notiz.mp4" : "notiz.webm"); form.set("language","auto");
        const d=await api("/api/voice/transcribe",{method:"POST",body:form,signal:abort.signal});
        if (token!==version.current || abort.signal.aborted || !mounted.current) return;
        const note={...emptyDraft(),transcript:d.transcript,title:d.transcript.slice(0,80),source:"voice" as const};
        setDraft(note); noteSubmission.current=null;
        const p=await api("/api/notes/projects",{signal:abort.signal});
        if (token!==version.current || abort.signal.aborted) return;
        setProjects(p.projects);
        if (c.classificationReady) {
          setPhase("Trinity schlägt einen Ort in deiner Map vor …");
          const requested=new URL(window.location.href).searchParams.get("project");
          await organize(note,token,abort.signal,requested && p.projects.includes(requested) ? requested : null);
        } else setNotice("Der Text ist bereit. Du kannst Ort und Typ selbst wählen; automatische Einordnung ist noch nicht eingerichtet.");
      } catch(e) {if (token===version.current && !abort.signal.aborted && mounted.current) setError(e instanceof Error ? e.message : "Einordnung fehlgeschlagen. Dein vorhandener Text bleibt erhalten.");}
      finally {if (token===version.current && mounted.current) {setPhase(""); controller.current=null;}}
    })();
  };
  const startRef = useRef<()=>Promise<void>>(async()=>{});
  startRef.current=async()=>{
    if (intent.current || state.current.phase) return;
    setPanel("capture"); setError(""); setNotice("");
    if (currentDraft.current) {setNotice("Dein Vorschlag liegt noch hier. Speichere oder verwerfe ihn, bevor du neu aufnimmst.");return;}
    if (!state.current.preferences.microphone) {setError("Das Mikrofon ist ausgeschaltet. Aktiviere es in den Einstellungen.");return;}
    intent.current=true;
    const token=++version.current, abort=new AbortController(); controller.current=abort;
    setPhase("Anmeldung und Mikrofon werden vorbereitet …");
    try {
      const c=await session(abort.signal);
      if (!c.transcriptionReady) throw Error("Spracherkennung ist noch nicht bereit. Du kannst im Notizraum schreiben.");
      if (!intent.current || token!==version.current || !mounted.current) return;
      setPhase(""); await micRef.current.start(false);
    } catch(e) {if (!abort.signal.aborted && mounted.current && token===version.current) setError(e instanceof Error ? e.message : "Aufnahme nicht möglich.");intent.current=false;}
    finally {if (token===version.current && mounted.current) {setPhase("");controller.current=null;}}
  };
  const release = () => {intent.current=false; micRef.current.finish();};
  useEffect(()=>{
    mounted.current=true;
    const down=(e:KeyboardEvent)=>{if(isCaptureShortcut(e)){e.preventDefault();if(!e.repeat)void startRef.current();}};
    const up=(e:KeyboardEvent)=>{if(e.code==="Space" || ["ControlLeft","ControlRight","ShiftLeft","ShiftRight"].includes(e.code)) {if(intent.current) {e.preventDefault();intent.current=false;micRef.current.finish();}}};
    const pulse=(e:Event)=>setChatPulse((e as CustomEvent).detail);
    const blur=()=>{intent.current=false;};
    const esc=(e:KeyboardEvent)=>{if(e.key==="Escape") {setPanel(null);intent.current=false;micRef.current.cancel();window.dispatchEvent(new Event("neo-stop-chat"));}};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("keydown",esc);
    window.addEventListener("blur",blur);window.addEventListener("neo-assistant-state",pulse);
    return ()=>{mounted.current=false;version.current++;controller.current?.abort();window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("keydown",esc);window.removeEventListener("blur",blur);window.removeEventListener("neo-assistant-state",pulse);};
  },[]);
  useEffect(()=>{
    if (!preferences.microphone) {intent.current=false;mic.cancel();}
    if (!preferences.sound) {window.speechSynthesis?.cancel();window.dispatchEvent(new Event("neo-stop-speech"));}
  },[preferences.microphone,preferences.sound,mic.cancel]);
  useEffect(()=>{
    if (panel!=="settings") return;
    const abort=new AbortController();
    const voices=()=>setBrowserVoices(window.speechSynthesis?.getVoices()||[]);voices();
    window.speechSynthesis?.addEventListener("voiceschanged",voices);
    void session(abort.signal).then(()=>api("/api/notes/projects",{signal:abort.signal})).then(p=>{if(!abort.signal.aborted)setProjects(p.projects);}).catch(e=>{if(!abort.signal.aborted)setError(e.message);});
    void api("/api/voice/speech/voices",{signal:abort.signal}).then(d=>{if(!abort.signal.aborted)setVoiceCatalog({ready:d.ready,voices:d.voices||[]});}).catch(()=>{});
    return()=>{abort.abort();window.speechSynthesis?.removeEventListener("voiceschanged",voices);};
  },[panel]);
  useEffect(()=>{
    if (!ruleProject || panel!=="settings") {setRules("");return;}
    const abort=new AbortController();setRuleLoading(true);setRules("");
    void api("/api/notes/projects?rulesFor="+encodeURIComponent(ruleProject),{signal:abort.signal})
      .then(d=>{if(!abort.signal.aborted)setRules(d.rules||"");}).catch(e=>{if(!abort.signal.aborted)setError(e.message);})
      .finally(()=>{if(!abort.signal.aborted)setRuleLoading(false);});
    return()=>abort.abort();
  },[ruleProject,panel]);
  useEffect(()=>{
    const leave=(e:BeforeUnloadEvent)=>{if(draft){e.preventDefault();}};
    window.addEventListener("beforeunload",leave);return()=>window.removeEventListener("beforeunload",leave);
  },[draft]);
  async function saveNote(note:NoteDraft, rule=false) {
    if (phase) return;
    setPhase(rule ? "Ortsregeln werden gespeichert …" : "Notiz wird gespeichert …");setError("");
    try {
      const c=await session();if(!c.canSave)throw Error("Zum Speichern benötigst du einen aktiven App-Zugang.");
      const ref=rule ? ruleSubmission : noteSubmission, key=JSON.stringify([c.userId,note]);
      if(ref.current?.key!==key)ref.current={key,id:crypto.randomUUID()};
      const form=new FormData();form.set("id",ref.current.id);form.set("note",JSON.stringify(note));
      await api("/api/notes",{method:"POST",body:form});
      if(rule)setNotice("Ortsregeln als private Projektnotiz gespeichert. Trinity verwendet die neueste Version.");
      else {setDraft(null);noteSubmission.current=null;setNotice("Gespeichert am gewählten Ort. Hermes-Aufträge warten weiterhin auf deine Freigabe.");window.dispatchEvent(new Event("neo-notes-changed"));}
    } catch(e){setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen. Bitte erneut versuchen.");}
    finally {setPhase("");}
  }
  async function reclassify() {
    if(!draft || phase)return;
    const token=++version.current,abort=new AbortController();controller.current=abort;setPhase("Einordnung mit Ortsregeln …");setError("");
    try{await session(abort.signal);await organize(draft,token,abort.signal,draft.project);}
    catch(e){if(!abort.signal.aborted)setError(e instanceof Error ? e.message : "Einordnung nicht möglich.");}
    finally{if(token===version.current){setPhase("");controller.current=null;}}
  }
  function close() {setPanel(null);cancel();window.dispatchEvent(new Event("neo-stop-chat"));}
  const active=mic.state==="recording" || mic.state==="requesting";
  const avatarState:AvatarState=active ? "listening" : phase ? "thinking" : chatPulse.state;
  return <>
    {panel && <aside className="assistant-panel" role="dialog" aria-label={panel==="settings" ? "Trinity Einstellungen" : panel==="chat" ? "Trinity Sprachchat" : "Trinity Einordnung"}>
      <header className="assistant-panel-heading"><h2>{panel==="settings" ? "Stimme & Erscheinungsbild" : panel==="chat" ? `Mit ${assistantName} sprechen` : `${assistantName} · Gedanke einordnen`}</h2><button aria-label="Trinity schließen" onClick={close}><X size={20}/></button></header>
      <div className="assistant-panel-body">
        {panel==="chat" ? <Chat embedded providerLabel="Infomaniak, Schweiz"/> : <>
          {phase && <p role="status">{phase}</p>}{notice && <p role="status">{notice}</p>}{(error||mic.error)&&<p role="alert">{error||mic.error} {!config&&<Link href="/login">Anmelden</Link>}</p>}
          {panel==="capture" && <>
            <p>Halte das Mikrofon oder <kbd>Ctrl+Shift+Leertaste</kbd>. Nach dem Loslassen kommt dein Vorschlag. Nichts wird ungeprüft gespeichert.</p>
            {active && <p role="status">{mic.state==="requesting" ? "Mikrofon wird angefragt …" : "Ich höre zu …"}</p>}
            <meter min={0} max={1} value={mic.level} aria-label="Mikrofonpegel"/>
            {draft && <div className="assistant-draft">
              <label>Titel<input maxLength={200} value={draft.title} disabled={!!phase} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
              <label>Gesprochener Text<textarea maxLength={20000} rows={5} value={draft.transcript} disabled={!!phase} onChange={e=>setDraft({...draft,transcript:e.target.value})}/></label>
              <label>Ort in deiner Trinity Map<select value={draft.project||""} disabled={!!phase} onChange={e=>setDraft({...draft,project:e.target.value||null})}><option value="">Allgemeine Notizen</option>{projects.map(p=><option key={p}>{p}</option>)}</select></label>
              <label>Einordnung<select value={draft.type} disabled={!!phase} onChange={e=>setDraft({...draft,type:e.target.value as NoteDraft["type"]})}>{NOTE_TYPES.map(t=><option key={t} value={t}>{typeLabels[t]}</option>)}</select></label>
              {draft.summary && <p>{draft.summary}</p>}
              <button disabled={!!phase||!config?.classificationReady} onClick={()=>void reclassify()}>Mit Ortsregeln neu einordnen</button>
              <button className="assistant-save" disabled={!!phase||!config?.canSave||!draft.title.trim()||!draft.transcript.trim()} onClick={()=>void saveNote(draft)}>Am gewählten Ort speichern</button>
              <button disabled={!!phase} onClick={()=>{setDraft(null);noteSubmission.current=null;setNotice("");setError("");}}>Entwurf verwerfen</button>
            </div>}
            <Link href="/notiz">Notizen öffnen</Link> · <Link href="/gehirn">Trinity Map öffnen</Link>
          </>}
          {panel==="settings" && <div className="assistant-settings">
            <label><span><Moon size={16}/> Dunkel · Hell <Sun size={16}/></span><input aria-label="Helligkeit" type="range" min={0} max={100} step={.1} value={preferences.brightness} onChange={e=>update({brightness:Number(e.target.value)})}/></label>
            <label><input type="checkbox" checked={preferences.microphone} onChange={e=>update({microphone:e.target.checked})}/>Mikrofon aktivieren</label>
            <label><input type="checkbox" checked={preferences.sound} onChange={e=>update({sound:e.target.checked})}/>Sprachausgabe aktivieren</label>
            <label>Lautstärke<input aria-label="Lautstärke" type="range" min={0} max={1} step={.01} value={preferences.volume} onChange={e=>update({volume:Number(e.target.value)})}/></label>
            <label>Sprachausgabe<select value={preferences.provider} onChange={e=>update({provider:e.target.value as typeof preferences.provider})}><option value="browser">Browser-Stimme</option><option value="vocallab" disabled={!voiceCatalog.ready}>VocalLab{!voiceCatalog.ready ? " (noch nicht bereit)" : ""}</option><option value="off">Nur Text</option></select></label>
            {preferences.provider==="browser" && <>
              <label>Browser-Stimme<select value={preferences.browserVoice} onChange={e=>update({browserVoice:e.target.value})}><option value="">Standard</option>{browserVoices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}</select></label>
              <label>Sprechtempo<input aria-label="Sprechtempo" type="range" min={.5} max={2} step={.05} value={preferences.rate} onChange={e=>update({rate:Number(e.target.value)})}/></label>
              <label>Tonhöhe<input aria-label="Tonhöhe" type="range" min={.5} max={2} step={.05} value={preferences.pitch} onChange={e=>update({pitch:Number(e.target.value)})}/></label>
            </>}
            {preferences.provider==="vocallab"&&<label>VocalLab-Stimme<select value={preferences.voice} onChange={e=>update({voice:e.target.value})}><option value="">Standard</option>{voiceCatalog.voices.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>}
            <p>Ctrl+Shift+Leertaste gedrückt halten: überall in der App eine Sprachnotiz aufnehmen. ⌘Tab / Alt+Tab bleiben beim Betriebssystem.</p>
            <button onClick={()=>{setPanel("chat");setError("");}}>Sprachchat starten</button>
            <details><summary>Regeln für einen Ort</summary><p>Private Projektnotizen mit dem Tag „projektregeln“. Die neueste Version gilt für die Einordnung; sie startet keine Aktionen.</p>
              <label>Projekt<select value={ruleProject} disabled={!!phase} onChange={e=>setRuleProject(e.target.value)}><option value="">Ort auswählen</option>{projects.map(p=><option key={p}>{p}</option>)}</select></label>
              {ruleProject&&<><label>Ortsregeln<textarea maxLength={2000} rows={4} value={rules} disabled={ruleLoading||!!phase} onChange={e=>setRules(e.target.value)} placeholder="Zum Beispiel: Rezepte als Notiz, Zutaten und Zubereitung getrennt; Tags saisonal ergänzen."/></label>
                <button disabled={!!phase||ruleLoading||!rules.trim()||!config?.canSave} onClick={()=>void saveNote({...emptyDraft(),title:"Regeln · "+ruleProject,transcript:rules,project:ruleProject,tags:["projektregeln"]},true)}>Ortsregeln speichern</button></>}
            </details>
            <p>Audio: Infomaniak, Schweiz. Einordnung und Sprachchat: Anthropic. Einstellungen für Anzeige und Browser-Stimme bleiben auf diesem Gerät; Sitzung und Notizen werden nicht im localStorage gespeichert.</p>
          </div>}
        </>}
      </div>
    </aside>}
    <div className="assistant-dock" aria-label="Trinity Steuerung">
      <button title="Gedrückt halten zum Sprechen · Ctrl+Shift+Leertaste" aria-label="Sprachnotiz aufnehmen: gedrückt halten" aria-pressed={active} className={active ? "is-listening" : ""}
        onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);void startRef.current();}}
        onPointerUp={release} onPointerCancel={()=>{intent.current=false;mic.cancel();}} onLostPointerCapture={()=>{if(intent.current)release();}}
        onKeyDown={e=>{if([" ","Enter"].includes(e.key)&&!e.repeat){e.preventDefault();void startRef.current();}}} onKeyUp={e=>{if([" ","Enter"].includes(e.key)){e.preventDefault();release();}}}>
        {active ? <Square size={18}/> : preferences.microphone ? <Mic size={20}/> : <MicOff size={20}/>}
      </button>
      <button aria-label={preferences.sound ? "Ton ausschalten" : "Ton einschalten"} aria-pressed={preferences.sound} title="Sprachausgabe ein / aus" onClick={()=>update({sound:!preferences.sound})}>{preferences.sound ? <Volume2 size={20}/> : <VolumeX size={20}/>}</button>
      <button aria-label="Trinity Einstellungen öffnen" title="Stimme & Helligkeit" aria-expanded={panel==="settings"} onClick={()=>{intent.current=false;mic.cancel();setError("");setNotice("");setPanel(panel==="settings" ? null : "settings");}}><Settings size={20}/></button>
      <AssistantAvatar state={avatarState} level={active ? mic.level : chatPulse.level} onOpen={()=>{
        if(path==="/sprechen" && !draft){document.getElementById("chat-text")?.focus();return;}
        setPanel(panel=== "chat" ? null : draft ? "capture" : "chat");setError("");
      }} caption={assistantName}/>
      {(phase||draft)&&panel===null&&<span className="assistant-indicator" aria-label={phase||"Einordnung liegt bereit"}/>}
    </div>
  </>;
}
