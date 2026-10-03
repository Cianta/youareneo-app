# guiding.space · Arbeitsraum, Kontakte und Gespräche

Auftrag vom 04.10.2026. Branch `codex/guiding-workspace-studio`, auf dem Stand von PR #24. Bestehende Auth-, Provisioning-, Kalender-, Journal- und Notizverträge bleiben erhalten. Trinity bleibt die Assistentin; Domain weiterhin `trinity.youareneo.com`.

## Bedienung

- **Daten-Labor:** zehn umrahmte Bereichskarten nebeneinander, erste neun Werkzeuge je Bereich. Auf kleinen Displays drei kompakte Vorschauen. Der Bereichskopf und „Bereich öffnen“ zeigen ein großes Widget mit allen Werkzeugen. Suche durchsucht Namen und Stichwörter; Kategorien bleiben auch ohne Treffer sichtbar. Die bisherigen Routen bleiben erreichbar.
- **Menü:** Pfeil oben rechts klappt es zur Symbolleiste ein. Standardmäßig ausgeklappt; ausschließlich manuell. Die Wahl bleibt in `trinity-personal-v1.navOpen.sidebar` erhalten, auch beim Wechsel der Seite und nach Neuladen. Die größere Symbolfläche hat dezente Bereichsfarben. Entdecken bleibt standardmäßig geschlossen.
- **Notizbuch:** Der Headerbutton öffnet und schließt die rechte Schublade. Schnellnotizen, Bereiche, Farben, Bilder und Links verwenden denselben Journal-Notizspeicher wie „Ziele & Notizen“. Eine Notiz anklicken zum Bearbeiten. Die Schublade bleibt beim Navigieren offen; Escape und der Pfeil schließen sie. Bisherige lokale Notizbucheinträge und neural gespeicherte Schnellnotizen bleiben im aufklappbaren Archiv lesbar. Keine alte Sammlung wird gelöscht oder automatisch einem Konto zugeordnet.
- **Kalender & Plan:** farbige Tabs Monat, Jahr, Woche & Tag. Pfeiltasten wechseln die Tabs. Die Erde sitzt dauerhaft rechts oben und wird beim Wechsel nicht neu erzeugt. Quellen, Tagesplan und Liveplan bleiben daneben. Die Tagesplanung darunter verwendet weiterhin dieselben Ziele, Termine und Notizen; der Fokus bleibt bei 45 Minuten mit 10 Minuten Pause.
- **Projekte:** ein eigens gestaltetes Sternenforscher-Arbeitszimmer, Sternbildkarten, Projektsuche und seitliche Einblicke. Die Karten wählen ein Projekt für die Vorschau; „Projekt öffnen“ führt zu den zugeordneten Notizen. Freie Gedanken und zuletzt hinzugekommene Notizen stammen aus dem eigenen Wissensgraphen. Zahlen beziehen sich auf dessen aktuellen Ausschnitt, keine erfundenen Fortschrittswerte. Projektanlage bleibt über `/api/notes/projects` verfügbar.
- **Meeting:** Telefon ganz oben, mehrere eigene Raumlinks rechts, aktuell gewählten Raum öffnen oder kopieren. Der Einladungsentwurf übernimmt dessen Link. Suchfeld und Kontakt-Dropdown finden lokale und eigene importierte Kontakte; Empfänger, Betreff und Text bleiben bearbeitbar. „Einladung per E-Mail senden“ sendet bewusst nach Klick, wenn das eigene SMTP eingerichtet ist. Alternativ öffnet „Entwurf im Mailprogramm öffnen“ nur einen Entwurf. Ohne SMTP wird kein erfolgreicher Versand behauptet.
- **Kontakte CRM:** echte Kennzahlen, Suche einschließlich Gesprächsnotizen/Themen, Beziehungsstatus, Merkliste, Gesprächsnotizen und Wiedervorlagen. Fällige Kontakte erscheinen rechts. Eigene bisherige Kontakte bleiben lokal. Importierte CRM-Kontakte liegen im privaten Kontospeicher und stehen ebenfalls in der Meeting-Auswahl und im Ideenboard zur bewussten Auswahl bereit. Eingefügte Ideenboardkarten bleiben wie bisher auf dem jeweiligen Gerät.
- **Daten-Gehirn:** Suche nach Thema/Projekt/Person, Typ- und Zeitfilter, Vorschau und Ursprungslink. Unter dem Graphen: Wissensmix als Kreisdiagramm, Themen als Balken und sieben Tage Aktivität als Säulen. Auswertung folgt der aktuellen Suche und den Filtern. Gedanken ohne Verbindung geben konkrete Einstiege zum Ordnen. Diagramme sind leichte SVG/CSS-Elemente, keine zusätzliche globale 3D-Bibliothek.

