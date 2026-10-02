# Übergabe an Codex: Trinity-Login von FuseBase auf Supabase

Stand 27.09.2026. Ziel: FuseBase wird Ende Oktober gekündigt. Bis dahin muss Trinity ohne FuseBase anmelden und freischalten können. Portal-Vorlage und n8n-Abläufe baut Claude parallel und verlässt sich auf die Schnittstelle unten. Bitte nur davon abweichen, wenn es vorher abgesprochen ist.

## Ausgangslage

- Login läuft heute über FuseBase-Konten: `lib/fusebase/auth`, `lib/fusebase/session`, Routen `app/api/auth/{login,logout,magic,magic-link,me,password-restore}`.
- Freischaltung: Make ruft `POST /api/provision/foerder` (Secret `PROVISION_WEBHOOK_SECRET`) → `inviteFoerderToPortal` → FuseBase `inviteToPortal`. Daher kommt die ungebrandete FuseBase-Mail.
- Supabase-Projekt **`emxqoahtipbmumghlixb`** enthält die Tabelle `neo_profiles` und startet bestätigt mit 0 Auth-Nutzern. Das wird das **einzige** Kontensystem.

## Was gebraucht wird

1. **Login über Supabase Auth**: E-Mail + Passwort, Magic Link, Passwort vergessen. Die bestehenden `app/api/auth/*`-Routen behalten ihre Pfade, damit das Frontend gleich bleibt.
2. **Sitzung für alle Subdomains**: Cookie-Speicher (`@supabase/ssr`) mit `domain=.youareneo.com`, damit dieselbe Anmeldung auf `trinity.`, `archiv.` und weiteren Subdomains gilt. Kein localStorage, das ist pro Subdomain getrennt.
3. **Zugangsrechte** in einer Tabelle, z. B. `neo_access`:
   `user_id uuid → auth.users`, `product text` (`foerder`, `archiv`, `kursbibliothek`, `live`, …), `source text` (`memberspot`, `shopify`, `manual`), `granted_at`, `revoked_at null`. RLS: Nutzer lesen nur ihre eigenen Zeilen, schreiben nur mit Service-Role.
4. **Freischalt-Endpunkt** (ersetzt `provision/foerder`, den alten Pfad bitte als Alias behalten, Make ruft ihn noch auf):

   ```
   POST /api/provision/member
   Header: Authorization: Bearer <PROVISION_WEBHOOK_SECRET>
   Body:   { "email": "...", "fullName": "...", "products": ["foerder","archiv"], "source": "memberspot" }
   → 200 { "success": true, "userId": "...", "created": true|false, "loginLink": "https://..." }
   ```

   Legt den Nutzer an, falls er fehlt (`auth.admin.inviteUserByEmail` oder `generateLink`), und schreibt die Zugänge. Muss idempotent sein: Ein zweiter Aufruf mit derselben E-Mail ist kein Fehler.
   Dazu `POST /api/provision/member/revoke` mit `{ email, products }`, setzt `revoked_at`.
5. **Mails**: Supabase verschickt über das eigene SMTP, das der Nutzer im Dashboard einträgt (Absender „YOU ARE NEO Members“ <noreply@youareneo.com>, Infomaniak, `mail.infomaniak.com:465` (SSL/TLS)). Deutsche Vorlagen für Einladung, Magic Link und Passwort zurücksetzen.
6. **Bestehende FuseBase-Nutzer**: Liste exportieren und in Supabase anlegen, ohne Mail. Sie melden sich danach über „Passwort vergessen“ an.
7. **FuseBase-Abhängigkeiten entfernen**: `FUSEBASE_*`-Variablen in `.env` und `auth-mail.env` bleiben, bis der Umbau getestet ist.

## Server

VPS `76.13.137.234`, Compose unter `/docker/mission-control`, Traefik mit Let's Encrypt. Neue Subdomains erst starten, wenn ihr DNS-Eintrag bei GoDaddy auflöst, sonst hängt das Standard-Zertifikat von Traefik.

