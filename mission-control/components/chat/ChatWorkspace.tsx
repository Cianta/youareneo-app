"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {Send, Mic, Square, ArrowUpRight, Sparkles} from "lucide-react";
import {insertDictation} from "@/lib/assistant/widget";
export type ChatControls = {focus:()=>void; start:(append:boolean)=>Promise<void>; finish:()=>void; cancel:()=>void; send:()=>void};
import { useBrand } from "@/components/voice/BrandProvider";
import { type ChatMessage, speechChunks } from "@/lib/chat/contracts";
import { readChat } from "@/lib/chat/client";
import type { SpeechVoice } from "@/lib/chat/speech";
import { observePlayback } from "@/lib/chat/playback-meter";
import { useChatMicrophone } from "./useChatMicrophone";
import "./chat.css";
import { useAssistantPreferences } from "@/components/assistant/Preferences";
type Turn = ChatMessage & {
  id: string;
  complete: boolean;
  sources?: { id: string; title: string }[];
};
export default function ChatWorkspace({
  providerLabel,
  embedded = false,
  onControlsReady,
}: {
  providerLabel: string;
  embedded?: boolean;
  onControlsReady?:(controls:ChatControls|null)=>void;
}) {
  const { assistantName } = useBrand();
  const {preferences, update} = useAssistantPreferences();
  const preferencesRef = useRef(preferences); preferencesRef.current = preferences;
  const {provider, voice, browserVoice} = preferences;
  const setProvider = (value: typeof provider) => update({provider:value});
  const setVoice = (value:string) => update({voice:value});
  const setBrowserVoice = (value:string | ((old:string)=>string)) => update({browserVoice:typeof value === "function" ? value(preferencesRef.current.browserVoice) : value});
  const textarea = useRef<HTMLTextAreaElement|null>(null), dictationMode=useRef(false), freeMode=useRef(false), held=useRef(false), owner=useRef("");
  const controlsRef=useRef<ChatControls|null>(null), sending=useRef(false);
  const [turns, setTurns] = useState<Turn[]>([]),
    [text, setText] = useState(""),
    [includeNotes, setIncludeNotes] = useState(false),
    [handsFree, setHandsFree] = useState(false),
    [status, setStatus] = useState("Bereit"),
    [error, setError] = useState("");
  const textRef=useRef(text);textRef.current=text;
  const recordingOwner=useRef("");
  const [authenticated, setAuthenticated] = useState(false),
    [canSave, setCanSave] = useState(false),
    [transcriptionReady, setTranscriptionReady] = useState(false),
    [chatReady, setChatReady] = useState(false);
  const [vocalReady, setVocalReady] = useState(false),
    [voices, setVoices] = useState<SpeechVoice[]>([]),
    [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false),
    [retry, setRetry] = useState(0),
    [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false),
    [outputLevel, setOutputLevel] = useState(0);
  const session = useRef(0),
    controller = useRef<AbortController | null>(null),
    audio = useRef<HTMLAudioElement | null>(null),
    objectURL = useRef(""),
    stopPlayback = useRef<(() => void) | null>(null),
    turnRef = useRef(turns),
    mounted = useRef(true),
    saveId = useRef<string | null>(null),
    bottom = useRef<HTMLDivElement>(null);
  turnRef.current = turns;
  const interrupt = useCallback(() => {
    session.current++;
    controller.current?.abort();
    controller.current = null;
    stopPlayback.current?.();
    stopPlayback.current = null;
    if (audio.current) {
      audio.current.pause();
      audio.current.src = "";
      audio.current = null;
    }
    if (objectURL.current) {
      URL.revokeObjectURL(objectURL.current);
      objectURL.current = "";
    }
    window.speechSynthesis?.cancel();
    if (mounted.current) {
      setBusy(false);
      setPlaying(false);
      setOutputLevel(0);
      setStatus("Bereit");
    }
  }, []);
  const audioTurn = useRef<(blob: Blob) => void>(() => {});
  const mic = useChatMicrophone({
    onAudio: (blob) => audioTurn.current(blob),
    onSpeechStart: interrupt,
  });
  const settings = useRef(preferences);
  settings.current = preferences;
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/voice/config", { signal: abort.signal, cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok)
          throw Error(
            r.status === 401
              ? "Bitte melde dich für den Sprachchat an."
              : d.error,
          );
        if (abort.signal.aborted) return;
        if(owner.current && owner.current!==d.userId){interrupt();turnRef.current=[];textRef.current="";setTurns([]);setText("");saveId.current=null;setNotice("Das Konto hat gewechselt. Beginne einen neuen Gedanken.");}
        owner.current=d.userId;
        setAuthenticated(true);
        setCanSave(d.canSave);
        setTranscriptionReady(d.transcriptionReady);
        setChatReady(d.classificationReady);
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          setAuthenticated(false);
          setError(
            e.message || "Die Verbindung konnte nicht hergestellt werden.",
          );
        }
      });
    fetch("/api/voice/speech/voices", {
      signal: abort.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (abort.signal.aborted) return;
        setVocalReady(d.ready);
        setVoices(d.voices || []);
        const chosen =
          d.voices?.find((v: SpeechVoice) => v.id === d.selected) ||
          d.voices?.find((v: SpeechVoice) =>
            v.languages.some((l) => l.startsWith("de")),
          ) ||
          d.voices?.[0];
        if (!preferencesRef.current.voice) setVoice(chosen?.id || "");
        if (!d.ready)
          setNotice(
            "VocalLab ist noch nicht eingerichtet. Die Browser-Stimme steht als Rückfall bereit.",
          );
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setNotice(
            "VocalLab ist momentan nicht verfügbar. Die Browser-Stimme bleibt auswählbar.",
          );
      });
    return () => abort.abort();
  }, [retry]);
  useEffect(() => {
    const update = () => {
      const list = window.speechSynthesis?.getVoices() || [];
      setBrowserVoices(list);
      setBrowserVoice(
        (old) =>
          old ||
          list.find((v) => v.lang.startsWith("de"))?.voiceURI ||
          list[0]?.voiceURI ||
          "",
      );
    };
    update();
    window.speechSynthesis?.addEventListener("voiceschanged", update);
    return () =>
      window.speechSynthesis?.removeEventListener("voiceschanged", update);
  }, []);
  useEffect(() => {
    mounted.current = true;
    const hidden = () => {
      if (document.hidden) interrupt();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      mounted.current = false;
      interrupt();
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [interrupt]);
  useEffect(() => {
    const stop=()=>{mic.cancel();interrupt();};
    const mute=()=>{stopPlayback.current?.();stopPlayback.current=null;audio.current?.pause();window.speechSynthesis?.cancel();setPlaying(false);setOutputLevel(0);};
    window.addEventListener("neo-stop-chat",stop);window.addEventListener("neo-stop-speech",mute);
    return()=>{window.removeEventListener("neo-stop-chat",stop);window.removeEventListener("neo-stop-speech",mute);};
  },[interrupt,mic.cancel]);
  useEffect(()=>{if(!preferences.microphone)mic.cancel();},[preferences.microphone,mic.cancel]);
  const pulseLevel=Math.round((playing ? outputLevel : mic.state === "recording" || mic.state === "listening" ? mic.level : 0)*20)/20;
  useEffect(()=>{
    window.dispatchEvent(new CustomEvent("neo-assistant-state",{detail:{state:playing ? "speaking" : busy ? "thinking" : mic.state==="recording" || mic.state==="listening" ? "listening" : "idle",level:pulseLevel}}));
  },[mic.state,playing,busy,pulseLevel]);
  useEffect(()=>()=>{window.dispatchEvent(new CustomEvent("neo-assistant-state",{detail:{state:"idle",level:0}}));},[]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [turns.length]);
  async function playText(answer: string, token: number, signal: AbortSignal) {
    const pref = settings.current;
    if (pref.provider === "off" || !pref.sound) return;
    const playback = (active: boolean) => {
      if (mounted.current && token === session.current) {
        setPlaying(active);
        setOutputLevel(0);
        setStatus(active ? "Spricht" : "Denkt");
      }
    };
    for (const chunk of speechChunks(answer)) {
      if (signal.aborted || token !== session.current || !settings.current.sound) return;
      if (pref.provider === "browser") {
        if (!window.speechSynthesis)
          throw Error(
            "Dein Browser hat keine Sprachausgabe. Die Antwort steht als Text bereit.",
          );
        await new Promise<void>((resolve, reject) => {
          const speech = new SpeechSynthesisUtterance(chunk);
          speech.lang = "de-DE";
          speech.volume = settings.current.volume;
          speech.rate = pref.rate; speech.pitch = pref.pitch;
          speech.voice =
            window.speechSynthesis
              .getVoices()
              .find((v) => v.voiceURI === pref.browserVoice) || null;
          speech.onstart = () => playback(true);
          speech.onend = () => {
            playback(false);
            resolve();
          };
          speech.onerror = (e) => {
            playback(false);
            if (
              signal.aborted ||
              e.error === "canceled" ||
              e.error === "interrupted"
            )
              resolve();
            else
              reject(
                Error(
                  "Die Browser-Stimme konnte nicht starten. Nutze „Antwort vorlesen“.",
                ),
              );
          };
          stopPlayback.current = () => {
            speech.onstart = null;
            speech.onend = null;
            speech.onerror = null;
            window.speechSynthesis.cancel();
            resolve();
          };
          window.speechSynthesis.speak(speech);
        });
      } else {
        const r = await fetch("/api/voice/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunk, voice: pref.voice }),
          signal,
        });
        if (!r.ok) {
          const d = await r.json();
          throw Error(d.error || "Sprachausgabe nicht verfügbar.");
        }
        const blob = await r.blob();
        if (signal.aborted || token !== session.current || !settings.current.sound) return;
        const url = URL.createObjectURL(blob);
        objectURL.current = url;
        const player = new Audio(url);
        player.volume = settings.current.volume;
        audio.current = player;
        let stopMeter: (() => void) | undefined;
        player.onplaying = () => {
          if (signal.aborted || token !== session.current) return;
          playback(true);
          stopMeter ??= observePlayback(player, (level) => {
            if (mounted.current && token === session.current)
              setOutputLevel(level);
          });
        };
        player.onwaiting = () => playback(false);
        try {
          await new Promise<void>((resolve, reject) => {
            player.onended = () => resolve();
            player.onerror = () =>
              reject(Error("Audio konnte nicht abgespielt werden."));
            stopPlayback.current = () => {
              player.pause();
              stopMeter?.();
              resolve();
            };
            void player
              .play()
              .catch(() =>
                reject(
                  Error(
                    "Bitte tippe auf „Antwort vorlesen“, damit dein Browser Audio abspielt.",
                  ),
                ),
              );
          });
        } finally {
          player.onplaying = null;
          player.onwaiting = null;
          player.onended = null;
          player.onerror = null;
          player.pause();
          stopMeter?.();
          playback(false);
          player.src = "";
          URL.revokeObjectURL(url);
          if (objectURL.current === url) objectURL.current = "";
          if (audio.current === player) audio.current = null;
        }
      }
      stopPlayback.current = null;
    }
  }
  async function checkSession(signal?:AbortSignal, expectedOwner=owner.current) {
    const r=await fetch("/api/voice/config",{cache:"no-store",signal}),c=await r.json();
    if(!r.ok)throw Error(r.status===401 ? "Bitte melde dich mit deinem NEO-Konto an." : c.error||"Verbindung nicht verfügbar.");
    if(signal?.aborted || !mounted.current)throw new DOMException("Abgebrochen","AbortError");
    if((expectedOwner && expectedOwner!==c.userId) || (owner.current && owner.current!==c.userId)){owner.current=c.userId;turnRef.current=[];textRef.current="";setTurns([]);setText("");saveId.current=null;throw Error("Das Konto hat gewechselt. Bitte beginne einen neuen Gedanken.");}
    owner.current=c.userId;return c;
  }
  async function startDictation(append:boolean, free=false) {
    if(held.current || (busy && status==="Wandelt Sprache um"))return;
    if(!preferencesRef.current.microphone){setError("Das Mikrofon ist ausgeschaltet. Aktiviere es am Zahnrad.");return;}
    held.current=true;dictationMode.current=append;freeMode.current=free;interrupt();setError("");
    const token=session.current,abort=new AbortController();controller.current=abort;
    setStatus("Mikrofon wird vorbereitet …");
    try {const c=await checkSession(abort.signal);if(!c.transcriptionReady)throw Error("Spracherkennung ist noch nicht bereit. Du kannst deinen Prompt schreiben.");
      if(held.current && token===session.current && !abort.signal.aborted){recordingOwner.current=c.userId;await mic.start(free);}
    } catch(e){if(!abort.signal.aborted && token===session.current){held.current=false;setError(e instanceof Error?e.message:"Aufnahme nicht möglich.");}}
  }
  function finishDictation(){held.current=false;mic.finish();}
  controlsRef.current={focus:()=>{textarea.current?.focus();void checkSession().catch(e=>{if(mounted.current)setError(e.message)})},start:startDictation,finish:finishDictation,cancel:()=>{held.current=false;mic.cancel();interrupt();},send:()=>{if(!busy && mic.state==="idle")void send(textRef.current);}};
  useEffect(()=>{onControlsReady?.({focus:()=>controlsRef.current?.focus(),start:async a=>{await controlsRef.current?.start(a)},finish:()=>controlsRef.current?.finish(),cancel:()=>controlsRef.current?.cancel(),send:()=>controlsRef.current?.send()});return()=>onControlsReady?.(null)},[onControlsReady]);
  async function send(content: string) {
    if (!content.trim() || content.length>4000 || !authenticated || !chatReady || busy || sending.current || mic.state!=="idle") return;
    sending.current=true;
    interrupt();
    const token = session.current,
      abort = new AbortController();
    controller.current = abort;
    setError("");
    setBusy(true);
    setStatus("Denkt");
    saveId.current = null;
    const history = turnRef.current.filter((t) => t.complete);
    // Keep only complete user/assistant pairs, then the new user turn.
    const pairs: ChatMessage[] = [];
    for (let i = 0; i < history.length - 1; i++)
      if (history[i].role === "user" && history[i + 1].role === "assistant") {
        pairs.push(
          { role: "user", content: history[i].content },
          { role: "assistant", content: history[i + 1].content },
        );
        i++;
      }
    let messages = [
      ...pairs.slice(-10),
      { role: "user" as const, content: content.trim() },
    ];
    while (
      messages.reduce((n, m) => n + m.content.length, 0) > 18000 &&
      messages.length > 1
    )
      messages = messages.slice(2);
    const submissionOwner=owner.current;
    const uid = crypto.randomUUID(),
      aid = crypto.randomUUID();
    let answer = "";
    setTurns((old) => [
      ...old,
      { id: uid, role: "user", content: content.trim(), complete: true },
      { id: aid, role: "assistant", content: "", complete: false },
    ]);
    try {
      const c=await checkSession(abort.signal,submissionOwner);if(!c.classificationReady)throw Error("Trinity ist noch nicht bereit. Dein Text bleibt erhalten.");
      setText("");
      const response = await fetch("/api/voice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, includeNotes }),
        signal: abort.signal,
      });
      if (response.status === 401 || response.status === 429) mic.cancel();
      await readChat(
        response,
        (event) => {
          if (token !== session.current) return;
          if (event.type === "text") {
            answer += event.text;
            setTurns((old) =>
              old.map((t) => (t.id === aid ? { ...t, content: answer } : t)),
            );
          }
          if (event.type === "sources")
            setTurns((old) =>
              old.map((t) =>
                t.id === aid ? { ...t, sources: event.notes } : t,
              ),
            );
          if (event.type === "done")
            setTurns((old) =>
              old.map((t) => (t.id === aid ? { ...t, complete: true } : t)),
            );
        },
        abort.signal,
      );
      if (token === session.current)
        await playText(answer, token, abort.signal);
    } catch (e) {
      if (!abort.signal.aborted && token === session.current){
        setError(e instanceof Error ? e.message : "Antwort nicht verfügbar.");
        if(owner.current===submissionOwner)setText(current=>current||content);
      }
    } finally {
      sending.current=false;
      if (token === session.current) {
        setBusy(false);
        setStatus("Bereit");
      }
    }
  }
  audioTurn.current = (blob) => {
    if(freeMode.current){held.current=false;mic.cancel();}
    void (async () => {
      interrupt();
      const token = session.current,
        abort = new AbortController();
      controller.current = abort;
      setBusy(true);
      setStatus("Wandelt Sprache um");
      setError("");
      try {
        await checkSession(abort.signal,recordingOwner.current);
        const form = new FormData();
        form.set(
          "audio",
          blob,
          blob.type.includes("mp4") ? "chat.mp4" : "chat.webm",
        );
        form.set("language", "auto");
        const r = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: form,
            signal: abort.signal,
          }),
          d = await r.json();
        if (!r.ok) {
          if (r.status === 401 || r.status === 429) mic.cancel();
          throw Error(d.error);
        }
        if (token !== session.current) return;
        const input=textarea.current,start=input?.selectionStart,end=input?.selectionEnd;
        setText(current=>insertDictation(current,d.transcript,dictationMode.current,start,end));
        held.current=false;setNotice("Transkription bereit. Prüfe oder ergänze den Text und sende mit Alt+C.");
        textarea.current?.focus();
      } catch (e) {
        if (!abort.signal.aborted && token === session.current)
          setError(
            e instanceof Error ? e.message : "Umwandlung fehlgeschlagen.",
          );
      } finally {
        if (token === session.current) {
          setBusy(false);
          setStatus("Bereit");
        }
      }
    })();
  };
  async function save() {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    try {
      const c=await checkSession();if(!c.canSave)throw Error("Zum Speichern benötigst du einen aktiven App-Zugang.");
      const transcript = turnRef.current
        .filter((t) => t.complete)
        .map(
          (t) => (t.role === "user" ? "Ich" : assistantName) + ": " + t.content,
        )
        .join("\n\n");
      if (!transcript || transcript.length > 20000)
        throw Error(
          "Zum Speichern ist das Gespräch zu lang. Bitte übernimm einen Ausschnitt in eine Notiz.",
        );
      saveId.current ||= crypto.randomUUID();
      const form = new FormData();
      form.set("id", saveId.current);
      form.set(
        "note",
        JSON.stringify({
          title: "Gespräch vom " + new Date().toLocaleDateString("de-DE"),
          transcript,
          summary: "",
          type: "notiz",
          project: null,
          tags: [],
          due: null,
          assignee: null,
          source: "text",
        }),
      );
      const r = await fetch("/api/notes", { method: "POST", body: form }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      setNotice("Gespräch als eigene Notiz gespeichert.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }
  useEffect(()=>{const leave=(e:BeforeUnloadEvent)=>{if(text.trim()||turns.length){e.preventDefault();}};window.addEventListener("beforeunload",leave);return()=>window.removeEventListener("beforeunload",leave)},[text,turns.length]);
  const stopAll = () => {
    mic.cancel();
    interrupt();
  };
  const lastAnswer = [...turns]
    .reverse()
    .find((t) => t.role === "assistant" && t.complete);
  const recording=mic.state!=="idle";
  const inputId=embedded ? "assistant-chat-text" : "chat-text";
  return <section className="chat-workspace guiding-chat" data-embedded={embedded || undefined}>
    {!embedded && <header><Link href="/dashboard">← Dein Guiding Space</Link><h1>{assistantName}</h1><span>Deine hauseigene Assistentin</span></header>}
    <section className="chat-conversation" aria-label="Gespräch" aria-live="polite" aria-relevant="additions text">
      {!turns.length && <div className="chat-welcome"><Sparkles size={25}/><h2>Was bewegt dich?</h2><p>Ein Gedanke, eine Frage, ein nächster Schritt.</p><div className="chat-suggestions">{["Hilf mir, meinen Tag zu ordnen.","Lass uns eine Idee weiterdenken."].map(t=><button key={t} onClick={()=>{setText(t);textarea.current?.focus()}}>{t}</button>)}</div></div>}
      {turns.map(t=><article key={t.id} data-role={t.role}><strong>{t.role==="user" ? "Du" : assistantName}</strong><p>{t.content || (t.complete ? "Keine Textantwort." : "Trinity denkt …")}</p>{!t.complete && t.content && <small>Antwort läuft oder wurde unterbrochen.</small>}{!!t.sources?.length && <details><summary>Eigene Notizen im Kontext</summary>{t.sources.map(n=><Link key={n.id} href={"/notiz?note="+encodeURIComponent(n.id)}>{n.title}<ArrowUpRight size={12}/></Link>)}</details>}</article>)}<div ref={bottom}/>
    </section>
    <div className="chat-feedback"><p role="status">{mic.state==="requesting" ? "Mikrofon wird angefragt …" : recording ? "Ich höre zu. Loslassen übernimmt den Text." : status}</p>{(error||mic.error)&&<p role="alert">{error||mic.error} <button onClick={()=>setRetry(n=>n+1)}>Erneut prüfen</button></p>}{notice&&<p role="status">{notice}</p>}{!authenticated&&<p><Link href="/login">Anmelden</Link> für KI und Transkription. Deinen Prompt kannst du bereits schreiben.</p>}</div>
    <form className="chat-composer" onSubmit={e=>{e.preventDefault();void send(textRef.current)}}>
      <label htmlFor={inputId}>Dein Prompt</label><textarea ref={textarea} id={inputId} placeholder="Schreib Trinity, was du vorhast …" maxLength={4000} value={text} onChange={e=>setText(e.target.value)} rows={3}/>
      <div className="chat-composer-tools"><button type="button" className={recording ? "chat-record is-recording" : "chat-record"} aria-label="Prompt diktieren: gedrückt halten" aria-pressed={recording} disabled={(busy&&status==="Wandelt Sprache um")||!preferences.microphone} style={{touchAction:"none"}} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);void startDictation(true)}} onPointerUp={finishDictation} onPointerCancel={()=>{held.current=false;mic.cancel()}} onLostPointerCapture={()=>{if(held.current)finishDictation()}} onKeyDown={e=>{if([" ","Enter"].includes(e.key)&&!e.repeat){e.preventDefault();void startDictation(true)}}} onKeyUp={e=>{if([" ","Enter"].includes(e.key)){e.preventDefault();finishDictation()}}}>{recording ? <Square size={18}/> : <Mic size={18}/>}<span>Diktieren</span></button><meter min={0} max={1} value={mic.level} aria-label="Mikrofonpegel"/><button className="chat-send" type="submit" disabled={!authenticated||!chatReady||busy||recording||!text.trim()||text.length>4000}><Send size={17}/>Senden <kbd>Alt+C</kbd></button></div>
      {text.length>4000&&<p role="alert">Bitte kürze den Text auf 4.000 Zeichen. Dein Text bleibt vollständig im Entwurf.</p>}
      <div className="chat-shortcuts"><span><kbd>Alt+Y</kbd> Öffnen</span><span><kbd>Alt+X</kbd> Halten</span><span><kbd>Alt+H</kbd> Ergänzen</span></div>
    </form>
    <details className="chat-options"><summary>Kontext, Gespräch & Datenschutz</summary><label><input type="checkbox" checked={includeNotes} onChange={e=>setIncludeNotes(e.target.checked)}/>Passende eigene Notizen als Kontext verwenden</label>      <div className="chat-settings">
        <label>
          <input
            type="checkbox"
            checked={includeNotes}
            onChange={(e) => setIncludeNotes(e.target.checked)}
          />
          Passende eigene Notizen als Kontext verwenden
        </label>
        <label>
          Sprachausgabe
          <select
            value={provider}
            onChange={(e) => {
              interrupt();
              setProvider(e.target.value as typeof provider);
            }}
          >
            <option value="vocallab" disabled={!vocalReady}>
              VocalLab{!vocalReady ? " (noch nicht bereit)" : ""}
            </option>
            <option value="browser">Browser-Stimme</option>
            <option value="off">Nur Text</option>
          </select>
        </label>
        {provider === "vocallab" ? (
          <label>
            Stimme
            <select
              value={voice}
              onChange={(e) => {
                interrupt();
                setVoice(e.target.value);
              }}
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.languages.join(", ")})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                void fetch("/api/voice/speech/preferences", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ voice }),
                })
                  .then(async (r) => {
                    if (!r.ok)
                      throw Error(
                        "Die Stimme konnte nicht gespeichert werden.",
                      );
                    setNotice("Stimme für dein Konto gespeichert.");
                  })
                  .catch((e) => setError(e.message));
              }}
            >
              Stimme merken
            </button>
          </label>
        ) : provider === "browser" ? (
          <label>
            Browser-Stimme
            <select
              value={browserVoice}
              onChange={(e) => {
                interrupt();
                setBrowserVoice(e.target.value);
              }}
            >
              <option value="">Standard</option>
              {browserVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
<div className="chat-free-options"><label><input type="checkbox" checked={handsFree} onChange={e=>{stopAll();setHandsFree(e.target.checked)}}/>Freihändig bis zur Sprechpause</label>{handsFree&&<button className="chat-free" disabled={!preferences.microphone||(busy&&status==="Wandelt Sprache um")} onClick={()=>{if(mic.state==="idle")void startDictation(true,true);else{held.current=false;stopAll()}}}>{mic.state==="idle"?"Freihändig starten":"Mikrofon ausschalten"}</button>}<p>Nach der Sprechpause wird nur Text eingefügt. Du prüfst und sendest ihn selbst.</p></div><div className="chat-actions"><button disabled={!lastAnswer||busy} onClick={()=>{if(!lastAnswer)return;interrupt();const token=session.current,abort=new AbortController();controller.current=abort;setBusy(true);void playText(lastAnswer.content,token,abort.signal).catch(e=>{if(!abort.signal.aborted)setError(e.message)}).finally(()=>{if(token===session.current)setBusy(false)})}}>Antwort vorlesen</button><button disabled={!canSave||saving||busy||!turns.length} onClick={()=>void save()}>{saving ? "Speichert …" : "Als Notiz speichern"}</button><button onClick={stopAll}>Antwort stoppen</button><button onClick={()=>{stopAll();setTurns([]);saveId.current=null;setNotice("")}}>Neues Gespräch</button></div><p>Audio: {providerLabel}. Gespräch und optional eigene Notizen: Anthropic. Stimme: VocalLab oder Browser. Audio und Entwurf bleiben flüchtig. Nur dein Klick speichert eine Notiz; externe Aktionen brauchen weiterhin eine eigene Freigabe.</p></details>
  </section>;
}