Geschlossene Astrologie-, Termin- und Tagesdetaildialoge laden ihre Animationsbibliothek erst beim Öffnen. Die vorhandenen Anzeigen und Bewegungen bleiben erhalten; die erste Ansicht lädt weniger JavaScript.

## Neue Server-Anbindungen

**Manueller Import von HubSpot und HighLevel nach guiding.space**, mit Vorschau und bewusstem Übernehmen. Keine automatischen Hintergrundabläufe und kein Rückschreiben an das externe CRM. Veränderte Stammdaten werden nach Quellen-ID aktualisiert; lokale Kontakte, Gesprächsnotizen, Merkliste, Beziehung und Wiedervorlagen werden erhalten. Gleiche E-Mail-Adressen aus verschiedenen Quellen bleiben für eine bewusste Prüfung getrennt. Entfernte Quellkontakte werden nicht automatisch gelöscht. Maximal 2.000 Kontakte pro Abgleich; größere Mengen werden als Ausschnitt gekennzeichnet.

Tokens werden nur serverseitig gelesen und einer ausdrücklich festgelegten, frisch authentifizierten NEO-Nutzer-ID zugeordnet. Sie werden nicht an den Browser geschickt. Die private Integration ist für den jeweils konfigurierten Besitzer vorgesehen; Mehrnutzer-OAuth und beidseitige Synchronisation sind damit nicht aktiviert.

Neue Werte, vom Nutzer in der jeweiligen Server-`.env` einzutragen:

| Name | Zweck |
| --- | --- |
| `CRM_HUBSPOT_OWNER_USER_ID` | Supabase-UUID des Besitzers der HubSpot-Anbindung |
| `CRM_HUBSPOT_TOKEN` | Privates HubSpot-Token mit `crm.objects.contacts.read` |
| `CRM_GHL_OWNER_USER_ID` | Supabase-UUID des Besitzers der HighLevel-Anbindung |
| `CRM_GHL_TOKEN` | HighLevel-Private-Integration-Token eines Sub-Accounts mit `contacts.readonly` |
| `CRM_GHL_LOCATION_ID` | Genau der zugehörige Sub-Account / Location |
| `MEETING_MAIL_OWNER_USER_ID` | Supabase-UUID, die dieses Postfach zum Einladen nutzen darf |
| `MEETING_SMTP_HOST` | `mail.infomaniak.com` |
| `MEETING_SMTP_PORT` | `465`, TLS ab Verbindungsbeginn; alternativ `587` mit erzwungenem STARTTLS |
| `MEETING_SMTP_USER` | Benutzername des appseitigen SMTP-Postfachs |
| `MEETING_SMTP_PASSWORD` | Dessen SMTP-Zugangswert |
| `MEETING_SMTP_FROM` | Absenderadresse, vorgesehen `noreply@youareneo.com` |

Das bereits aktivierte **Supabase Custom SMTP** bleibt für Login-Mails zuständig. Es liefert der Anwendung keine SMTP-Zugangsdaten. Keine neuen Werte wurden eingetragen oder aus dem Dashboard ausgelesen. Nach Eintragen der Werte nur im jeweiligen erlaubten Ordner `docker compose up -d --build` ausführen. Die bestehende produktive Einbindung der Staging-`.env` gilt weiterhin; die Instanzdateien überschreiben gleichnamige Werte. Für getrennte Mail-/CRM-Konten Werte deshalb ausdrücklich pro Instanz setzen.

## Additive API-Verträge

Alle Antworten `private, no-store`; Fehler `{success:false,error:string}`. Die drei Routen prüfen selbst die frische Supabase-Sitzung. Die beiden CRM-Schreiboperationen und der Mailversand benötigen aktiven Förder-/App-Zugang. Same-Origin-Prüfung vor Schreiboperationen, kleine JSON-Körper. Keine Änderung an Supabase-Tabellen oder Cookie-Verträgen.

