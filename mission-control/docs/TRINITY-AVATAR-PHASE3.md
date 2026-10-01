# Phase 3: Avatar

Stand: 01.10.2026. Branch `codex/trinity-avatar`, aufbauend auf PR #13 (`codex/infomaniak-api-token`). Freigabe zur Fortsetzung im Automodus; ausschließlich Staging. Echte Anbieter-, Konto- und Handyabnahme bleibt auf Nutzerwunsch später.

## Verhalten

In den Kopfzeilen von `/dashboard/*`, `/notiz`, `/gehirn` und `/sprechen` sitzt eine kleine SVG-Figur aus Energielinien. Sie nutzt bestehende Theme-Farben und den konfigurierten Assistentinnen-Namen. Keine Bilddateien oder neuen Bibliotheken.

| Zustand | Auslöser | Darstellung |
| --- | --- | --- |
| Bereit | Kein laufender Vorgang; Aufnahme pausiert/gestoppt | Ruhige Figur |
| Hört zu | Aktive Aufnahme oder freihändiges Zuhören | Energielinien reagieren auf den vorhandenen Mikrofon-Analyser |
| Denkt | Transkription, Chatantwort oder Vorbereitung der Sprachausgabe; laufende Notizverarbeitung | Langsam kreisende Linie |
| Spricht | Audio-Wiedergabe hat tatsächlich begonnen | VocalLab-Ausgabe: Linien reagieren auf gemessene Lautstärke, auch auf Stille |

Die Browser-Stimme meldet ihren tatsächlichen Start und ihr Ende, stellt aber kein Audiosignal für eine Pegelmessung bereit. In diesem Rückfall bleibt die Figur während „Spricht“ ruhig. Kann Web Audio nicht gestartet werden, läuft die normale Audio-Wiedergabe ohne Pegelanimation weiter.

Klick bzw. Enter öffnet `/sprechen`, ohne eine Aufnahme zu starten. Auf dieser Seite fokussiert ein erneuter Klick das Texteingabefeld und erhält das Gespräch. Mikrofonzugriff erfolgt weiterhin nur über die Aufnahmebedienung. Pause, Stoppen, Unterbrechung und Seitenwechsel geben die Audio-Ressourcen frei.

`prefers-reduced-motion: reduce` unterbindet sowohl die Denkrotation als auch pegelabhängige Größenänderungen. Zustandsname und Farbe bleiben erkennbar. Die Figur ist per Tastatur bedienbar, hat einen beschreibenden Linknamen und eine mindestens 44 × 44 px große Fläche. Kopfzeilen auf kleinen Displays ordnen ihre Elemente untereinander an.

## Technik und Schnittstellen

- `AssistantAvatar`: reine Darstellung mit optionalen Props `state` und `level`; standardmäßig ruhig. Kein globaler Audiozustand, keine Persistenz, keine Netzaufrufe.
- `VoiceRecorder`: zusätzlich optional `onMeter(level: number | null)`; `null` bedeutet keine laufende Aufnahme. Bestehende Aufrufer bleiben kompatibel. Der Pegel wird vor Weitergabe gerundet.
- `observePlayback`: lokale Messung der vorhandenen Audio-Wiedergabe, höchstens 20 Messungen pro Sekunde. Verbindet den Audio-Player erst mit einem laufenden AudioContext. Beendet Kontext und RAF bei Ende/Stop/Verlassen. Keine Aufzeichnung der Ausgabe.
- **Keine neuen Env-Variablen, Endpunkte, Tabellen, Cookies oder Pakete.** Infomaniak-Konfiguration und VocalLab-Adapter bleiben unverändert. Keine Server-Konfiguration oder Produktionsdateien geändert.

Referenzen: [MediaElementSource](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource), [Start der Browser-Stimme](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/start_event), [reduzierte Bewegung](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

## Prüfung

Lokale Fixtures sperren externe Requests und ersetzen API-Antworten. Das Mikrofon verwendet einen synthetischen Oszillator; für die Audioausgabe wird eine WAV-Datei im Arbeitsspeicher erzeugt. Es werden keine Mails versandt, keine Anbieter aufgerufen und keine Mitgliederdaten angelegt.

```sh
npm run test:chat
npm run test:voice
npx tsc --noEmit
npm run build
# Lokalen Produktionsbuild mit AUTH_PROVIDER=fusebase auf Port 3308 starten.
# TEST_BROWSER_PATH auf einen installierten Chromium-Browser setzen:
npm run test:chat:browser
npm run test:workspace:browser
```

Der Chat-Browsertest prüft alle vier Avatarzustände, Mikrofonpegel, echten WAV-Ausgabepegel samt Stille, reduzierte Bewegung, Stoppen/Unterbrechung, Seitenwechsel, Audio ohne Web Audio, Aufnahme/Pause/Weiter im Notizraum und die Kopfzeilen bei 320/390/1280 px. Der bestehende Navigationstest berücksichtigt jetzt den seit Phase 3 des Gehirn-Auftrags zusätzlichen Suchtreffer „Im Gehirn suchen“; keine Änderung an der Suchfunktion.

Ergebnis am 01.10.2026: 7 Chat- und 13 Voice-Tests erfolgreich; TypeScript und Produktionsbuild erfolgreich. Beide lokalen Browser-Suiten bestanden, keine JavaScript-Seitenfehler und keine Überlappung in den geprüften Kopfzeilen. Build enthält weiterhin die bereits vorhandene Trace-Warnung aus `next.config.ts` → `lib/db.ts` → Shopify; kein neuer Buildfehler.

## Späterer Handytest

1. [Staging-Sprachchat](https://trinity-stg.youareneo.com/sprechen) im Handy-Browser öffnen und anmelden. Auf die Figur tippen: Das Textfeld erhält den Fokus.
2. Aufnahme gedrückt halten und sprechen: „Hört zu“, Linien reagieren. Nach Loslassen: „Denkt“, während der Antwort: „Spricht“. Bei VocalLab folgen die Linien der Stimme; beim Browser-Rückfall bleibt die Zustandsanzeige ohne Pegelanimation.
3. „Alles stoppen“ sowie eine neue Aufnahme während der Antwort prüfen. Es darf keine alte Antwort weiterlaufen. Im Notizraum Aufnahme, Pause und Weiter prüfen.
4. Im Betriebssystem „Bewegung reduzieren“ einschalten: keine Rotation und kein Pulsieren, Zustände bleiben sichtbar.

Physische iOS-/Android-Geräte, reale Infomaniak-/Anthropic-/VocalLab-Aufrufe und die noch offene Login-Abnahme sind damit ausdrücklich nicht abgenommen. Produktion bleibt unverändert.
