# Supabase-Login: Einrichtung und Abnahme

Projekt: `emxqoahtipbmumghlixb`. Produktion bleibt bis zur ausdrücklichen Freigabe unverändert.

## Server-Konfiguration (Nutzer trägt Schlüssel selbst ein)

Nur `/docker/mission-control-stg/.env` bearbeiten. Vorhandene `FUSEBASE_*`, `APP_SECRET`, `PROVISION_WEBHOOK_SECRET` und `auth-mail.env` erhalten.

```dotenv
AUTH_PROVIDER=supabase
AUTH_APP_URL=https://trinity-stg.youareneo.com
SUPABASE_URL=https://emxqoahtipbmumghlixb.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Die beiden Schlüssel ausschließlich in dieser Serverdatei einsetzen, niemals im Chat oder Repository. Ein Publishable Key kann ebenfalls als `SUPABASE_ANON_KEY` verwendet werden. Alle Supabase-Werte werden zur Laufzeit nur vom Server gelesen; keine `NEXT_PUBLIC_*`-Schlüssel nötig.

Danach ausschließlich im Staging-Ordner:

```sh
cd /docker/mission-control-stg
docker compose up -d --build
```

Die Migration `supabase/migrations/20260927160032_neo_access.sql` ist bereits auf dem Zielprojekt angewendet. Nicht erneut unkontrolliert ausführen. Bestehende Tabellen bleiben unverändert.

## Supabase-Dashboard (Nutzer)

- Custom SMTP: Infomaniak eintragen; Host `mail.infomaniak.com`, Port `465` mit SSL/TLS; Absender `YOU ARE NEO Members <noreply@youareneo.com>`. SMTP-Benutzername und Passwort trägt der Nutzer selbst ein. SMTP-Daten ausschließlich im Dashboard.
- Vorhandene Site URL und Visual-Room-Redirects erhalten. Zusätzliche erlaubte Redirect-URLs: `https://trinity-stg.youareneo.com/auth/magic`, später `https://trinity.youareneo.com/auth/magic`.
- Unter Email Templates die deutschen HTML-Dateien aus `supabase/templates/` einfügen. Betreff Einladung: „Dein NEO-Zugang“; Magic Link: „Dein Anmeldelink für YOU ARE NEO“; Reset Password: „Dein NEO-Passwort zurücksetzen“.
- Die Vorlagen verwenden bei den beiden Trinity-Origins `TokenHash` und `RedirectTo`. Andere Anwendungen behalten `ConfirmationURL`, damit vorhandene Visual-Room-Flows nicht umgebogen werden. Der vorherige Host unter `hstgr.cloud` ist nicht mehr die Staging-Origin.
- Einladungsvorlage ist nur für ausdrücklich angeforderte manuelle Einladungen vorhanden. Provisionierung und Import verschicken keine Einladung. Der normale Erstzugang erfolgt über die Memberspot-Begrüßung und einen selbst angeforderten Magic Link oder Reset-Link.

## Automatisierte lokale Prüfungen

```sh
npm ci
npm run test:auth
npx tsc --noEmit
npm run build
```

Die Tests benutzen simulierte Supabase-HTTP-Antworten. Sie prüfen API-Formate, stille Anlage, parallele Wiederholungen, Widerruf/Reaktivierung, bestehende Profile, Cookie-Chunks, Refresh, Logout und die aktuelle Zugangsprüfung. Sie ersetzen keine echte SMTP- und Browserabnahme.

## Staging-Abnahme

Mit einer vom Nutzer bestimmten Test-E-Mail arbeiten. Keine echten Zugangstokens oder Passwörter in Screenshots, Chat oder Testprotokolle übernehmen.