## Wer was baut

- **Codex**: Punkte 1–7 in Trinity.
- **Claude**: Portal-Vorlage (`archiv.youareneo.com`), fragt `neo_access` ab. n8n-Ablauf: Memberspot-/Stripe-Kauf → `POST /api/provision/member`. Memberspot-Einstellungen.

## Änderungen durch Codex

Stand 27.09.2026, Branch `codex/trinity-supabase-login`. Die ausdrückliche Anweisung des Nutzers im Auftrag hat Vorrang vor Punkt 4 oben:

- **Stille Anlage:** `/api/provision/member` verwendet ausschließlich `auth.admin.createUser({ email, email_confirm: true })`. Kein `inviteUserByEmail`, kein `generateLink`, keine Mail beim Provisionieren oder Import. `loginLink` ist die normale `/login`-Adresse der Instanz, kein Bearer-Link. Die Begrüßung bleibt bei Memberspot.
- **Cookie-Vertrag:** Standardname `sb-emxqoahtipbmumghlixb-auth-token`, bei großen Sitzungen `.0`, `.1`, …; Format und Refresh über `@supabase/ssr`. Auf `*.youareneo.com`: `Domain=.youareneo.com; Path=/; Secure; HttpOnly; SameSite=Lax`. Claudes Portal muss die Cookies serverseitig mit demselben Supabase-Projekt und demselben Namen lesen/erneuern. Kein localStorage und kein Zugriff auf die Sitzung über `document.cookie`.
- **Staging-Domain (vom Nutzer freigegeben):** `https://trinity-stg.youareneo.com`, `AUTH_APP_URL` und beide Traefik-Host-Regeln der Staging-Compose-Datei verwenden diese Domain. DNS wird von Claude gepflegt. Dadurch verwendet auch Staging `Domain=.youareneo.com`. Supabase-Redirect: `https://trinity-stg.youareneo.com/auth/magic`. Traefik selbst und Produktion bleiben unverändert.
- **`neo_access`:** Felder wie oben, Primärschlüssel `(user_id, product)`. Aktiver Zugang bedeutet `revoked_at IS NULL`. Erneute Freischaltung reaktiviert genau die genannten Produkte, erhält `granted_at` als Zeitpunkt der ersten Freischaltung und aktualisiert `source`. Wiederholter Widerruf erhält den ersten Widerrufszeitpunkt. Bestehende Profile werden nie überschrieben.
- **Trinity-Zugang:** Aktives Produkt `foerder` ist erforderlich. Dashboard und interne `/api/*`-Routen prüfen Supabase-Identität und den aktuellen Tabellenstand serverseitig. `/api/auth/*` bleibt für Kontoanmeldung/Passwortwechsel zugänglich; `/api/provision/*` prüft das Webhook-Secret. Ein Widerruf von `foerder` sperrt Trinity beim nächsten geschützten Request, ohne andere Produkte oder das NEO-Konto zu löschen.
- **Revoke-Antwort konkretisiert:** `POST /api/provision/member/revoke` mit `{ email, products }` liefert `200 { success: true, userId: string|null, revoked: boolean }`. Unbekannte E-Mail oder bereits widerrufene Produkte sind erfolgreiche No-ops.
- **Make-Alias:** `/api/provision/foerder` und `/api/provision/foerder/revoke` bleiben erhalten. Ohne `products` wird `["foerder"]`, ohne `source` wird `memberspot` verwendet. Die zusätzlichen alten Felder `url` und `magicLink` zeigen beide auf die normale Login-Seite und enthalten keinen Anmeldetoken. Die bisher unterstützten Secret-Header bleiben erhalten. Keine Make-Änderung vorgenommen.
- **Passwort setzen:** Ergänzend `POST /api/auth/password` mit `{ password }`, gültige Supabase-Sitzung erforderlich; Antwort `200 { success: true, redirectPath: "/dashboard" }`. Formular unter `/auth/password`.
- **Bestätigungslinks:** Bestehender Pfad `/api/auth/magic` verarbeitet `token_hash` und `type` (`email`, `invite`, `recovery`, `signup`, `magiclink`) oder PKCE-`code`. `/auth/magic` zeigt einen Bestätigungsbutton, damit Mail-Scanner den Link nicht vorzeitig verbrauchen. Einladung und Recovery führen zur Passwortwahl. `globalId` bleibt ausschließlich im FuseBase-Rückfallmodus unterstützt.
- **Rückfall:** Nur mit explizitem `AUTH_PROVIDER=fusebase` wird der bisherige Code verwendet. Standard ist Supabase; Konfigurationsfehler schalten niemals automatisch auf FuseBase um. Alle bisherigen FuseBase-Dateien und Variablen bleiben erhalten. Die lokalen Demo-Team-Anmeldungen sind kein weiteres Kontensystem mehr; das UI-Profil liegt nur im Arbeitsspeicher.

