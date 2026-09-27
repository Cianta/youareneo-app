import Link from "next/link";
import { brandConfig } from "@/lib/brand";
import "@/components/voice/voice.css";
export default function VoiceHelp() {
  const { appName } = brandConfig();
  return (
    <main className="voice-page">
      <article className="voice-help">
        <Link href="/notiz">← Zurück zu den Notizen</Link>
        <h1>{appName} auf deinem Startbildschirm</h1>
        <h2>iPhone / iPad</h2>
        <ol>
          <li>Öffne diese Seite in Safari.</li>
          <li>Tippe auf Teilen und „Zum Home-Bildschirm“.</li>
          <li>
            Für eine direkte Aufnahme: Erstelle in der Kurzbefehle-App einen
            Kurzbefehl mit „URL“ (Adresse dieser Website plus{" "}
            <code>/notiz?rec=1</code>) und „URLs öffnen“.
          </li>
          <li>
            Füge den Kurzbefehl zum Home-Bildschirm, Kontrollzentrum oder zur
            Aktionstaste hinzu.
          </li>
        </ol>
        <h2>Android</h2>
        <ol>
          <li>
            Öffne die Website in Chrome. Im Menü „App installieren“ oder „Zum
            Startbildschirm hinzufügen“ wählen.
          </li>
          <li>
            Halte das App-Symbol gedrückt und wähle „Neue Sprachnotiz“, sofern
            dein Launcher App-Kurzbefehle unterstützt.
          </li>
          <li>
            Alternativ die Adresse <code>/notiz?rec=1</code> als
            Startbildschirm-Verknüpfung speichern.
          </li>
        </ol>
        <h2>Mac und Tastatur</h2>
        <p>
          Im geöffneten Browser startet oder stoppt <kbd>Alt+N</kbd> die
          Aufnahme. Für einen globalen Kurzbefehl kannst du in der
          macOS-Kurzbefehle-App „URL öffnen“ mit der vollständigen Adresse
          dieser Website und <code>/notiz?rec=1</code> anlegen und eine
          Tastenkombination zuweisen. In Raycast geht dasselbe als Quicklink. Es
          wird kein systemweiter Dienst installiert.
        </p>
        <h2>Mikrofon und Offline</h2>
        <p>
          Beim ersten Mal musst du den Mikrofonzugriff erlauben. Wenn dein
          Browser den automatischen Start verhindert, tippe einmal auf das
          Mikrofon. Maximal fünf Minuten pro Aufnahme. Bei einer Unterbrechung
          oder beim Wechseln in den Hintergrund kann das Betriebssystem die
          Aufnahme stoppen. Prüfe sie vor dem Speichern.
        </p>
        <p>
          Ohne Internet bleibt nur die öffentliche App-Hülle verfügbar. Audio,
          Entwürfe, Notizen und Sitzungen werden nicht offline gespeichert.
          Ungespeicherte Entwürfe gehen beim Schließen oder Neuladen verloren.
        </p>
      </article>
    </main>
  );
}