1. `POST /api/provision/member` mit Bearer-Secret und `{ email, fullName, products: ["foerder","archiv"], source: "manual" }`: 200, `created:true`, normales `loginLink`; **keine Mail**.
2. Identischen Aufruf wiederholen: 200, dieselbe `userId`, `created:false`, genau eine Zeile je Produkt. Auch zwei parallele Requests prüfen.
3. Auf `/login` Magic Link anfordern, zugestellte Mail öffnen, „Weiter“ bestätigen. Dashboard und `/api/auth/me` funktionieren. Erneute Verwendung desselben Links muss scheitern.
4. Abmelden; „Passwort vergessen“ anfordern; Mail öffnen, bestätigen, neues Passwort zweimal eingeben. Abmelden und mit E-Mail/Passwort anmelden. Ein falsches Passwort darf keinen Zugang geben.
5. Einladung nur bei ausdrücklich gewünschtem Test: Supabase-Admin-Einladung mit `redirectTo` auf Staging `/auth/magic` für eine neue Testadresse erstellen; bestätigen, Passwort setzen. Für Dashboard-Zugang danach `foerder` über Provision freischalten. Dies ist kein Schritt der normalen Provisionierung.
6. `POST /api/provision/member/revoke` mit `{ email, products: ["foerder"] }`: `revoked:true`. Angemeldeter Nutzer erhält beim nächsten API-Request 403 und beim Dashboard-Aufruf die Zugangsseite. `archiv` bleibt aktiv. Wiederholung: `revoked:false`. Unbekannte E-Mail: 200 mit `userId:null`.
7. Erneut provisionieren: `created:false`, `foerder` wieder aktiv. Vorhandenes Visual-Room-Profil unverändert.
8. Auf einer **bestehenden** zweiten `*.youareneo.com`-Origin serverseitig dieselbe Sitzung lesen; Browser-Netzwerkprüfung zeigt denselben Cookie-Namen/Chunks mit `Domain=.youareneo.com`. Staging verwendet jetzt `trinity-stg.youareneo.com` und kann denselben Domain-Cookie setzen. `HttpOnly` bedeutet: im Cookie-Panel sichtbar, nicht in JavaScript.
9. Logout auf einer Origin: gemeinsame Cookies verschwinden. Die zweite App darf beim nächsten Serverrequest keine Sitzung mehr haben. Keine Sitzung im localStorage.

## FuseBase-Übernahme ohne Mail

Exportskript liest ausschließlich Mitglieder des bereits konfigurierten Portals. Es ändert keinerlei FuseBase-Einstellungen. Org-fremde oder andere Portalnutzer werden nicht mit neuen Rechten versehen. Export enthält personenbezogene Daten und liegt mit restriktiven Dateirechten im bestehenden Staging-Datenvolume.

Bereits exportiert: 6 Portalmitglieder, 0 übersprungen, Datei `/app/data/private/fusebase-members-20260927.json` im Staging-Container. Kein Versand ; inzwischen still importiert (6 neu, Wiederholung 0 neu, jeweils 0 Fehler).

Nach gesetzten Schlüsseln und erfolgreichem Staging-Start:

```sh
cd /docker/mission-control-stg
docker compose exec -T mission-control node scripts/migrate-fusebase-users.mjs import /app/data/private/fusebase-members-20260927.json
docker compose exec -T mission-control node scripts/migrate-fusebase-users.mjs import /app/data/private/fusebase-members-20260927.json --apply
```

Erster Aufruf ist Dry-Run. Zweiter ruft je Mitglied den stillen Provision-Endpunkt mit `products:["foerder"]`, `source:"manual"` auf. Wiederholung ist sicher, setzt allerdings wie jede Freischaltung einen späteren Widerruf zurück; deshalb nach abgeschlossener Migration nicht routinemäßig erneut ausführen. Bestehende NEO-Nutzer werden per E-Mail wiederverwendet, Profile bleiben erhalten. Das Skript protokolliert nur Anzahlen.

## Rückfall und Produktionsfreigabe

`AUTH_PROVIDER=fusebase` in der jeweiligen Server-.env setzen und dort `docker compose up -d --build` ausführen. Supabase-Sitzungen gelten dann nicht als FuseBase-Sitzung; Nutzer melden sich neu an. Der alte Förder-Alias nutzt in diesem Modus wieder den bisherigen FuseBase-Prozess. Der neue `/api/provision/member` bleibt ein Supabase-Endpunkt.

Vor Produktionsfreigabe müssen SMTP, echter Erstzugang, Login/Reset, doppelte Provisionierung, Revoke und Subdomain-SSO abgenommen sein. Erst danach dieselben geprüften Änderungen gezielt in `/docker/mission-control` übernehmen, dortige öffentliche Origin setzen und nur dort `docker compose up -d --build` ausführen. Traefik, DNS, n8n, Medien und andere Dienste bleiben unberührt. FuseBase erst nach einer weiteren ausdrücklichen Freigabe entfernen.

## Prüfergebnis am 27.09.2026