Die detaillierten Konfigurations- und Abnahmeschritte stehen in `SUPABASE-LOGIN-TESTPLAN.md`.

- **Präzisierung durch den Nutzer:** 0 Supabase-Auth-Nutzer sind der korrekte Ausgangsstand; kein Kontenquellen-Abgleich erforderlich. SMTP ist Infomaniak (`mail.infomaniak.com`, Port `465`, SSL/TLS), Absender `noreply@youareneo.com`. Zugangsdaten werden ausschließlich vom Nutzer im Supabase-Dashboard eingetragen.

### Ergänzung Phase 1 Sprachnotizen

Eigener Folgebranch `codex/trinity-voice-phase1` baut auf PR #7 auf. Auth-Pfade, Provision-Formate, Profile und Cookie-Vertrag bleiben unverändert. Neue Notiz-/Voice-Routen prüfen ihre Sitzung selbst: KI-Nutzung für angemeldete Konten ohne Produktpflicht, Speichern nur mit einem aktiven Produkt aus `['foerder','app']` in API und RLS. Hermes verwendet einen eigenen Bearer-Token, keine Nutzersitzung. Neue Tabellen/Storage/APIs/Env stehen in `docs/AUFTRAG-CODEX-TRINITY-STIMME.md` unter „Änderungen durch Codex“. Das bisherige Dashboard und FuseBase-Rückfallverhalten bleiben erhalten. Produktion wird nicht deployed.

### Anbieterwechsel für Phase 1

Transkription standardmäßig über `TRANSCRIBE_PROVIDER=infomaniak`, serverseitig `INFOMANIAK_AI_PRODUCT_ID` und `INFOMANIAK_API_TOKEN`. `openai` bleibt ausdrücklich auswählbar; Amical entfernt. Auth-Endpunkte, Tabellenfelder und Cookie-Namen bleiben unverändert. `/api/voice/config` meldet nun standardmäßig `provider:"infomaniak"`; `/api/voice/transcribe` meldet `provider:"Infomaniak"`. Details in `AUFTRAG-CODEX-TRINITY-STIMME.md`. Phase 2: VocalLab, weiterhin Freigabe erforderlich.

## Änderungen durch Codex – 01.10.2026, Bedienbarkeit Teil 2

Interne Ergänzungen: `GET /api/search?q=...` sucht ausschließlich eigene Supabase-Notizen/Aufgaben/Projekte/Tags; Antwort `{ success, userId, items }`. `POST /api/onboarding` nimmt `{ name?: string, complete?: true }` an und setzt ausschließlich eigene Anzeige-Metadaten `trinity_display_name` / `trinity_onboarding_complete` im Auth-Benutzer. Diese Metadaten steuern **keine Rechte** und verändern keine Zeilen in `neo_profiles`. `displayName` in `/api/auth/me` bevorzugt einen so gesetzten Namen; Form der Antwort unverändert. `GET /api/notes` akzeptiert zusätzlich den optionalen, eigentumsgeprüften Filter `id=<UUID>`.

