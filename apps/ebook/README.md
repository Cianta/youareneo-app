# ebook — Bibliothek (E-Book- & Hörbuch-Player)

Statische App (kein Build), Ziel-Domain `ebook.youareneo.com`.

- Login: Supabase Auth (E-Mail/Passwort oder Magic-Link)
- Berechtigung: Zeile in `public.neo_access` (`product` = Ordner im privaten Bucket `books`, `revoked_at is null`)
- Dateien: Bucket `books/<product>/…` (EPUB, Cover, MP3-Kapitel), Zugriff nur per signierter URL
- Fortschritt: `public.book_progress` (Fallback localStorage)
- Embed: `embed/dashboard.html` (Bibliothek | Hörbücher nebeneinander), `?embed=1&view=ebook|audio`
- Test ohne Login: `index.html?dev=1` -> lokale .epub öffnen

Einrichtung: `supabase/20261005_books.sql` ausführen, Dateien hochladen, nach Kauf `neo_access`-Zeile anlegen
(`source` z. B. `shopify`).
