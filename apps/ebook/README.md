# ebook — Bibliothek (E-Book- & Hörbuch-Player)

Ziel: `https://ebook.youareneo.com` (VPS, Docker + Traefik, wie Trinity).

- **Login:** dasselbe Supabase-Konto wie Trinity. Der Server liest das HttpOnly-Cookie
  `sb-emxqoahtipbmumghlixb-auth-token` (`Domain=.youareneo.com`) — wer in Trinity angemeldet ist, ist hier angemeldet.
  Zusätzlich E-Mail/Passwort-Login direkt hier (für Käufer ohne Fördermitgliedschaft).
- **Zugang:** aktive Zeile in `public.neo_access` (`product = 'schoepfungsschluessel-ebook'`, `revoked_at is null`).
  Freischalten per Make/n8n: `POST /api/provision/member` (Trinity) mit `products: ["schoepfungsschluessel-ebook"]`.
- **Dateien:** privater Bucket `books/<product>/…` (`schoepfungsschluessel.epub`, `cover.jpg`, Hörbuch-MP3s);
  Server gibt nach Prüfung 10-Minuten-Links aus (Download oder Streaming).
- **Fortschritt:** `public.book_progress` (RLS: nur eigene Zeilen).
- **Katalog:** `books.json`. **Embed:** `public/embed/dashboard.html` (Bibliothek | Hörbücher), `?embed=1&view=ebook|audio`.

## Deployment
1. GoDaddy: A-Record `ebook` → `76.13.137.234`.
2. Auf dem Server `/docker/ebook/` anlegen, Repo-Ordner `apps/ebook` hineinkopieren, `/docker/ebook/.env` nach `.env.example` füllen.
3. `cd deploy && docker compose -f docker-compose.production.yml up -d --build`.
4. Dateien in den Bucket `books` hochladen, Testkonto in `neo_access` freischalten.

Lokal: `SUPABASE_ANON_KEY=… COOKIE_DOMAIN= node server.mjs` (npm ci vorher).