Der alte Konfigurations-Endpunkt `GET/POST /api/settings/env` ist bewusst geschlossen (HTTP 410), ohne Keys/Dateien zu lesen oder zu schreiben. Secrets werden weiterhin ausschließlich vom Nutzer in der Server-`.env` eingetragen. Bestehende Auth-/Provision-/Hermes-Verträge, Cookie-Name und `.youareneo.com`-Domain bleiben unverändert; keine Tabellenänderung und keine neuen Server-Env-Variablen. Vollständige interne Verträge und späterer Testplan: [TRINITY-TEIL2.md](TRINITY-TEIL2.md). Nur Staging; Live-/Infomaniak-/Mail-/Handy-Abnahme auf Nutzerwunsch verschoben.

### 01.10.2026 – Wissensgraph

Teil 3 ergänzt `GET /api/brain` und den read-only RLS-RPC `trinity_brain_snapshot()` (Security Invoker, nur authenticated). Er liest ausschließlich eigene bestehende Notizen/Projekte/Hermes-Zeilen, keine Profile oder Portal-Bestände. Einzelheiten: [TRINITY-TEIL3.md](TRINITY-TEIL3.md). Cookie-/Provision-/Auth-Verträge und vorhandene Felder unverändert.

### 01.10.2026 – Sprachchat Phase 2

Neue interne Endpunkte unter `/api/voice/chat` und `/api/voice/speech` (inkl. `/voices`, `/preferences`) sind in [TRINITY-SPRACHE-PHASE2.md](TRINITY-SPRACHE-PHASE2.md) beschrieben. Stimmpräferenz nur in eigenen User-Metadaten, kein neues Kontensystem oder neue Tabelle. Bestehendes `usage` zählt zusätzlich Chat/TTS; alle Auth-/Provision-/Cookie-Verträge und `neo_profiles` bleiben unverändert. Keine Portal-/n8n-Abhängigkeit geändert.

### 01.10.2026 – Infomaniak-Tokenname

Serverseitiger Standardname jetzt `INFOMANIAK_API_TOKEN`, gemeinsam mit `INFOMANIAK_AI_PRODUCT_ID`; alter Name `INFOMANIAK_AI_TOKEN` vorläufig als nachrangiger Rückfall. Neue Vorlagen verwenden den Standardnamen. Keine Änderungen an HTTP-Endpunkten, Tabellen, Cookies oder Provision-Verträgen, keine Server-Secrets verändert.

## Änderungen durch Codex – 02.10.2026, Produktionsfreigabe