- TypeScript und lokaler Next.js-Produktionsbuild erfolgreich. Ein bestehender Next.js-Dateitracing-Hinweis aus `lib/db.ts` bleibt unverändert.
- 6/6 automatisierte Auth-/Provision-/Cookie-Tests erfolgreich; Supabase-HTTP-Antworten dabei simuliert.
- RLS direkt im Zielprojekt unter `authenticated` und `anon` geprüft: eigene Zeile sichtbar, fremde Zeile unsichtbar, Schreiben als Nutzer und Lesen als `anon` verweigert. Die beiden ausschließlich für diese SQL-Prüfung erzeugten Datensätze wurden in derselben Transaktion zurückgerollt.
- Supabase-Sicherheitsprüfung: keine Meldung zu `neo_access`. Vorhandene Hinweise zu anderen Tabellen und Funktionen wurden nicht verändert.
- Bestätigter Ausgangsstand: 0 Supabase-Auth-Nutzer. Der Nutzer hat dies als korrekt bestätigt; kein Abgleich nötig. Bestehende Tabellen und Profile bleiben erhalten.
- Echtes SMTP, neue Konten via Admin API, Import, Nutzer-Login und SSO-Abnahme bleiben bis zur Schlüssel-/SMTP-Konfiguration  offen.

Staging-Deployment erfolgreich: `docker compose up -d --build` ausschließlich in `/docker/mission-control-stg`. Login, Bestätigungsseite und Passwortformular liefern HTTP 200. Ungültige Auth-Anfragen liefern 400, Provisionierung ohne Secret 401. `/api/auth/me` meldet erwartungsgemäß 503, solange die beiden Supabase-Schlüssel fehlen. Der neue Login wurde zusätzlich im Browser geöffnet und geprüft.

## Aktualisierung: eigene Staging-Domain und Infomaniak

Der Nutzer hat `trinity-stg.youareneo.com` freigegeben; DNS verwaltet Claude. Die Domain löst auf `76.13.137.234` auf. Staging wird mit passenden Traefik-Labels und `AUTH_APP_URL` umgestellt. Die Supabase-Schlüssel wurden inzwischen vom Nutzer in der Server-.env hinterlegt. Die historischen 503-Ergebnisse oben beziehen sich auf den ersten Deploy ohne Schlüssel.

Aktueller Stand nach Domainwechsel:

- Beide Staging-Host-Labels und `AUTH_APP_URL` verwenden `trinity-stg.youareneo.com`; bestehender Compose-Projektname, Volumen und Netzwerk bleiben erhalten. Versionierte Kopie: `deploy/docker-compose.staging.yml` (für Verwendung als `/docker/mission-control-stg/docker-compose.yml`).
- HTTPS auf `/login` erfolgreich geprüft; `/api/auth/me` liefert ohne Sitzung korrekt 401. Kein Traefik-Neustart und kein Produktionsdeploy.
- `https://trinity-stg.youareneo.com/auth/magic` im Supabase-Dashboard als Redirect gespeichert und in der Liste verifiziert. Die allgemeine Site URL wurde nicht verändert; alle Trinity-Mailanfragen setzen `redirectTo` ausdrücklich.
- 6 exportierte Mitglieder ohne Mail importiert; zweiter vollständiger Durchlauf: 6 wiederverwendet, 0 neu, 0 Fehler. Keine Accounts oder Profile gelöscht.
- Deutsche Vorlagen im Repository und auf dem Server auf die neue Domain angepasst. Das Supabase-Dashboard sperrt ihre Aktivierung, bis Custom SMTP eingerichtet ist. Infomaniak-Zugangsdaten bleiben Nutzereingabe; danach Vorlagen speichern und Mail-/Browserabnahme abschließen.

## Erneute Abnahme nach Schlüsselmeldung

- Staging mit `docker compose up -d --build` neu geladen. Die tatsächliche `/docker/mission-control-stg/.env` enthält weiter leere OpenAI-/Anthropic-/Hermes-Werte; der laufende Container bestätigt diese fehlenden Werte. Der konfigurierte Anon-Key liefert direkt an `/auth/v1/settings` weiterhin HTTP 401. Keine Schlüsselwerte protokolliert; Rückfrage zur gespeicherten Datei läuft.
- Angemeldeter Smoke-Test weiterhin bei `/api/voice/config` mit 401 blockiert. Beide ausschließlich hierfür angelegten temporären Konten entfernt.
- Einladung, Magic Link und Passwort-Reset im Supabase-Dashboard auf die versionierten deutschen HTML-Vorlagen und Betreffzeilen umgestellt. Magic-Link-Speicherung bestätigt; Reset-Vorlage nach Neuladen vollständig mit Solltext verglichen. Infomaniak-SMTP im Dashboard aktiv. Versand und Zustellung sind damit noch nicht getestet.
- Vom Nutzer benannte Testadresse still mit Förderzugang angelegt; zwei identische Provision-Aufrufe lieferten 200, zuerst `created:true`, danach `created:false` und dieselbe Nutzer-ID. Keine Einladungsmail verschickt. Das Konto bleibt für den vereinbarten Handy-Test bestehen.
- Die vollständige Abnahme und die Freigabe von PR #7 bleiben offen. Keine Produktionsänderung.