- `GET /api/crm/contacts` → `{success:true,userId,contacts,providers:[{id:"hubspot"|"ghl",ready:boolean}],mailReady:boolean}`. Nur eigener privater Cache. Ohne Import `contacts:[]`.
- `POST /api/crm/sync` mit `{userId,provider:"hubspot"|"ghl",commit:boolean}` → `{success:true,userId,provider,contacts,truncated:boolean,committed:boolean}`. `commit:false` liest ausschließlich die Vorschau. `commit:true` liest die Quelle erneut und übernimmt im eigenen Cache. UUID-Abweichung oder paralleler Abgleich: 409. Fremde/nicht eingerichtete Anbindung: 503; Provider-Limit: 429. Keine freie Upstream-URL, keine Weiterleitungen, begrenzte Seiten und je Abruf 15 Sekunden Timeout.
- `POST /api/crm/contacts` mit `{userId,id,stage:"neu"|"im_gespraech"|"verbunden"|"ruhend",note,nextContact:"YYYY-MM-DD"|"",favorite:boolean}` → `{success:true}`. Nur eigene importierte Kontakte. Änderung ausschließlich der guiding.space-Gesprächsmetadaten, kein externes CRM-Update.
- `POST /api/meeting/invite` mit `{userId,id:<UUID>,to,subject,message,room:<HTTPS-URL>}` → `{success:true,sent:true,duplicate:boolean}`. Eine Adresse, kein Bcc, keine Anhänge. HTTPS-Raum ohne eingebettete Zugangsdaten; Betreff ohne Headerumbrüche. Bestätigung erst nach SMTP-Antwort. Im laufenden Prozess idempotent pro UUID und Inhalt, maximal zehn Einladungen pro Stunde. Unklarer Versand wird nicht automatisch wiederholt. Prozessneustart setzt diesen temporären Duplikat-/Limit-Speicher zurück; vor manueller Wiederholung Postfach prüfen.

Cache im vorhandenen Datenvolume: `DATA_DIR/private/crm/crm-users/<Supabase-user-id>.json`, neue Verzeichnisse 0700 und Dateien 0600. Schreiben atomar; konkurrierende Änderungen werden in dieser einzelnen App-Instanz serialisiert. Der Cache enthält Kontakte, keine Tokens. Er ist **kein Supabase-Datenbanksync** und kein Teil der freiwilligen Arbeitsbereich-Sicherung. Vorhandene Backup-Verfahren für das Datenvolume weiter verwenden.

## Prüfung und Veröffentlichung

Build, Unit-/API-Fixturetests, Bedienungsprüfungen auf Desktop und 320/390 px, bestehende Journal-/Fokus-/Kalender-, Navigation-, Logo-/Kommunikations- und Brain-Prüfungen. Keine echten CRM-Daten gelesen/geändert, keine echte Mail versendet. Angemeldete Login-, SMTP-, Mikrofon-, KI- und Hermes-Abnahme bleibt wie vom Nutzer verschoben offen.

Lighthouse-Werte und Release-Nachweis werden separat unter `GUIDING-STUDIO-LIGHTHOUSE.json` und `GUIDING-STUDIO-RELEASE.json` festgehalten. Reihenfolge: Staging bauen und prüfen, danach freigegebene Produktion bauen und prüfen. Nur die beiden mission-control-Ordner; Env-Dateien, Compose, Datenvolume, Traefik und andere Dienste bleiben erhalten.

## Primärdokumentation

- [HubSpot Kontakte und Cursor-Paginierung](https://developers.hubspot.com/docs/api-reference/legacy/crm/objects/contacts/guide)
- [HighLevel Kontaktsuche, Version 2023-02-21](https://marketplace.gohighlevel.com/docs/2023-02-21/ghl/contacts/search-contacts-advanced/) und [verlinkte offizielle Anfrage-/Antwortbeschreibung](https://doc.clickup.com/8631005/d/h/87cpx-158396/6e629989abe7fad)
- [Nodemailer SMTP und TLS](https://nodemailer.com/smtp)
- [Supabase getUser für verifizierte Autorisierung](https://supabase.com/docs/reference/javascript/auth-getuser), [Auth-Changelog](https://supabase.com/changelog?tags=auth)