Der Nutzer hat ausdrücklich die Veröffentlichung der fertigen Version auf `trinity.youareneo.com` freigegeben. Produktionscode: `b36e1575dbc76e42faeb1425b300d8d7492ae631` (PR #17 einschließlich der Vorgänger). Die zuvor auf Nutzerwunsch verschobenen echten Mail-/Login-/KI-/Handy-Abnahmen bleiben offen; die Freigabe ersetzt keinen Testnachweis.

- Nur `/docker/mission-control` aktualisiert; Deployment mit `docker compose up -d --build`. Staging, Traefik und andere Dienste nicht verändert. Bestehendes Produktionsvolumen, Netzwerk und Host-Labels erhalten.
- `AUTH_PROVIDER=supabase`, `AUTH_APP_URL=https://trinity.youareneo.com`, `TRANSCRIBE_PROVIDER=infomaniak` als nicht geheime Compose-Einstellungen. Versionierte Konfiguration: `deploy/docker-compose.production.yml`.
- Bereits vom Nutzer eingetragene Supabase-/Anthropic-/Hermes-Werte werden über `/docker/mission-control-stg/.env` eingebunden; danach überschreiben die bestehenden Produktionsdateien `.env` und `auth-mail.env` gleichnamige Werte. Dadurch bleiben die bereits in Produktion eingetragenen Infomaniak-Werte und alle FuseBase-Rückfallwerte erhalten. Beide Produktions-Schlüsseldateien und die Staging-`.env` unverändert; keine neuen Schlüssel eingetragen oder kopiert. Diese Einbindung ist bewusst eine Abhängigkeit von der Staging-Datei: Änderungen dort gelten beim nächsten Produktionsstart. Eine spätere Trennung der Schlüsseldateien nimmt der Nutzer selbst vor.
- In Supabase den exakten Redirect `https://trinity.youareneo.com/auth/magic` ergänzt und im Dashboard verifiziert. Staging-Redirect und allgemeine Site URL erhalten. Die bereits gespeicherten deutschen Vorlagen unterstützen beide Trinity-Origins. Keine neue Domain oder DNS-Änderung.
- Konten, Profile, RLS und Datenbank unverändert. Auth-/Provision-/Cookie-Verträge unverändert; gemeinsamer HttpOnly-Cookie weiterhin `.youareneo.com`. Die sechs externen alten App-Einstiege benötigen weiterhin ihre bisherige Anmeldung.
- Build-Kontext schließt zusätzlich Deployment-Sicherungen, `.mcp.json` und Host-`data/` aus. Der Dockerfile legt das leere Datenverzeichnis an; das bestehende Produktionsvolumen liefert die Nutzerdaten.

Deployment, Prüfung und Rückfall: [TRINITY-PRODUKTION.md](TRINITY-PRODUKTION.md).

## Änderungen durch Codex – 02.10.2026, globaler Trinity-Assistent

Additive interne Einordnung: `POST /api/voice/classify` akzeptiert optional `project: string|null` als eigentumsgeprüften Zielort und ergänzt `rulesApplied: boolean`. `GET /api/notes/projects?rulesFor=<Projekt>` ergänzt zur bisherigen Antwort `rules: string`; ohne Parameter bleibt die Antwort unverändert. Ortsregeln sind gewöhnliche eigene Notizen mit Tag `projektregeln`, Projekt und neuester `created_at`, begrenzt auf 2.000 Zeichen. Nur Einordnung, keine Ausführung oder automatische Hermes-Freigabe. Bei automatisch erkanntem Ort mit Regeln zählen beide KI-Aufrufe gegen das bestehende Limit.

Keine neuen Tabellenfelder, Migrationen oder Env-Variablen. Alle Auth-/Provision-/Cookie-Verträge, `neo_profiles` und Portal-/n8n-Verträge bleiben erhalten. Gerätepräferenzen für Anzeige/Stimme dürfen im localStorage liegen; Sitzungen und Notizen weiterhin nicht. Navigation und Assistent sind nun über die Arbeitsraum-Routen hinweg persistent. Bedienung und Prüfung: [TRINITY-ASSISTENT-BEDIENUNG.md](TRINITY-ASSISTENT-BEDIENUNG.md).

### Änderungen durch Codex · frühere Räume und Astrologie (2. Oktober 2026)

Zusätzliche interne, vom vorhandenen Proxy für angemeldete Trinity-Mitglieder geschützte Routen: `GET /api/birth-places?q=<Ort>` liefert `{places:[{name,lat,lng,timezone}]}` aus einem lokalen Städteverzeichnis; `POST /api/birth-chart` nimmt `{date:"YYYY-MM-DD",time:"HH:MM"|"",timezone:"IANA",city?:string,lat?:number,lng?:number}` an. Das Ergebnis enthält `western`, `moon`, `vedic`, `vedicMoon`, `chinese`, `maya`, `celtic`, `hd`, `utc`, `meta`, `ascendant`, `ascendantVedic`. Validierungsfehler liefern `400 {success:false,error}`, übergroße Eingaben `413`; Auth-/Zugriffsfehler weiterhin `401/403`. Geburtsdaten werden hier nicht in Supabase gespeichert, die Berechnung ruft keinen externen Anbieter auf. Antworten sind `private, no-store`. Keine Änderung an Login/Provision, Tabellen, Cookie-Name oder Cookie-Domain. Lokale alte Arbeitsbereiche und Einschränkungen stehen in `TRINITY-WIEDERHERSTELLUNG.md`.


## Änderungen durch Codex · guiding.space

Produktname jetzt guiding.space; Trinity bleibt Assistentin. Auth-, Provision-, Tabellen- und Cookie-Verträge unverändert. Bestehende Vereinsdomains bleiben aktiv; guiding.space-Domainumzug erst nach Kauf und gesondertem Auftrag. Neutrale YOU ARE NEO-Kontomails bleiben für alle angebundenen Produkte bestehen. Details: [GUIDING-SPACE-WIDGET.md](GUIDING-SPACE-WIDGET.md).

## Änderungen durch Codex – guiding.space Begleiter und Gerätesicherung (02.10.2026)

- Bestehende Auth-/Provisioning-Endpunkte, Cookie-Namen/-Domain, `neo_profiles` und `neo_access` unverändert.
- Neu: `GET /api/workspace/snapshot` → `{userId,canSave,snapshot:null|{revision,payload,updated_at}}`; `PUT` mit `{userId,revision,payload}`. `revision:0` erzeugt den ersten Stand. Nur eigene authentifizierte Inhalte; Speichern benötigt aktiven Förder-/App-Zugang. HTTP 409 bei Konto-/Versionskonflikt. Snapshotformat `{version:1,stores:{[erlaubterSpeicherschlüssel]:"JSON als String"}}`, max. 2 MB. Migrationen `guiding_workspace_snapshots` / `guiding_workspace_save_access`. Keine automatische Übernahme oder Hintergrundsynchronisierung.
- Neue Tabelle `guiding_workspace_snapshots`: `user_id` (PK/FK Auth), `revision`, `payload`, `updated_at`, eigene RLS-Policies. Bestehende Tabellen und Nutzer bleiben erhalten.
- Sicherheitskorrektur am vorhandenen `GET/POST /api/gmail/threads`: authentifiziert und pro Nutzer getrennt; historischer gemeinsamer `.cache/gmail-threads.json` bleibt liegen und wird nicht automatisch zugeordnet. Neue Cachedateien im bestehenden beschreibbaren Datenvolume unter `DATA_DIR/private/mail-cache/mail-users/<Supabase-user-id>.json`. Refresh-Skripte benötigen jetzt die Sitzung des tatsächlichen Eigentümers. Keine Make-/n8n-/Portal-Konfiguration verändert. GET ergänzt `available`, `userScoped`, `userId`, `totalUnread`; ohne persönliche Quelle `available:false`, `totalUnread:null`.
- Neu: öffentliche, ausschließlich lesende `/api/ambience?q=Ortsname`-Suche bzw. `?lat=...&lon=...` für optionale Open-Meteo-Wetterdarstellung. Kein GPS; Einstellung aus, bis Nutzer selbst aktiviert/Ort auswählt. Keine neuen Secrets.
- Buzz nur wieder als bestehender Portal-Einstieg verknüpft; separater Buzz-Login und Einladungen unverändert. Kein gemeinsamer Login behauptet.
- Details und Abnahmegrenzen: `docs/GUIDING-SPACE-BAUPLAN.md`.

Die neuen Sicherungs- und Mailrouten prüfen ihre Sitzung selbst wie die bestehenden Notizrouten; sie werden von der pauschalen Produktprüfung im Proxy ausgenommen. Sicherungsschreiben benötigt weiterhin aktiven App-Zugang. `/api/ambience` liefert ausschließlich öffentliche Orts-/Wetterdaten; es ist ohne Anmeldung nutzbar.
