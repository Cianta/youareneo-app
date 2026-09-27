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

Transkription standardmäßig über `TRANSCRIBE_PROVIDER=infomaniak`, serverseitig `INFOMANIAK_AI_PRODUCT_ID` und `INFOMANIAK_AI_TOKEN`. `openai` bleibt ausdrücklich auswählbar; Amical entfernt. Auth-Endpunkte, Tabellenfelder und Cookie-Namen bleiben unverändert. `/api/voice/config` meldet nun standardmäßig `provider:"infomaniak"`; `/api/voice/transcribe` meldet `provider:"Infomaniak"`. Details in `AUFTRAG-CODEX-TRINITY-STIMME.md`. Phase 2: VocalLab, weiterhin Freigabe erforderlich.
