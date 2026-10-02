"use client";
import {useCallback, useEffect, useId, useRef, useState} from "react";
import {openMicrophone, microphoneError} from "@/lib/assistant/microphone";
import {useAssistantPreferences} from "./Preferences";

/** A local meter only. No recorder, network request or stored audio. */
export function MicrophoneSettings() {
  const {preferences, update} = useAssistantPreferences(), id = useId();
  const [devices,setDevices] = useState<MediaDeviceInfo[]>([]), [message,setMessage] = useState("Starte den Pegeltest, um das Mikrofon freizugeben und die Gerätenamen zu sehen."), [error,setError] = useState("");
  const [testing,setTesting] = useState(false), [requesting,setRequesting] = useState(false), [level,setLevel] = useState(0);
  const resources = useRef<{stream?:MediaStream;ctx?:AudioContext;frame:number;timer?:ReturnType<typeof setTimeout>;version:number}>({frame:0,version:0});
  const list = useCallback(async()=>{try{const all=await navigator.mediaDevices?.enumerateDevices();setDevices(all?.filter(d=>d.kind==="audioinput")||[]);}catch{}},[]);
  const stop = useCallback(()=>{const r=resources.current;r.version++;r.stream?.getTracks().forEach(t=>t.stop());r.stream=undefined;void r.ctx?.close().catch(()=>{});r.ctx=undefined;cancelAnimationFrame(r.frame);clearTimeout(r.timer);setTesting(false);setRequesting(false);setLevel(0);},[]);
  useEffect(()=>{void list();const change=()=>{stop();void list();};const claim=(e:Event)=>{if((e as CustomEvent).detail!==id)stop();};const hide=()=>{if(document.hidden)stop();};navigator.mediaDevices?.addEventListener("devicechange",change);window.addEventListener("neo-microphone-claim",claim);document.addEventListener("visibilitychange",hide);return()=>{stop();navigator.mediaDevices?.removeEventListener("devicechange",change);window.removeEventListener("neo-microphone-claim",claim);document.removeEventListener("visibilitychange",hide);};},[id,list,stop]);
  async function test() {
    stop();window.dispatchEvent(new CustomEvent("neo-microphone-claim",{detail:id}));
    const r=resources.current,token=++r.version;setRequesting(true);setError("");
    try {
      const stream=await openMicrophone(preferences.microphoneDeviceId);
      if(token!==r.version){stream.getTracks().forEach(t=>t.stop());return;}
      r.stream=stream;setTesting(true);setRequesting(false);update({microphone:true});void list();
      const track=stream.getAudioTracks()[0];setMessage(`${track?.label||"Mikrofon"} verbunden. Sprich kurz: Der Pegel sollte ausschlagen. Der Test endet nach 15 Sekunden.`);
      track?.addEventListener("ended",()=>{if(token===r.version){stop();setError("Das Mikrofon wurde getrennt. Bitte neu auswählen.");}},{once:true});
      r.timer=setTimeout(()=>{if(token===r.version){stop();setMessage("Pegeltest beendet. Du kannst jetzt diktieren. Es wurde nichts gespeichert oder verschickt.");}},15000);
      try {r.ctx=new AudioContext();void r.ctx.resume().catch(()=>{});const a=r.ctx.createAnalyser();a.fftSize=256;r.ctx.createMediaStreamSource(stream).connect(a);const values=new Float32Array(256);const tick=()=>{if(token!==r.version)return;a.getFloatTimeDomainData(values);setLevel(Math.min(1,Math.sqrt(values.reduce((s,v)=>s+v*v,0)/values.length)*8));r.frame=requestAnimationFrame(tick);};tick();}
      catch{setMessage("Mikrofon verbunden. Dieser Browser kann keinen Pegel anzeigen; du kannst die Aufnahme trotzdem starten.");}
    } catch(e){if(token===r.version){stop();setError(microphoneError(e));}}
  }
  return <section className="microphone-settings" aria-label="Mikrofon einrichten">
    <p className="assistant-section-intro">Deine Stimme, dein Eingang. Dieser Test bleibt vollständig auf deinem Gerät.</p>
    <label>Mikrofon<select aria-label="Mikrofon auswählen" value={preferences.microphoneDeviceId} onChange={e=>{stop();update({microphoneDeviceId:e.target.value});setError("");}}><option value="">Systemstandard</option>{devices.filter(d=>d.deviceId && d.deviceId!=="default").map((d,i)=><option key={d.deviceId} value={d.deviceId}>{d.label||`Eingang ${i+1}`}</option>)}{preferences.microphoneDeviceId&&!devices.some(d=>d.deviceId===preferences.microphoneDeviceId)&&<option value={preferences.microphoneDeviceId}>Gespeichertes Mikrofon · derzeit nicht sichtbar</option>}</select></label>
    <div className="mic-test"><meter aria-label="Test-Mikrofonpegel" min={0} max={1} value={level}/><button onClick={()=>testing||requesting?stop():void test()}>{requesting?"Anfrage abbrechen":testing?"Pegeltest stoppen":"Mikrofon testen & freigeben"}</button></div>
    <p role="status">{requesting?"Bitte bestätige den Mikrofonzugriff im Browser. Danach kannst du die Taste gedrückt halten oder mit einem Klick diktieren.":message}</p>
    {error&&<p role="alert">{error}</p>}
    <label><input type="checkbox" checked={preferences.microphone} onChange={e=>{stop();update({microphone:e.target.checked});}}/>Mikrofon für Aufnahmen aktivieren</label>
    <details><summary>Wenn kein Eingang erscheint</summary><p>Prüfe das Mikrofon-Symbol neben der Webadresse und die Mikrofonfreigabe deines Browsers in den Systemeinstellungen. Eine eingebettete App kann den Zugriff blockieren.</p><a href="/notiz" target="_blank" rel="noopener noreferrer">Aufnahmeseite in eigenem Tab öffnen ↗</a><p>Bei der ersten Freigabe: erst den Pegeltest abschließen, dann Alt+X erneut halten. Ein losgelassenes Kürzel startet später keine Aufnahme.</p></details>
  </section>;
}
