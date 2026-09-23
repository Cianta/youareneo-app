# Kinosaal · YOU ARE NEO — Entwurf (19.09.2026)

Eigene Memberspot-Seite, gebaut wie der Visual Room: Quellcode hier in `memberspot/kinosaal/`,
Bundle im FuseBase-Speicher, kleiner Lader in der Memberspot-Seite (Updates ohne Memberspot-Eingriff).
Anmeldung: dasselbe Supabase-Konto wie Visual Room / Studio (`mission-control`, storageKey `neo-auth`, `neo_profiles`).

## Harte Grenze (geprüft)
Memberspot gibt pro Video nur eine interne `videoId` heraus, keine Datei-URL. Kursvideos lassen sich
außerhalb von Memberspot **nicht abspielen**, ebenso keine Kursdateien herunterladen (nur `fileCount`).
→ Zwei Quellen im selben Katalog:
1. **Memberspot-Katalog**: Titel, Vorschaubild, Kurs, Modul → Knopf „Im Kurs ansehen“ (Deep-Link).
   Favoriten, Playlisten, Suche, Notizen funktionieren; Sekunden-Lesezeichen nur als Notiz mit Zeitangabe.
2. **Eigene Videos** (NEO TV, Mitglieder-Uploads, YouTube/Vimeo/MP4-Links) → voller Kinosaal-Player:
   Vorladen, Sekunden-Lesezeichen, Screenshot, Fokus-Timer pausiert Player, Meditation nach dem Film.

## Zwei Modi, die ineinander überblenden
- **Lernraum** (hell-klar, ruhig, konzentriert): Video links, rechts Notizbuch/Lesezeichen/Kapitel,
  Fokus-Timer 45/5 sichtbar, Meditationslichter gedimmt, Mitschrift anheften, Screenshot → Notiz.
- **Kinosaal** (dunkel, cineastisch): Vorhang, Leinwand, Umgebung „Zukunft trifft Schamanismus“
  (Sternenhimmel, Feuerkreis, Wald-Silhouetten, Lichtfäden), alles einklappbar bis nur Leinwand,
  Vorlade-Knopf (puffert bis ~25 %, erst dann Start), danach 10 Min Meditation/Meditationsmusik.
- Übergang: Licht dimmt, Vorhang, Farbwelt wechselt (CSS-Variablen + Canvas-Überblendung ~1,2 s).

## Funktionen
Katalog + Suche + Filter (Kurs, Thema, Länge), Favoriten, Playlisten, „Weiterschauen“,
Sekunden-Lesezeichen mit einem Klick (Taste B), Notizfenster (anheften, Bilder, Screenshot),
Fokus-Timer 45/5 (an/aus; pausiert Player, spielt Meditationsklang, Meditationslicht wählbar),
Knopf „Pause im Meditationsraum“, Hub komplett ausblendbar, Tastaturkürzel, Vollbild.

## Daten (Supabase, neue Tabellen ks_*)
ks_videos (Katalog; Quelle memberspot|eigen, url, thumb, kurs, dauer), ks_favorites, ks_playlists(+items),
ks_bookmarks (video, sekunde, text), ks_notes (text, bilder, angeheftet), ks_progress.
Bilder/Screenshots: Storage-Bucket `ks-media`. RLS: jede Person nur eigene Daten.

## Uploads von Mitgliedern
Google Drive „Medien / Vereinsmitglieder Medien / Videos / …“ → Upload über Supabase Edge Function
(Dienstkonto schreibt in den Drive-Ordner), danach von uns eingepflegt in ks_videos.

## Danach
- **Radio**: Sender-Suche über die freie radio-browser.info-API (30.000+ Sender), vorausgewählt
  alternative/ambient/world/meditative Sender, Favoriten im selben Konto; als iFrame im Meditationsraum-Portal.
- Verbindung zum Visual Room (Visualizer reagiert auf Kinosaal-Ton, Knopf hinüber).
