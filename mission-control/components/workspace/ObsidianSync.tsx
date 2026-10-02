"use client";
import { useState, useRef, useEffect } from "react";
import { type BrainNode, markdownFile, fileName } from "@/lib/workspace/brain";
import { usePersonal, AREAS, type Area } from "@/lib/workspace/personal";
import { syncAction, parseVaultMarkdown } from "@/lib/workspace/vault-sync";
// Browser-granted handles; no server-side filesystem access.
interface VaultFile {
  kind: "file";
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(s: string): Promise<void>;
    close(): Promise<void>;
  }>;
}
interface VaultDirectory {
  name: string;
  getDirectoryHandle(
    name: string,
    o?: { create: boolean },
  ): Promise<VaultDirectory>;
  getFileHandle(name: string, o?: { create: boolean }): Promise<VaultFile>;
  entries(): AsyncIterableIterator<[string, VaultFile | VaultDirectory]>;
}
export function ObsidianSync({ nodes }: { nodes: BrainNode[] }) {
  const s = usePersonal(),
    [folder, setFolder] = useState<VaultDirectory | null>(null),
    [status, setStatus] = useState(""),
    [auto, setAuto] = useState(false),
    [busy, setBusy] = useState(false),
    [conflicts, setConflicts] = useState<
      { id: string; name: string; disk: string | null; local: string }[]
    >([]);
  const latest = useRef(nodes);
  latest.current = nodes;
  const lock = useRef(false);
  async function write(dir: VaultDirectory, name: string, content: string) {
    const file = await dir.getFileHandle(name, { create: true });
    const stream = await file.createWritable();
    await stream.write(content);
    await stream.close();
  }
  async function read(dir: VaultDirectory, name: string) {
    try {
      const f = await (await dir.getFileHandle(name)).getFile();
      if (f.size > 2_000_000) throw new Error("Datei größer als 2 MB");
      return await f.text();
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotFoundError") return null;
      throw e;
    }
  }
  function importNote(raw: string, name: string, id?: string) {
    const data = parseVaultMarkdown(raw, name),
      state = usePersonal.getState();
    const noteId = id?.startsWith("note:") ? id.slice(5) : "vault:" + name;
    const current = state.notes.find((n) => n.id === noteId);
    const note = {
      id: noteId,
      title: data.title,
      body: data.body,
      area: (AREAS.includes(data.area as Area) ? data.area : "Leben") as Area,
      links: current?.links ?? [],
      updatedAt: new Date().toISOString(),
      workspace: state.workspace,
    };
    state.set({
      notes: current
        ? state.notes.map((n) => (n.id === noteId ? note : n))
        : [...state.notes, note],
    });
  }
  async function sync() {
    if (!folder || lock.current) return;
    lock.current = true;
    setBusy(true);
    setConflicts([]);
    try {
      const dir = await folder.getDirectoryHandle(`Trinity-${s.workspace}`, {
        create: true,
      });
      const manifestRaw = await read(dir, ".trinity-sync.json");
      const manifest: Record<string, { base: string; name: string }> =
        manifestRaw ? JSON.parse(manifestRaw) : {};
      const pending: typeof conflicts = [];
      let written = 0,
        imported = 0;
      const known = new Set(Object.values(manifest).map((v) => v.name));
      for (const node of latest.current) {
        const name = manifest[node.id]?.name ?? fileName(node),
          local = markdownFile(node, latest.current),
          disk = await read(dir, name),
          base = manifest[node.id]?.base;
        known.add(name);
        const action = syncAction(local, disk, base);
        if (action === "conflict") {
          pending.push({ id: node.id, name, disk, local });
          continue;
        }
        if (action === "write") {
          await write(dir, name, local);
          written++;
        }
        if (action === "import") {
          if (node.id.startsWith("note:")) importNote(disk!, name, node.id);
          else importNote(disk!, name);
          imported++;
        }
        manifest[node.id] = { name, base: action === "import" ? disk! : local };
      }
      let count = 0;
      for await (const [name, entry] of dir.entries()) {
        if (++count > 2000)
          throw new Error("Maximal 2000 Dateien je Abgleich.");
        if (!known.has(name) && name.endsWith(".md") && "getFile" in entry) {
          const raw = await read(dir, name);
          if (raw !== null) {
            importNote(raw, name);
            manifest["note:vault:" + name] = { name, base: raw };
            imported++;
          }
        }
      }
      await write(dir, ".trinity-sync.json", JSON.stringify(manifest));
      setConflicts(pending);
      setStatus(
        `${written} geschrieben · ${imported} eingelesen · ${pending.length} Konflikte · ${new Date().toLocaleTimeString("de-AT")}`,
      );
    } catch (e) {
      setAuto(false);
      setStatus(e instanceof Error ? e.message : "Abgleich fehlgeschlagen.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const syncRef = useRef(sync);
  syncRef.current = sync;
  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void syncRef.current();
    }, 30000);
    return () => clearInterval(timer);
  }, [auto]);
  return (
    <details className="w-card s-vault">
      <summary>◇ Mit Obsidian abgleichen</summary>
      <p>
        Wähle deinen Vault-Ordner. Trinity legt darin „Trinity-{s.workspace}“
        an. Obsidian liest diese Markdown-Dateien und Verbindungen direkt. Neue
        Notizen und Änderungen fließen beim Abgleich zurück; Änderungen an
        Projekt-/Profilansichten kommen als separate Notiz zurück.
      </p>
      <div className="s-actions">
        <button
          className="w-btn"
          onClick={async () => {
            try {
              const picker = (
                window as unknown as {
                  showDirectoryPicker?: (o: {
                    mode: string;
                  }) => Promise<VaultDirectory>;
                }
              ).showDirectoryPicker;
              if (!picker) {
                setStatus(
                  "Ordnerabgleich benötigt Chrome oder Edge auf dem Desktop. Markdown-ZIP funktioniert in allen Browsern.",
                );
                return;
              }
              setFolder(await picker({ mode: "readwrite" }));
              setStatus("Ordner verbunden. Jetzt abgleichen.");
            } catch {
              setStatus("Kein Ordner freigegeben.");
            }
          }}
        >
          Vault-Ordner wählen
        </button>
        <button
          className="w-btn"
          disabled={!folder || busy}
          onClick={() => void sync()}
        >
          {busy ? "Abgleich läuft …" : "Jetzt abgleichen"}
        </button>
        <label>
          <input
            type="checkbox"
            disabled={!folder}
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />{" "}
          Alle 30 Sekunden bei geöffneter Seite
        </label>
      </div>
      <p role="status">
        {folder?.name} {status}
      </p>
      {conflicts.map((c) => (
        <div className="w-card" key={c.id}>
          <strong>Beide Seiten geändert: {c.name}</strong>
          <p>Keine Datei wurde überschrieben.</p>
          <button
            className="w-btn"
            onClick={async () => {
              if (!folder) return;
              const dir = await folder.getDirectoryHandle(
                `Trinity-${s.workspace}`,
              );
              if (c.disk !== null)
                await write(
                  dir,
                  `${c.name.replace(/\.md$/, "")}-Sicherung-${Date.now()}.md`,
                  c.disk,
                );
              await write(dir, c.name, c.local);
              const m = JSON.parse(
                (await read(dir, ".trinity-sync.json")) ?? "{}",
              );
              m[c.id] = { name: c.name, base: c.local };
              await write(dir, ".trinity-sync.json", JSON.stringify(m));
              setConflicts((v) => v.filter((x) => x.id !== c.id));
            }}
          >
            Trinity verwenden + Datei sichern
          </button>
          {c.disk !== null && (
            <button
              className="w-btn"
              onClick={async () => {
                if (!folder) return;
                importNote(c.disk!, c.name, c.id);
                const dir = await folder.getDirectoryHandle(
                  `Trinity-${s.workspace}`,
                );
                const m = JSON.parse(
                  (await read(dir, ".trinity-sync.json")) ?? "{}",
                );
                m[c.id] = { name: c.name, base: c.disk };
                await write(dir, ".trinity-sync.json", JSON.stringify(m));
                setConflicts((v) => v.filter((x) => x.id !== c.id));
              }}
            >
              Obsidian-Version einlesen
            </button>
          )}
        </div>
      ))}
      <p className="w-muted">
        Dateien werden nie automatisch gelöscht. Nach Neuladen den Ordner erneut
        freigeben. Geräteübergreifend kann Obsidian Sync deinen Vault
        transportieren; Trinity benötigt auf jedem Gerät einen lokalen
        Ordnerzugriff.
      </p>
    </details>
  );
}
