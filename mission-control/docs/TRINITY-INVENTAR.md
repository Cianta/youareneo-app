# Trinity OS – Bestandsaufnahme (Teil 1)

Stand: 30.09.2026. Basis: [PR #8](https://github.com/Cianta/youareneo-app/pull/8), Commit `dfe0cabb3a986429d70cd69b947ebe8796f2cc0e`. Inventar-Branch: `codex/trinity-inventory`. Prüfumgebung: [Staging](https://trinity-stg.youareneo.com). Die Freigabe vom 30.09. erlaubt diese Bestandsaufnahme trotz noch offener Abnahme von #7/#8.

## Ergebnis und Grenzen

Die Anwendung enthält zwei unterschiedliche Datenwelten: neue, benutzergebundene Supabase-Notizen mit Spracherfassung und Hermes-Freigabe sowie ältere Browser-Stores und gemeinsame Serverdateien. Vor einer gemeinsamen Inhaltssuche oder einem Graphen müssen Eigentümerschaft und Zugriffsrechte dieser älteren Daten geklärt werden. Die mobile Dashboard-Hülle und ihre Barrierefreiheit sind das unmittelbar sichtbare Bedienproblem. Viele vermeintliche Integrationen sind konfigurierbare Link-Sammlungen oder externe Einbettungen.

Diese Bestandsaufnahme ändert ausschließlich Dokumentation. Kein Deployment, keine Änderungen an Serverkonfiguration, Datenmodell, Endpunkten, Cookies oder Anwendungscode. Produktion, Portal, n8n, Medien und externe Einstellungen bleiben unberührt. Sie ersetzt weder die Funktionsabnahme von PR #7/#8 noch einen vollständigen Sicherheits- oder Integrationstest.

**Prüftiefe:** Alle vorhandenen Seiten und API-Routen wurden im Quellcode erfasst; fünf zentrale Seiten zusätzlich mit Lighthouse auf Staging geladen. 210 Dateien aus `app`, `components`, `lib`, `public`, `types` sowie Paketdateien, Proxy und Next-Konfiguration wurden per SHA-256 mit Staging verglichen: keine Abweichung zu PR #8. Das bestätigt den geprüften Anwendungsquellstand, nicht eine vollständige Gleichheit aller Umgebungswerte oder Daten. Keine Fremddaten wurden gezielt abgefragt und keine Notizen, Aufgaben, Agenten-Aufträge oder externen Veröffentlichungen angelegt.

**Zustand in den Tabellen:** `fertig` = im Quellcode zusammenhängend implementierte, klar begrenzte Funktion; keine pauschale End-to-End-Abnahme. `halb` = funktionierender Teil mit fehlender Anbindung, Bedienung, Datentrennung oder ausstehendem Integrationstest. `kaputt` = konkreter belegbarer Widerspruch zum Staging-Betrieb. `doppelt` = überlappender Einstieg, nicht zwingend identischer Code. `tot` = nachweislich unbenutzter Rest. Nur per URL erreichbare Seiten werden als Verwaisungs-Kandidaten aufgeführt, nicht ohne Beleg als defekt bezeichnet.

**Navigation:** `Menü` bezeichnet die Sidebar; geschlossene Gruppen benötigen erst das Aufklappen. `Tools` ist das Dropdown in der TopBar mit „Alle“ und Suche. Titel in `PAGE_TITLES` allein sind keine Navigation. Frei angelegte Favoriten können zusätzliche Wege schaffen, sind aber kein verlässlicher Standard-Einstieg. `Browser-Store` bedeutet lokale Zustand-Daten (Zustand/localStorage, teils IndexedDB), ohne automatische Geräte-Synchronisierung oder Benutzer-Namespace. Die Supabase-Authentifizierung selbst verwendet Cookies, nicht localStorage.

## Seiten und Funktionen

### Zugang und schnelle Erfassung

| Funktion | Route | Wie erreicht man sie | Zustand | Datenquelle | Probleme |
|---|---|---|---|---|---|
| Start | `/` | Direkte Domain | fertig | Redirect nach /dashboard | Kein eigener Einstieg für freie Notizen; Zugriff entscheidet Zielroute. |
| Passwort-Login, Magic Link, Passwort vergessen | `/login` | Auth-Redirect, Abmelden, direkte URL | fertig | Supabase Auth; konfigurierbarer FuseBase-Rückfall | Lighthouse-Kontrastfehler; Versand und Recovery in diesem Audit nicht erneut ausgelöst. |
| Mail-Link bestätigen | `/auth/magic` | Link aus Auth-Mail | fertig | Supabase OTP/Token-Verifikation | Fehler- und abgelaufene Links vorhanden; kein frischer Mail-E2E-Test in Teil 1. |
| Passwort setzen/zurücksetzen | `/auth/password` | Einladungs-/Recovery-Ablauf | fertig | Supabase Auth | Setzen eines echten Passworts nicht Bestandteil des Nur-Lese-Audits. |
| Fehlende Produktberechtigung erklären | `/access-denied` | Redirect bei fehlendem foerder-Zugang | fertig | Supabase neo_access | Notiz-Einstieg vorhanden; Dashboard und freie Notiz haben unterschiedliche Zugangsvoraussetzungen. |
| Text/Audio aufnehmen, transkribieren, klassifizieren, Projekt zuordnen; Hermes-Aufträge freigeben | `/notiz` | Globaler Notiz-Knopf, Alt+N, Login/Zugriffshinweise | fertig | Eigene Supabase trinity_notes/trinity_projects, private Audios; Infomaniak, optional OpenAI; Anthropic; Hermes-Warteschlange | Seitenaufruf angemeldet gemessen. Aufnahme, echte Transkription und Hermes-Ausführung hier nicht ausgelöst. Kein Bestandteil der Sidebar-Aufgabennavigation. |
| PWA installieren / Handy-Hilfe | `/notiz/hilfe` | „Als App installieren“ in /notiz | fertig | Statische Anleitung + Marken-Konfiguration | Installationsprüfung auf echtem iOS/Android-Gerät steht außerhalb dieses Audits. |

### Arbeitsbereiche und Verwaltung

| Funktion | Route | Wie erreicht man sie | Zustand | Datenquelle | Probleme |
|---|---|---|---|---|---|
| Mission Control: Überblick, Kennzahlen, Agenten, Ziele | `/dashboard` | Menü → FOKUS → Mission Control | halb | /api/agents, /api/kanban, /api/memory, /api/shopify + Browser-Stores | Globale Serverdaten neben lokalen Zielen; mobile Hülle und CLS problematisch; kein einheitlicher Lade-/Fehlerzustand. |
| Eden Canvas: Boards, Karten, Medien, Cross-Publish | `/dashboard/eden` | Menü → FOKUS → Eden Canvas | halb | Browser-Store/localStorage; /api/meta, /api/agents; Upload-Stub | Kein Cloud-Upload über lib/storage.ts; Data-URL-Fallback; sichtbarer Besitzername ersetzt keine Autorisierung. |
| Aufgaben: Kanban, Trello-Einstieg, Archiv | `/dashboard/vision/tasks` | Menü → FOKUS → Tasks | halb | Projekt-Boards im Browser-Store; daneben /api/kanban für Übersicht | Zwei Aufgaben-Datenmodelle; API-Fehler werden teils verschluckt; mobile Bedienung eingeschränkt. |
| Notebooks, Gedanken, Ziele, Journal, Tool-Sammlung | `/dashboard/kanban` | Menü → IDENTITÄT → Notebooks | halb | Browser-Stores für Notebooks/Ziele und AppLauncher | Route heißt Kanban, eigentliche Aufgaben unter /vision/tasks; Checkboxes/Selects ohne Namen; Überschneidung mit rechter Notebook-Leiste und /notiz. |
| Self: Identität, Lebensbereiche, Ziele und Integrationen | `/dashboard/vision/hero` | Menü → IDENTITÄT → Self | halb | IndexedDB/Self-Store, lokale Ziele, /api/integrations | Umfangreiche lokale Daten ohne Kontentrennung/Synchronisierung; Integrationen nicht live verifiziert. |
| Verein/Company: Profil und Organisationsziele | `/dashboard/vision/verein` | Menü → ORGANISATION → Verein | halb | IndexedDB/Company-Store + lokale Ziele | Organisation ist kein durchgängiges serverseitiges Berechtigungsmodell. |
| Team/Ninjas, Personenprofile und Astro-Berechnung | `/dashboard/ninjas` | Menü → ORGANISATION → Team; Dashboard-Link | halb | Browser-Store; /api/astro; /api/kanban | Personen-/Geburtsdaten lokal; keine belegte nutzergebundene Graph-Datenquelle. |
| Digital Staff: Agenten und Workflow-Ansicht | `/dashboard/agents/agent-overview` | Menü → ORGANISATION → Digital Staff | halb | Agenten-/Workflow-Stores, Agenten-Chat-API | Überschneidung mit Agenten-Liste; Provider/Workflow-Ausführung nicht getestet. |
| Ältere Agenten-Liste und Chat-Einstieg | `/dashboard/agents` | Nur URL im Standard-Routenbestand | doppelt | Agenten-Store + Chat-API | Kein regulärer Menüeintrag; überlappt Digital Staff und Dashboard-Agentenkarten. |
| Agenten-Detail/Terminal/Chat | `/dashboard/agents/[id]` | Agentenkarte im Dashboard; dynamische ID | halb | Agenten-Store, lokale Chat-Historie, /api/agents/[id]/chat | Modelle und gemeinsame Dateispeicherung; kein kostenpflichtiger Chat-Test. |
| Data Hub: Links, Ablage-Einstiege, Universe | `/dashboard/data` | Menü → DATA | halb | Lokaler DataHub-Store; /api/launch | Link-/Programm-Sammlung, keine zentrale eigene Datensuche; Mac-Programmstart auf VPS ungeeignet. |
| Cloud Drives: Drive/KDrive und eigene Quellen | `/dashboard/data/cloud-drives` | Tools → Cloud Drives | halb | Iframe-Ziele und React-State | Zusätzlich erfasste Laufwerke nicht dauerhaft synchronisiert; eingebettete Anmeldung providerabhängig. |
| Universe: Obsidian, Notion, Docmost, Memory | `/dashboard/universe` | Link in Data Hub | halb | /api/universe; Serverdateien, Notion-Anbindung, MemoryBrowser | Kein neuer Second-Brain-Graph; alte gemeinsame Daten statt eigener Supabase-Notizen. |
| Memory Browser: Suche, Einträge, Bearbeitung | `/dashboard/memory` | Nur URL im Standard-Routenbestand; Komponente auch in Universe | doppelt | /api/memory, gemeinsame Serverdatei | Kein eigener Menüeintrag; keine user_id-Trennung im Dateimodell. |
| Matrix: Karten/Links | `/dashboard/matrix` | Menü → MATRIX | halb | localStorage trinity-matrix-cards | Lokale Startkarten, keine zentrale Integration; Überschneidung mit altem Matrix-Center. |
| Space Weather | `/dashboard/matrix/space-weather` | Matrix-Standardkarte | halb | NOAA per Iframe/Proxy | Externe Einbettung; Funktion hinter Proxy nicht abgenommen. |
| Morphreader Nachrichten | `/dashboard/matrix/morphreader` | Nur URL im Standard-Routenbestand | halb | SEED_ARTICLES im Code | Demo-Daten; Refresh mischt Beispielartikel nach Timer; Links teils #; kein echtes Feed-Backend. |
| n8n-Einstieg | `/dashboard/matrix/n8n` | Tools → n8n | halb | Iframe, NEXT_PUBLIC_N8N_URL | Fallback localhost:5678 zeigt auf Endgerät, nicht VPS; konfigurierte Fremdanwendung nicht geprüft oder geändert. |
| Älteres Matrix-Center | `/dashboard/vision/matrix-center` | Nur URL im Standard-Routenbestand | doppelt | NOAA/Morphreader-Iframes | Zweiter Matrix-Einstieg ohne reguläre Navigation. |
| Meditation: Playlists, Audios, Hintergründe | `/dashboard/meditation` | Menü → MEDITATION | halb | Browser-Store, Data-URLs, GlobalAudioPlayer; lokaler Stream-Endpunkt | Upload-Adapter ist Stub; keine belegte Cloud-Sicherung; große lokale Medien möglich. |
| Einstellungen und serverseitiger Env-Editor | `/dashboard/settings` | Menü → SYSTEM CONTROL → Settings | halb | Lokale Präferenzen; /api/settings/env → .env.local | Kein eigener Admin-Check am Env-Endpunkt; schreibt andere Datei als Staging-.env. P0 vor breiter Nutzung. |
| Benachrichtigungen/Updates | `/dashboard/updates` | Menü → SYSTEM CONTROL → Updates; Glocke | halb | Lokaler Notification-Store | Keine durchgängige serverseitige Ereignisquelle; englische Texte. |

### Kommunikation, Kontakte und externe Einbettungen

| Funktion | Route | Wie erreicht man sie | Zustand | Datenquelle | Probleme |
|---|---|---|---|---|---|
| Universal Inbox / E-Mail | `/dashboard/communication/email` | Menü → COMMUNICATION → Universal Inbox → Email | halb | /api/gmail/threads Cache; Gmail/KMail-Iframes; lokale Konten | Bis zu drei Klicks; Cache statt Live-Synchronisierung; gemeinsame Cache-Datei ohne Nutzertrennung. |
| kChat | `/dashboard/communication/kchat` | Menü → COMMUNICATION → Universal Inbox → kChat | halb | Iframe, NEXT_PUBLIC_KCHAT_URL | Standard leer; Konto/Frame-Freigabe nicht verifiziert. |
| Telegram | `/dashboard/communication/telegram` | Menü → COMMUNICATION → Universal Inbox → Telegram | halb | Externer Dienst über IframeView | Bekannt blockiertes Iframe: zeigt Ausweichlink; keine native Inbox. |
| WhatsApp | `/dashboard/communication/whatsapp` | Menü → COMMUNICATION → Universal Inbox → WhatsApp | halb | Externer Dienst über IframeView | Bekannt blockiertes Iframe: zeigt Ausweichlink; keine native Inbox. |
| Dateitransfer | `/dashboard/communication/data-transfer` | Menü → COMMUNICATION → Universal Inbox → Data Transfer | halb | SwissTransfer/WeTransfer über IframeView/Proxy | SwissTransfer wird extern geöffnet; kein nativer Upload-Speicher. |
| GoHighLevel | `/dashboard/mitglieder/ghl` | Menü → CONTACTS → GoHighLevel | fertig | Externer Dienst / URL-Konfiguration | Explizite externe Login-/Dashboard-Links; keine native CRM-Funktion. |
| Lunacal | `/dashboard/mitglieder/lunacal` | Menü → CONTACTS → Lunacal | halb | Externer Dienst / URL-Konfiguration | Iframe + externer Login, keine Abnahme des Termindienstes. |
| Riverside | `/dashboard/mitglieder/riverside` | Menü → CONTACTS → Riverside | halb | Externer Dienst / URL-Konfiguration | Iframe + externer Login, keine Abnahme der Aufnahmefunktion. |
| kMeet | `/dashboard/mitglieder/kmeet` | Menü → CONTACTS → kMeet | halb | Externer Dienst / URL-Konfiguration | URL standardmäßig leer; Konfiguration und Provider-Anmeldung erforderlich. |
| GoBrunch | `/dashboard/mitglieder/gobrunch` | Menü → CONTACTS → GoBrunch | halb | Externer Dienst / URL-Konfiguration | Provider-Frame/Proxy abhängig; keine Abnahme des Raums. |
| Arche/Memberspot | `/dashboard/world/arche` | Menü → WORLD VISION → Arche | halb | Memberspot, extern | Iframe blockiert, Ausweichlink; Memberspot gehört nicht zu diesem Umbau. |
| Apollo | `/dashboard/seo/apollo` | Tools → Apollo | halb | Externer Apollo-Iframe/Proxy | Keine native Lead-Datenquelle; Anmeldung nicht geprüft. |
| Postiz | `/dashboard/social/postiz` | Tools → Postiz | halb | Iframe, NEXT_PUBLIC_POSTIZ_URL | Fallback localhost:5000 ist auf Staging kein nutzbarer VPS-Zielnachweis. |
| Gemma | `/dashboard/media/video/gemma` | Nur URL im Standard-Routenbestand | halb | Google Gemma-Webseite | IframeView kennt Blockierung; Ausweichlink statt Video-/Modell-Integration. |
| NotebookLM | `/dashboard/kanban/notebooklm` | Nur URL im Standard-Routenbestand | doppelt | Externe NotebookLM-Seite | Iframe blockiert; paralleler NotebookLM-Link im Notebook-Launcher möglich. |
| Open Notebook | `/dashboard/kanban/opennotebook` | Nur URL im Standard-Routenbestand | halb | Iframe, URL-Konfiguration | Externe Web-App, kein eigener Notizspeicher; englische Konfigurationshinweise. |

### Tool-Sammlungen, Medien und Veröffentlichung

| Funktion | Route | Wie erreicht man sie | Zustand | Datenquelle | Probleme |
|---|---|---|---|---|---|
| Audio-Links/Programme | `/dashboard/media/audio` | Menü → MEDIA STUDIO → Audio | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Audio-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| ElevenLabs-Links/Programme | `/dashboard/media/audio/elevenlabs` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native ElevenLabs-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Flow Music-Links/Programme | `/dashboard/media/audio/flowmusic` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Flow Music-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Stitch-Links/Programme | `/dashboard/media/audio/stitch` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Stitch-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Unmixr-Links/Programme | `/dashboard/media/audio/unmixr` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Unmixr-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Boards-Links/Programme | `/dashboard/media/boards` | Menü → MEDIA STUDIO → Boards | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Boards-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Design-Links/Programme | `/dashboard/media/design` | Menü → MEDIA STUDIO → Design | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Design-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Google Docs / Design-Links/Programme | `/dashboard/media/design/googledocs` | Tools | halb | AppLauncher, lokaler Launcher-Store | Titel „Design“, eigener Store-Schlüssel neben Design-Hauptseite; doppelte Idee, keine Google-Docs-API. |
| Documents-Links/Programme | `/dashboard/media/documents` | Menü → MEDIA STUDIO → Documents | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Documents-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Gemini-Links/Programme | `/dashboard/media/gemini` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Gemini-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Higgsfield-Links/Programme | `/dashboard/media/higgsfield` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Higgsfield-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Magicfit-Links/Programme | `/dashboard/media/magicfit` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Magicfit-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Video-Links/Programme | `/dashboard/media/video` | Menü → MEDIA STUDIO → Video | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Video-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Antigravity-Links/Programme | `/dashboard/media/video/antigravity` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Antigravity-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Google AI Studio-Links/Programme | `/dashboard/media/video/gai-studio` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Google AI Studio-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Immich-Links/Programme | `/dashboard/media/video/immich` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Immich-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Motionvid-Links/Programme | `/dashboard/media/video/motionvid` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Motionvid-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Gamma-Links/Programme | `/dashboard/world/gamma` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Gamma-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Miro-Links/Programme | `/dashboard/world/miro` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Miro-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Padlet-Links/Programme | `/dashboard/world/padlet` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Padlet-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Presenti-Links/Programme | `/dashboard/world/presenti` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Presenti-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Wakelet-Links/Programme | `/dashboard/world/wakelet` | Tools | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Wakelet-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Marketing-Links/Programme | `/dashboard/social/marketing` | Menü → WORLD VISION → Social Media → Marketing | halb | AppLauncher, lokaler Launcher-Store | Web-Links konfigurierbar; keine native Marketing-Integration. Programmstart nur für lokalen Mac-Server geeignet. |
| Strategie und Tool-Sammlung | `/dashboard/social/strategie` | Menü → WORLD VISION → Social Media → Strategie | halb | Lokaler Strategie-Store + AppLauncher | Strategie bleibt im Browser; keine gemeinsame eigene Suchquelle. |
| Channels Hub | `/dashboard/social/channels` | Menü → WORLD VISION → Social Media → Channels Hub | halb | Lokaler Channels-Store und externe Links | Kein vereinheitlichtes Publishing-/Kontenmodell. |
| Älteres Media Studio: TTS/Podcast | `/dashboard/media` | Nur URL im Standard-Routenbestand | doppelt | /api/media/tts, OpenAI/ElevenLabs | Überlappt Launcher-Hierarchie; nicht die freizugebende Sprach-Phase 2 mit VocalLab. |
| SEO: Recherche, Artikel, Publish | `/dashboard/seo` | Tools → SEO | halb | SEOModule, /api/seo, optionale SERP-/Modell-Anbieter | Kostenpflichtige/externe Aktionen nicht ausgelöst; gemeinsame Alt-Daten beachten. |
| Shopify: Entwürfe, Generierung, Publish | `/dashboard/shopify` | Menü → WORLD VISION → Shopify | halb | /api/shopify, gemeinsame Entwürfe, Shopify-API | Veröffentlichen ist externe Schreibaktion; nicht getestet; Nutzertrennung fehlt im lokalen Entwurfsmodell. |

Die AppLauncher-Seiten sind nach ihrer heutigen Funktion bewertet: editierbare Lesezeichen und Programm-Verknüpfungen. Ein Produktname in der Navigation bedeutet hier keine fertige API-Integration. `halb` bezieht sich insbesondere auf den untauglichen Mac-Programmstart vom Linux-Staging und die rein lokale Datenhaltung; Web-Links können trotzdem vollständig nutzbar sein.

### Globale Funktionen und zusätzliche Ressourcen

| Funktion | Route | Wie erreicht man sie | Zustand | Datenquelle | Probleme |
|---|---|---|---|---|---|
| Sidebar und Tools-Suche | alle /dashboard-Seiten | Sidebar, TopBar | halb | Statische Routen + lokale Favoriten/DataHub | Keine globale Inhaltssuche oder ⌘K-Palette; technische statt aufgabenbezogene Gruppen; tiefe Untermenüs. |
| Daily Notebook, Ziele, Journal, Fokus-Timer | alle /dashboard-Seiten | Rechte Seitenleiste | halb | Browser-Stores | Überlappt Notebooks; nicht mobil eingeklappt; verdrängt Hauptinhalt und verursacht Layout-Verschiebungen. |
| Schwebender Agent, Chat und Completion-Dialog | alle /dashboard-Seiten | Globale Widgets | halb | Agenten-/Chat-Stores und Agenten-API | Immer in Client-Layout importiert; zusätzliche UI und JS auch ohne Nutzung. |
| Globaler Audio-Player | alle /dashboard-Seiten | Player / Meditation | halb | Lokaler Audio-Store | Teil der gemeinsamen Client-Hülle, kein eigener Cloud-Medienbestand. |
| Notiz-Knopf und Alt+N | global | Schwebender Knopf / Tastatur | fertig | Navigation nach /notiz | Kein umfassender Hilfe-Dialog oder vereinheitlichtes Kürzelsystem. |
| PWA-Manifest | /manifest.webmanifest | Browser-Installation | fertig | Marken-Konfiguration | Technische Ressource; kein eigener Bildschirm. |
| Service Worker | /sw.js | Automatisch auf Notiz-Einstieg | fertig | Statische Offline-/Icon-Ressourcen | Kein allgemeiner Offline-Modus für Dashboard-/Serverdaten; echter Handy-Test separat. |
| Gehirn, Inhaltspalette, Erststart-Assistent | /gehirn (noch nicht vorhanden) | Noch nicht erreichbar | halb | Geplant in Teil 2/3 | Keine vorhandene Implementierung; ausdrücklich nicht Bestandteil dieses PRs. |

## API-Inventar

Diese Zeilen beschreiben den Quellcode, nicht erfolgreich ausgeführte Schreibtests. Alte APIs werden durch den Dashboard-Proxy auf Anmeldung/Produktzugang begrenzt; das ersetzt keine Datentrennung nach Benutzer oder einen Admin-Check. Neue Notiz-/Voice-/Hermes-/Provision-Routen besitzen eigene Prüfungen. Die regulären Aufrufe beim Laden der fünf Messseiten wurden zugelassen; sensible Verwaltungs-, Mail-, Publish- und Modellaktionen wurden nicht ausgelöst.

| Funktion | Route | Wie erreicht man sie | Zustand | Datenquelle | Probleme |
|---|---|---|---|---|---|
| Agenten lesen/anlegen (GET/POST) | `/api/agents` | Dashboard/Digital Staff | halb | Datei-DB und Provider-Ping | Gemeinsame Agentenkonfiguration statt Nutzer-Namespace. |
| Agenten-Chat (POST) | `/api/agents/[id]/chat` | Agentenansicht/Widget | halb | Modell-Provider, lokale Memory/Status-Dateien | Schreib-/Kostenaktion; nicht ausgeführt; Isolation vor Inhaltsindex prüfen. |
| Astro-Berechnung (POST) | `/api/astro` | Ninjas | fertig | Serverberechnung, Nominatim-Geocoding | Kein Astro-/Geocoding-E2E-Test; Geburtsdaten beachten. |
| Passwort-Login (POST) | `/api/auth/login` | Loginformular | fertig | Supabase Auth / Legacy-Rückfall | Eigener Endpunkt bleibt erhalten; Passwort nicht angefordert. |
| Abmelden (POST) | `/api/auth/logout` | TopBar/Loginablauf | fertig | Supabase Sitzung / Legacy | Browser-Fachdaten aus älteren Stores sind vom Auth-Cookie getrennt und bleiben bestehen. |
| Magic-Link verifizieren (GET/POST) | `/api/auth/magic` | Auth-Bestätigungsseite | fertig | Supabase OTP / Legacy | Im Audit für mailfreie Test-Sitzung verwendet, kein Versandnachweis. |
| Magic Link anfordern (POST) | `/api/auth/magic-link` | Loginformular | fertig | Supabase SMTP / Legacy | Mailversand in diesem Audit nicht ausgelöst. |
| Aktuelle Identität/Zugang (GET) | `/api/auth/me` | Layout/Notiz/Auth | fertig | Supabase Auth + neo_access / Legacy | Im Audit angemeldeten foerder-Zugang bestätigt; zusätzliche Prüfung neben Proxy/Layout. |
| Passwort setzen (POST) | `/api/auth/password` | Passwortseite | fertig | Supabase; Alias der Passwort-Behandlung | Keine Passwortmutation im Audit. |
| Recovery anfordern / Passwort setzen (POST) | `/api/auth/password-restore` | Login/Recovery | fertig | Supabase Auth / Legacy | Versand und vollständiger Recovery-Ablauf nicht erneut geprüft. |
| Mail-Cache (GET/POST) | `/api/gmail/threads` | GmailInbox | halb | Serverdatei .cache/gmail-threads.json | Keine Live-Gmail-Synchronisierung; gemeinsamer Cache ohne Benutzerzuordnung. |
| Hermes-Aufträge abholen/aktualisieren (GET/PATCH) | `/api/hermes/queue` | Hermes-Worker per Token | fertig | Supabase Hermes-Warteschlange | Freigabegrenze implementiert; Worker-Ausführung nicht getestet. |
| Kalender importieren (GET) | `/api/ical` | Kalender-/Profil-Komponenten | halb | Externe ICS-URL | URL-Abruf und Fehlerfälle nicht live getestet. |
| Todoist/Trello-Aktionen (POST) | `/api/integrations` | Profil-/Aufgabenintegration | halb | Externer Dienst, übergebener Token | Keine externe Mutation oder Tokenabfrage im Audit. |
| Altes Aufgabenmodell (GET/POST) | `/api/kanban` | Dashboard/Tasks/Team | halb | Gemeinsame JSON-Datei | Nicht dasselbe Modell wie lokale Projekt-Boards; keine user_id-Isolation. |
| Alte Aufgabe lesen/ändern/löschen (GET/PATCH/DELETE) | `/api/kanban/[id]` | Kanban-Integration | halb | Gemeinsame JSON-Datei | Besitzprüfung nicht durch Anzeige-Namen ersetzen. |
| Mac-Programm starten (POST) | `/api/launch` | AppLauncher/Data Hub | kaputt | Serverprozess execFile(open) | Linux-VPS kann kein Programm auf dem Mac des Nutzers öffnen. |
| Ältere Sprachausgabe (POST) | `/api/media/tts` | Altes Media Studio | halb | ElevenLabs/OpenAI | Nicht die geplante VocalLab-Anbindung; keine Phase-2-Arbeit hier. |
| Audio streamen (GET) | `/api/meditation/stream/[filename]` | Meditations-Audio-URL | halb | uploads/meditation auf Server | Dateiname statt nutzergebundener Medienzeile; Verfügbarkeit nicht geprüft. |
| Memory CRUD (GET/POST/DELETE) | `/api/memory` | MemoryBrowser/Universe | halb | Gemeinsame Datei-DB | Keine user_id-Isolation; nicht für gemeinsame Palette/Graph übernehmen. |
| Link-Metadaten (GET) | `/api/meta` | AppLauncher/Eden | halb | Externe URL | Serverseitiger URL-Abruf: Zielgrenzen gesondert prüfen. |
| Ältere Notiz-API (GET/POST) | `/api/notebook` | Technischer Alt-Endpunkt | halb | Gemeinsame Datei-DB | Parallel zu lokalen Notebook-Stores und neuer /api/notes; aktive Verbraucher separat entscheiden. |
| Eigene Notizen lesen/speichern (GET/POST) | `/api/notes` | /notiz | fertig | Supabase trinity_notes mit Nutzerbindung/RLS | Geeignete neue Quelle; tatsächliches Speichern nicht Gegenstand der Messung. |
| Privates Notiz-Audio (GET) | `/api/notes/[id]/audio` | Notiz-Wiedergabe | fertig | Privater Supabase-Speicher + Notizbesitz | Kein Audio geladen oder exportiert. |
| Eigene Projekte (GET/POST) | `/api/notes/projects` | /notiz | fertig | Supabase trinity_projects mit RLS | Nicht automatisch dieselben Projekte wie lokale Projekt-Boards. |
| Hermes-Aufträge prüfen/freigeben (GET/PATCH) | `/api/notes/queue` | /notiz Freigabeliste | fertig | Eigene Supabase Warteschlangen-Zeilen | Freigaben nicht verändert; keine Worker-Ausführung im Audit. |
| Mitglied still anlegen (POST) | `/api/provision/member` | Autorisierte Provision-Schnittstelle | fertig | Supabase Auth + neo_access | Idempotenz implementiert; kein Provision-Aufruf, kein Versand in Teil 1. |
| Produktzugang entziehen (POST) | `/api/provision/member/revoke` | Autorisierte Provision-Schnittstelle | fertig | Supabase neo_access | Keine Zugangsänderung im Audit. |
| Make-kompatibler Provision-Alias (POST) | `/api/provision/foerder` | Bestehender Make-Aufrufer | fertig | Member-Implementierung / Legacy-Rückfall | Alias beibehalten; Make nicht angefasst. |
| Kompatibler Revoke-Alias (POST) | `/api/provision/foerder/revoke` | Bestehender Aufrufer | fertig | Member-Revoke / Legacy-Rückfall | Kein Widerrufstest in Teil 1. |
| Iframe-Proxy (GET/POST/OPTIONS) | `/api/proxy` | IframeView | halb | Externe Webseiten | Verändert Frame-Schutzheader; Auth-Grenzen und zulässige URL-Ziele vor Ausbau prüfen. |
| Iframe-Diagnose (GET) | `/api/proxy/test` | IframeView-Diagnostik | halb | Remote-Header | Kein Vollnachweis für funktionierende Fremd-Anmeldung. |
| Älterer GHL-Tunnel (GET/POST/PUT/PATCH/OPTIONS) | `/api/proxy/ghl/[...path]` | Technischer Alt-Endpunkt | halb | GHL-Webseite | Aktuelle GHL-Seite verwendet externe Links; Kandidat für spätere Stilllegung, nicht gelöscht. |
| SEO-/Inhaltsaktionen (POST) | `/api/seo` | SEOModule | halb | SERP-/Modell-Anbieter | Schlüssel und kostenpflichtige Aktionen nicht geprüft. |
| Server-Konfiguration lesen/schreiben (GET/POST) | `/api/settings/env` | Settings | halb | Serverdatei .env.local | P0: kein Admin-Check; Nutzer darf dort beliebige Schlüssel schreiben. Laufzeitwirkung und Schreibbarkeit nicht getestet. |
| Entwürfe/Generierung/Veröffentlichung (GET/POST) | `/api/shopify` | ShopifyHub/Dashboard | halb | Gemeinsame Datei-DB + Shopify/Modelle | Entwürfe ohne Benutzertrennung; externe Veröffentlichungen nicht ausgelöst. |
| Universe lesen/schreiben (GET/POST) | `/api/universe` | UniverseView | halb | Dateien + Notion/Obsidian-Anbindung | Alte gemeinsame Quelle; nicht automatisch eigene Graph-Knoten. |
| Voice-Konfiguration/Limits (GET) | `/api/voice/config` | /notiz | fertig | Server-Konfiguration + eigene Nutzung | Bereitschaftsanzeige ersetzt keine echte Transkription. |
| Sprachnotiz transkribieren (POST) | `/api/voice/transcribe` | /notiz Mikrofon/Upload | fertig | Infomaniak AI Services; optional OpenAI | Infomaniak ist Standard; kein Amical-Serverprovider. Kostenpflichtige Transkription in Teil 1 nicht ausgeführt. |
| Notiz strukturieren (POST) | `/api/voice/classify` | /notiz | fertig | Anthropic + eigene Notizvorschläge | Modellantwort nicht in diesem Audit erzeugt. |

## Lighthouse, JavaScript und Konsole

### Messverfahren und Vergleichbarkeit

Auswahl der fünf wichtigsten Einstiege: Login (Zugang), Notiz (neuer mobiler Kern), Dashboard (Start), Tasks (tägliche Arbeit), Notebooks (bestehende Wissens-/Notizarbeit). Diese Auswahl ist die vorgeschlagene feste Messgruppe für Teil 2. `/gehirn` kommt erst in Teil 3 hinzu und ersetzt keine dieser Seiten.

Lighthouse **13.5.0**, Navigation-Modus, isolierter Headless-Brave/Chromium-Browser ohne Erweiterungen, mobiler Viewport **412 × 823**, DPR **1,75**, simuliertes Netz **150 ms RTT / 1.638,4 kbit/s**, **4× CPU-Verlangsamung**. Pro Seite ein maßgeblicher Lauf am 30.09.2026; vor jeder Navigation explizit `Network.clearBrowserCache`. Auth-Cookies und lokaler UI-Zustand bleiben erhalten (`disableStorageReset: true`). Dies ist ein Vergleich von Seitenaufrufen mit kaltem HTTP-Cache, kein vollständiger Erstbesuch mit leerem Anwendungszustand und keine Messung auf echter Handy-Hardware. Ergebnisse können schwanken; noch keine Medianwerte aus drei Läufen und keine Felddaten.

Die Messung nutzte das vorhandene freigegebene Testkonto mit bestätigtem `hasTrinityAccess`. Dafür wurde ohne Mailversand eine kurzlebige Magic-Link-Anmeldung erzeugt und über den normalen App-Endpunkt verifiziert. Cookie nur im isolierten Browser/Prozessspeicher; Audit-Sitzung anschließend abgemeldet. Keine Zugangswerte oder Auth-Links in den Messdateien. Der angemeldete Zugriff funktioniert jetzt im geprüften Zustand; die frühere Anon-Key-Blockade aus der PR-8-Beschreibung wurde bei dieser Messung nicht mehr beobachtet. Die Login-Seite blieb trotz vorhandener Sitzung auf `/login`; alle übrigen gemessenen Ziel-URLs blieben ebenfalls erhalten, also keine als Dashboard ausgegebenen Login-Redirects. Dieser technische Zugang ist **kein Nachweis eines zugestellten Magic Links**.

Ein vorbereitender Lauf mit gemeinsamem warm werdendem Cache ergab Performance 95/100/85/86/85. Wegen der unterschiedlichen Cache-Wärme ist er nicht die Vergleichsbasis. Ein weiterer kalter Kontrolllauf ohne Konsolen-Audit ergab 96/97/75/75/77. Die folgende Tabelle verwendet ausschließlich den abschließenden vollständigen Lauf mit jeweils geleertem HTTP-Cache und Konsolen-Audit; die Schwankung bleibt sichtbar dokumentiert. Es gab dort keine Lighthouse-Laufwarnungen oder Laufabbrüche. Die Kategorien Performance und Accessibility wurden um Best Practices ergänzt, damit `errors-in-console` tatsächlich ausgeführt wird; dessen Kategorie-Score ist hier nicht Zielgröße.

| Seite | Performance | Barrierefreiheit | LCP | CLS | TBT | JS übertragen / entpackt | Konsolenfehler | Messzeit UTC / Beleg |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `/login` | 94 | 94 | 2.90 s | 0.000 | 13.0 ms | 150.0 / 517.2 KiB | 1 | [03:41:30](audits/2026-09-30/login.json) |
| `/notiz` | 96 | 100 | 2.76 s | 0.011 | 2.0 ms | 154.6 / 532.3 KiB | 0 | [03:41:37](audits/2026-09-30/notiz.json) |
| `/dashboard` | 73 | 85 | 3.61 s | 0.280 | 77.0 ms | 273.6 / 927.3 KiB | 0 | [03:41:43](audits/2026-09-30/dashboard.json) |
| `/dashboard/vision/tasks` | 76 | 82 | 3.76 s | 0.258 | 42.0 ms | 303.1 / 1024.4 KiB | 0 | [03:42:48](audits/2026-09-30/dashboard-vision-tasks.json) |
| `/dashboard/kanban` | 75 | 80 | 3.66 s | 0.295 | 24.5 ms | 270.7 / 912.6 KiB | 0 | [03:42:55](audits/2026-09-30/dashboard-kanban.json) |

Ziel aus dem Auftrag: Performance ≥ 90, Barrierefreiheit ≥ 95. `/notiz` erreicht beide im gemessenen Zustand. `/login` verfehlt Barrierefreiheit knapp; alle drei Dashboard-Seiten verfehlen beide Ziele. Ein Konsolenfehler beim Login: **GET /favicon.ico → 404**, ein fehlendes Browser-Icon. Auf den übrigen vier Seiten meldet der Audit keine Konsolenfehler. Diese Aussage gilt ausschließlich für diese fünf Seiten beim Laden, einschließlich ihrer Hintergrundabfragen während des Audits. Es beweist weder fehlerfreie externe Iframes noch alle Klick-, Aufnahme-, Freigabe- und Fehlerpfade. Konsolenwarnungen wurden nicht als eigener Vollbestand erhoben.

### Konkrete Lighthouse-Befunde

- **Login:** zusätzlich fehlendes `/favicon.ico` (404); drei Kontrast-Verstöße (`color-contrast`). Textfarben und Hintergrundkombinationen korrigieren, ohne die Marken-Konfiguration zu umgehen.
- **Dashboard:** 19 Buttons ohne zugänglichen Namen, zwei unbeschriftete Selects, vier Zielgrößen-Verstöße.
- **Tasks:** 21 Buttons ohne zugänglichen Namen, ein unbeschriftetes Select, vier Zielgrößen-Verstöße.
- **Notebooks:** 21 Buttons ohne zugänglichen Namen, drei unbeschriftete Inputs, zwei unbeschriftete Selects, vier Zielgrößen-Verstöße.
- **Mobile Hülle:** Lighthouse findet unter anderem Sidebar-Buttons mit **11 × 11 px**. Bereits die automatische Mindestprüfung schlägt fehl; der Auftrag verlangt **44 px**. Bei 412 px Viewport beanspruchen linke Leiste (ca. 212 px) und rechte Notebook-Leiste (248 px) zusammen mehr als die verfügbare Breite. In den Audit-Knoten wird der zentrale Flex-Bereich teilweise mit **0 px Breite** ausgewiesen. Die Leisten/ihre Animationen erscheinen zugleich als Verursacher von Layout-Verschiebungen. Das ist vor zusätzlichen Navigationsfunktionen zu beheben.
- **Tempo:** Dashboard-LCP etwa 3,6–3,8 s und CLS über 0,25; Total Blocking Time bleibt in diesen Läufen unter 80 ms. Die aktuellen Scores rechtfertigen zuerst Arbeit an Layout-Stabilität, kritischem Rendering und der gemeinsamen Hülle. Mehr Code-Splitting allein löst die gemessenen Probleme nicht.
- Lighthouse schätzt ungenutztes JavaScript auf rund 22–28 KiB je Seite. `bf-cache` wird unter anderem durch `no-store` begrenzt; private Daten nicht pauschal öffentlich cachen, nur um diesen Hinweis zu beseitigen.

Die beigefügten JSON-Dateien sind bewusst reduzierte Messauszüge: Score, Zeiten, Netzgrößen, Selektoren und Rechtecke. Keine Cookies, Header, vollständigen DOM-Texte, Benutzernamen, Screenshots oder Auth-Tokens. Es sind keine vollständigen Lighthouse-HTML-Berichte.

### Größte geladene JS-Chunks

Vereinigungsmenge der fünf Seiten, sortiert nach entpackter `resourceSize`; Größen aus Lighthouse `network-requests`. Übertragen enthält HTTP-Overhead und vorhandene Kompression, ist also nicht mit einem lokal berechneten gzip-Wert gleichzusetzen. Die Tabelle beschreibt tatsächlich geladene Chunks dieser Seiten, nicht alle unbesuchten Routen im Build. Ein minimierter Chunk ist ohne Sourcemap kein sauberer Nachweis für die Größe einer einzelnen Bibliothek.

| Chunk unter /_next/static/chunks/ | Entpackt | Max. übertragen je Lauf | Auf welchen Messseiten geladen |
|---|---:|---:|---|
| `3n7dm2ojtyzwn.js` | 222.2 KiB | 69.5 KiB | `/login`, `/notiz`, `/dashboard`, `/dashboard/vision/tasks`, `/dashboard/kanban` |
| `3uk0xdwl2pc8u.js` | 171.9 KiB | 47.0 KiB | `/dashboard`, `/dashboard/vision/tasks`, `/dashboard/kanban` |
| `153mnvfs8r8kg.js` | 134.8 KiB | 36.8 KiB | `/login`, `/notiz`, `/dashboard`, `/dashboard/vision/tasks`, `/dashboard/kanban` |
| `2l_-zqz2rpltv.js` | 107.8 KiB | 30.8 KiB | `/dashboard/vision/tasks` |
| `3aysnek4g3gku.js` | 106.3 KiB | 34.7 KiB | `/dashboard`, `/dashboard/vision/tasks`, `/dashboard/kanban` |
| `031d4hdncmqdj.js` | 53.4 KiB | 12.6 KiB | `/login`, `/notiz`, `/dashboard`, `/dashboard/vision/tasks`, `/dashboard/kanban` |
| `2c0_95xj5r5b6.js` | 49.3 KiB | 18.2 KiB | `/dashboard`, `/dashboard/vision/tasks`, `/dashboard/kanban` |
| `27jktro2p5rq9.js` | 43.4 KiB | 9.1 KiB | `/login`, `/notiz`, `/dashboard`, `/dashboard/vision/tasks`, `/dashboard/kanban` |
| `0yotq23524use.js` | 33.7 KiB | 10.3 KiB | `/dashboard`, `/dashboard/vision/tasks`, `/dashboard/kanban` |
| `36rzp1jknty1r.js` | 31.8 KiB | 8.2 KiB | `/dashboard` |

**Quellcode zur Bundle-Einordnung:** [Dashboard-Layout](../app/dashboard/layout.tsx) ist eine Client-Komponente und importiert Sidebar, TopBar, NotebookPanel, FloatingAgentWidget, GlobalAudioPlayer und CompletionDialog direkt. [Root-Layout](../app/layout.tsx) lädt vier Schriftfamilien und den globalen VoiceLauncher. In `app/` und `components/` wurden keine expliziten `next/dynamic`- oder `React.lazy`-Aufrufe gefunden; Nexts automatische Routenaufteilung besteht trotzdem. Große Seiten wie Eden und Agent Overview sind umfangreiche Client-Komponenten. Daraus folgt als überprüfbare Hypothese: selten benutzte Widgets/Editor-/Audio-Teile aus dem gemeinsamen Einstieg lösen, anschließend dieselben fünf Seiten erneut messen. Keine Bibliothek wurde entfernt oder hinzugefügt.

## Tote, verwaiste und doppelte Einstiege

**Nur per URL / Verwaisungs-Kandidaten:** `/dashboard/agents`, `/dashboard/memory`, `/dashboard/media`, `/dashboard/kanban/notebooklm`, `/dashboard/kanban/opennotebook`, `/dashboard/matrix/morphreader`, `/dashboard/media/video/gemma`, `/dashboard/vision/matrix-center`. Für diese Routen wurde kein regulärer eingehender Menü-/Seitenlink im Quellbestand gefunden. Ein Titelregister-Eintrag in der TopBar ist kein solcher Link. Individuelle Favoriten oder externe Bookmarks sind unbekannt. Deshalb keine dieser Seiten gelöscht oder pauschal als funktionslos eingestuft.

**Überlappungen:**

| Bereich | Überlappende Wege | Entscheidung für Teil 2 vorbereiten |
|---|---|---|
| Notizen | /notiz, /dashboard/kanban, rechte Daily-Notebook-Leiste, /api/notebook, Memory/Universe | Neue Supabase-Notizen als klaren eigenen Einstieg benennen; Altbestände erst nach Eigentümer-/Importentscheidung zusammenführen. |
| Aufgaben/Projekte | /vision/tasks mit lokalen Boards; gemeinsame /api/kanban; lokale Ziele; Supabase trinity_projects | Festlegen, welche Daten wirklich „meine Aufgaben/Projekte“ sind; keine blinde gemeinsame Suche. |
| Agenten | Digital Staff, /agents, Dashboard-Karten, FloatingAgentWidget | Ein Hauptziel wählen, Spezialansichten verlinken. |
| Matrix | /matrix und /vision/matrix-center | Aktuellen Einstieg bevorzugen; Altseite erst nach Nutzungsprüfung aus Navigation/Code nehmen. |
| Medien | Altes /media-Studio und neue Media-Studio-Launcher-Hierarchie | Web-Links klar von eigener Generierung unterscheiden; VocalLab nur in gesondert freigegebener Sprach-Phase 2. |
| Design | /media/design und /media/design/googledocs | Zwei lokale Launcher-Buckets mit ähnlichem Titel; keine Daten automatisch zusammenlegen. |

**Konkrete Attrappen bzw. unpassende Funktionen:** Morphreader aktualisiert nur Seed-Daten; Cloud-Upload in `lib/storage.ts` liefert immer `null`, Löschen ist ein No-op; Mac-Programmstart über Server-`open` passt nicht zum Linux-VPS. Der alte GHL-Proxy ist ein Stilllegungs-Kandidat, weil die aktuelle GHL-Seite externe Links nutzt. Das sind belegbare Restfunktionen, aber kein Auftrag zum Löschen.

## FuseBase-Reste und Rückfalloption

| Fundstelle | Rest | Bewertung |
|---|---|---|
| [package.json](../package.json), package-lock.json | @fusebase/fusebase-gate-sdk, Version 2.11.8-sdk.0 | Absichtlich für Rückfall behalten. |
| [next.config.ts](../next.config.ts) | SDK in serverExternalPackages | Server-Build-Konfiguration; kein Beleg, dass das SDK als Client-Bundle ausgeliefert wird. |
| [lib/fusebase](../lib/fusebase) | auth.ts, gate.ts, session.ts | Alte Konten-/Session-Implementierung. |
| [lib/auth/legacy](../lib/auth/legacy) | Login, Logout, me, Magic Link, Recovery, Provision und Revoke | Expliziter Rückfall via AUTH_PROVIDER; bis Nutzerfreigabe behalten. |
| [lib/supabase/config.ts](../lib/supabase/config.ts), app/api/auth/* und Provision-Aliase | Umschaltung auf FuseBase | Kein automatischer Rückfall bei Supabase-Fehlern; Schnittstellen erhalten. |
| [components/auth/FuseBaseAuth.tsx](../components/auth/FuseBaseAuth.tsx), [TopBar](../components/layout/TopBar.tsx) | Alte Komponente mit FuseBase-Rollen-/Logintext; Import in TopBar | Import noch da, aktuelle TopBar zeigt eigene Nutzer-/Logout-Anzeige; alten Text nicht als live sichtbaren Befund ausgeben. |
| [.env.example](../.env.example) | Überschrift „Trinity ONLY — no Supabase“, FUSEBASE_GATE_URL, FUSEBASE_ORG_ID, FUSEBASE_PORTAL_ID, FUSEBASE_TOKEN, FUSEBASE_APP_HOST | Überschrift veraltet; Variablennamen/Rückfall vorerst beibehalten. Keine Secret-Werte in diesem Inventar. |
| [lib/storage.ts](../lib/storage.ts), Meditation, SharePicker, lib/store.ts | FuseBase-Store-/Session-Kommentare, Upload-Stub | Funktionale Lücke und veraltete Beschreibung auseinanderhalten. |
| [lib/i18n.ts](../lib/i18n.ts) | Alte FuseBase-Auth-Texte | Spätere Textbereinigung nach Freigabe. |
| scripts und bestehende Übergabe-Dokumente | FuseBase-Migrations-/Rückfallhinweise | Historische und operative Referenzen; nicht pauschal entfernen. |

FuseBase-Asset-Hinweise außerhalb des Auth-Flows (z. B. Visual-Room-/Memberspot-Einbettung) sind kein Anlass, fremde Dienste zu ändern. Die separate Nutzerregel gilt weiter: FuseBase-Code und Variablen erst nach getesteter Freigabe entfernen.

## Priorisierte Probleme mit Quellen

| Priorität | Befund / Auswirkung | Quelle / Prüftiefe | Empfohlener nächster Schritt |
|---|---|---|---|
| P0 | Env-Editor prüft keine Administratorrolle; ein berechtigter Dashboard-Nutzer kann beliebige Konfigurationsschlüssel zur Speicherung senden. | [API](../app/api/settings/env/route.ts), [Proxy](../proxy.ts); statisch, keine Schreibprobe | Vor weiterer Freigabe Endpunkt deaktivieren oder getrennt administrativ autorisieren; Nutzer trägt Secrets weiterhin selbst auf dem Server ein. Auswirkungen auf .env.local/.env klarziehen. |
| P0 | Memory, Kanban, Agenten, Notebook, Shopify-Entwürfe und Gmail-Cache verwenden gemeinsame Dateien. Produktzugang bedeutet noch kein Eigentum. | [lib/db.ts](../lib/db.ts), [Gmail API](../app/api/gmail/threads/route.ts); statisch, keine Fremddatenprobe | Eigentümerschaft/Teamfreigaben entscheiden; diese Quellen bis dahin nicht in private Palette oder Graph übernehmen. |
| P1 | Lokale Fach-Stores sind nicht nach Auth-user_id getrennt und bleiben bei Logout bestehen. | [lib/store.ts](../lib/store.ts), Auth-Logout; statisch | Kontowechsel und Geräte-Synchronisierung fachlich klären; vorhandene Daten nicht löschen. |
| P1 | Mobile Dashboard-Hülle verdrängt Hauptinhalt, CLS > 0,25, zu kleine Buttons. | Lighthouse-Auszüge + Sidebar/NotebookPanel/Layout | Responsive Hülle und 44-px-Bedienflächen vor neuen Panels. |
| P1 | Barrierefreiheit 80–85 im Dashboard; Login 94. | Lighthouse: Namen, Labels, Kontrast, Touch-Ziele | Wiederverwendbare beschriftete Buttons/Felder und Kontrastkorrektur; Fokus/Tastatur anschließend manuell testen. |
| P1 | Navigation ist mehrdeutig, teils > 2 Klicks; keine globale Inhaltspalette. | [Sidebar](../components/layout/Sidebar.tsx), [TopBar](../components/layout/TopBar.tsx) | Aufgabenorientierte Routenliste; fertige Hauptziele vs Labor; Palette zuerst Seiten/Aktionen, private Inhalte nur aus geklärten Quellen. |
| P1 | Lade-/Leer-/Fehlerzustände unterscheiden sich; Tasks schluckt API-Fehler. | [Tasks](../app/dashboard/vision/tasks/page.tsx), Dashboard-Layout und Komponenten | Gemeinsame Zustände mit Wiederholen/Aktion; kein stilles „leer“ bei Fehlern. |
| P1 | Performance 73–76 bei kaltem Dashboard-Aufruf. | Lighthouse LCP/CLS/Bundle-Tabelle | Stabile Abmessungen, gemeinsame Client-Hülle verkleinern, Fonts/Widgets prüfen und danach messen. |
| P2 | Doppelte Auth-/Agenten-Abfragen beim Seitenstart möglich. | Proxy + Dashboard-Layout + Dashboard/Eden | Requests zusammenführen und zählen; kein unbelegter SQL-N+1-Befund. |
| P2 | Alte Server-URL-Abrufe/Proxy verändern bzw. umgehen Frame-Header. | /api/proxy, /api/meta, /api/ical | Ziel-Allowlist/Netzgrenzen und Weiterleitung von Anmeldedaten gesondert prüfen; externe Apps nicht umbauen. |
| P2 | Iframes, localhost-Fallbacks, Upload-Stub, Mac-Launcher und Demo-Feed wirken wie fertige Integrationen. | IframeView, AppLauncher, lib/storage.ts, Morphreader | Web-Link/Experiment/echte Integration sichtbar benennen; in Labor ordnen, Daten vorher sichern. |
| P2 | Englische Texte und fest eingebaute Produktnamen neben konfigurierbarer Marke. | Layout-/Tool-/Altseiten, i18n | Deutsche Oberfläche; NEXT_PUBLIC_APP_NAME und NEXT_PUBLIC_ASSISTANT_NAME konsistent verwenden. |

RLS ist für die neuen Supabase-Funktionen bereits im PR-8-Stand vorhanden. Dieses Audit hat weder RLS-Policies verändert noch einen vollständigen adversarialen Zwei-Nutzer-Test durchgeführt. „Bestehende RLS“ lässt sich nicht auf Dateien oder localStorage übertragen. Für Teil 3 fehlen heute außerdem ein gemeinsames eigenes Aufgaben-/Tags-/Personenmodell und ein Graph-Endpunkt. Indizes erst anhand der tatsächlichen freigegebenen Abfrage festlegen, keine spekulative Migration in Teil 1.

## Vorschlag zur Reihenfolge – zur Freigabe

1. **Zugang zu Verwaltungsfunktionen und Datenverantwortung klären.** Env-Editor absichern; festlegen, welche Alt-Daten privat, teamweit oder ausschließlich lokal sind. Für Palette/Graph zunächst nur nachweislich eigene Supabase-Daten zulassen. Eine Datenmigration oder neue Teamrechte wäre zusätzlicher abzustimmender Umfang, kein stiller Bestandteil des UI-Umbaus.
2. **Teil 2: gemeinsame Hülle zuerst.** Mobile Tab-Leiste mit vier Zielen als Vorschlag: Übersicht, Notizen, Aufgaben, Mehr. Seitenleisten auf schmalen Geräten als bewusst geöffnete Panels; stabile Layout-Abmessungen, 44-px-Ziele, Labels/Kontrast und einheitliche Lade-/Leer-/Fehlerzustände. Die fünf Benchmark-Routen bleiben gleich.
3. **Teil 2: Erreichbarkeit und Suche.** Eine zentrale, aufgabenbezogene Routenliste für Menü und ⌘K/Ctrl+K. Fertiges in höchstens zwei Klicks/einem Tastendruck; Labor für Experimente. Palette mit Tastatur, Aktionen, zuletzt verwendeten Einträgen und eigener Inhaltssuche; `?`-Hilfe. Archiv-Link auf die bestehende Domain, ohne das Portal zu verändern.
4. **Teil 2: Erststart und Tempo abschließen.** Überspringbare Einrichtung Name → Projekt → Notiz; seltene Widgets/Editor/Audio gezielt lazy laden, passende Server-Komponenten und Abfragen bündeln. Danach drei vergleichbare kalte Lighthouse-Läufe pro Seite (Median), mobile Tastatur-/Navigationstests und Sichtprüfung der Zustände. Abnahmeziel: Performance ≥ 90, Barrierefreiheit ≥ 95, keine Konsolenfehler in den geprüften Abläufen. Ein eigener Teil-2-PR.
5. **Teil 3 erst nach eigenem Okay.** Eigentumsgeprüfte Graph-Daten in einer serverseitigen Abfrage mit kurzem nutzergebundenem Cache; 3D nur auf /gehirn, gleichwertiger 2D-Rückfall auf Handy/schwacher GPU/reduced-motion. Tests mit zwei Nutzern, 2.000 Knoten, Suche/Filtern/Vorschau und Bundle-Prüfung gegen die fünf bisherigen Seiten. Ein eigener Teil-3-PR.

Offene fachliche Entscheidung vor Inhaltsindex/Graph: Sollen bisherige lokale Aufgaben, Team-Personen und gemeinsame Serverdateien künftig privat oder gemeinsam sein? Bis zur Entscheidung bleiben sie außerhalb der neuen privaten Suche. Keine vorhandenen Daten löschen oder automatisch einem Konto zuordnen.

## Reproduzieren und weiter testen

1. Den Stand von PR #8 verwenden und nur Staging öffnen. Mit einem berechtigten Testkonto anmelden; für Notiz reicht je nach Funktion die vorgesehene freie Mitgliedschaft.
2. Lighthouse 13.5.0 mit obigem Mobilprofil starten. Cookies behalten, HTTP-Cache vor jeder der fünf Navigationen löschen; keine Auth-Header global an Drittanbieter senden. Endgültige URL prüfen, damit eine Login-Weiterleitung nicht als Fachseite gemessen wird.
3. Performance/Accessibility und `errors-in-console` auswerten. In `network-requests` Script-Ressourcen nach entpackter Größe sortieren; gemessene Transfergrößen separat nennen. Für Teil-2-Abnahme drei Läufe pro Seite und Median dokumentieren.
4. Zusätzlich von Hand auf dem Handy: Seitenleisten und Hauptinhalt prüfen, Formulare mit Screenreader/Tastatur, Fokusfolge und Touch-Flächen testen. Der Lighthouse-Score allein bescheinigt keine vollständige Barrierefreiheit.
5. Die weiterhin offene Abnahme von #7/#8 separat ausführen: tatsächliche Mailzustellung, Passwort-/Recovery-Ablauf, eigene Aufnahme und echte Infomaniak-Transkription, Hermes-Freigabe, PWA-Installation und Subdomain-Sitzung. Kein solcher Erfolg wird aus dieser Bestandsaufnahme abgeleitet.

**Neue Env-Variablen:** keine. **Vom Nutzer jetzt nötig:** Inventar und vorgeschlagene Reihenfolge prüfen; Teil 2/3 erst nach seinem Okay. SMTP oder Provider-Schlüssel mussten für diesen Dokumentations-PR nicht geändert werden.
