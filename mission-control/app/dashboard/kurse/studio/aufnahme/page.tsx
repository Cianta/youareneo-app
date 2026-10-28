import Link from "next/link";
import { Recorder } from "@/components/courses/Recorder";
import "@/components/courses/courses.css";

export default function Aufnahme() {
  return <section className="workspace-page kurs-page">
    <p className="workspace-eyebrow"><Link href="/dashboard/kurse/studio" prefetch={false}>← Kursstudio</Link> · AUFNAHME · ROHVERSION</p>
    <h1>Eigene Aufnahme</h1>
    <p className="kurs-note">Erste Rohversion eines eigenen Aufnahmeraums: Kamera, Mikrofon und optional Bildschirm werden nur in diesem Browser aufgenommen und als Datei gespeichert. Es wird nichts hochgeladen. Für Interviews und Events bleibt Riverside vorerst das Werkzeug.</p>
    <Recorder/>
  </section>;
}
