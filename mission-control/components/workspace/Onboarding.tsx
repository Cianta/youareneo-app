"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "./Dialog";
import { emptyDraft } from "@/lib/voice/contracts";
async function post(url: string, body: object) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Bitte erneut versuchen.");
}
export default function Onboarding({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true),
    [step, setStep] = useState(0),
    [name, setName] = useState(initialName),
    [project, setProject] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const id = useRef<string>("");
  async function finish() {
    await post("/api/onboarding", { complete: true });
    setOpen(false);
    router.refresh();
  }
  async function run(skip = false) {
    setBusy(true);
    setError("");
    try {
      if (skip) {
        await finish();
        return;
      }
      if (step === 0) await post("/api/onboarding", { name });
      if (step === 1)
        await post("/api/notes/projects", { name: project.trim() });
      if (step === 2) {
        if (!id.current) id.current = crypto.randomUUID();
        const form = new FormData();
        form.set("id", id.current);
        form.set(
          "note",
          JSON.stringify({
            ...emptyDraft(),
            title: note.trim().slice(0, 80),
            transcript: note.trim(),
            project: project.trim(),
          }),
        );
        const r = await fetch("/api/notes", { method: "POST", body: form });
        const d = await r.json();
        if (!r.ok)
          throw Error(d.error || "Die Notiz konnte nicht gespeichert werden.");
        await finish();
        return;
      }
      setStep((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  }
  if (!open) return null;
  return (
    <Dialog
      title="Dein Arbeitsraum in drei Schritten"
      onClose={() => {
        if (!busy) void run(true);
      }}
    >
      <p className="workspace-muted">
        Schritt {step + 1} von 3 · Du kannst die Einrichtung jederzeit
        überspringen. Danach erscheint sie nicht mehr.
      </p>
      <form
        className="workspace-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        {step === 0 && (
          <>
            <label htmlFor="setup-name">Wie dürfen wir dich nennen?</label>
            <input
              autoFocus
              id="setup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
            />
          </>
        )}
        {step === 1 && (
          <>
            <label htmlFor="setup-project">Dein erstes Projekt</label>
            <input
              autoFocus
              id="setup-project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Zum Beispiel: Mein nächster Schritt"
              maxLength={100}
              required
            />
          </>
        )}
        {step === 2 && (
          <>
            <label htmlFor="setup-note">Deine erste Notiz</label>
            <textarea
              autoFocus
              id="setup-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Was möchtest du in diesem Projekt festhalten?"
              maxLength={20000}
              required
            />
          </>
        )}
        {error && (
          <p role="alert" className="workspace-notice">
            {error}
          </p>
        )}
        <div className="workspace-form-actions">
          <button
            className="workspace-button"
            disabled={
              busy || !(step === 0 ? name : step === 1 ? project : note).trim()
            }
          >
            {busy
              ? "Wird gespeichert …"
              : step === 2
                ? "Notiz speichern & starten"
                : "Weiter"}
          </button>
          <button
            type="button"
            className="workspace-button"
            disabled={busy}
            onClick={() => void run(true)}
          >
            Einrichtung überspringen
          </button>
        </div>
      </form>
    </Dialog>
  );
}
