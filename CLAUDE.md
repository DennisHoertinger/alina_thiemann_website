# CLAUDE.md – Website Alina Thiemann (Code)

Persönliche Website der Schauspielerin **Alina Thiemann** (Berlin, ADK Baden-Württemberg 2026), gebaut von Dennis Hörtinger. Erste Website einer Reihe für Schauspielende: Aufbau so halten, dass er sich für weitere Schauspieler:innen kopieren lässt.

Planung, Texte, Design-Entwürfe, Protokolle und Rohmaterial liegen **nicht** hier, sondern in Dennis' Projektordner `/Applications/Development/2026_Alinas Website ` (Ordnername endet mit Leerzeichen). Quelle der Wahrheit für Texte ist dort `inhalte/website-inhalte.md`, für Fotos `inhalte/fotos-credits.md`, für das Design `design/musterbogen/entwurf-7-iphone.html` (abgenommen 14.11.2026).

## Technik: bewusst schlicht (Entscheidung Dennis, 14.11.2026)

Kein Framework, kein Baukasten, kein Build-Schritt.

- **HTML**: jede Unterseite ist eine eigene Datei im Stamm (`index.html`, `vita.html`, `medien.html`, `coaching.html`, `kontakt.html`, `impressum.html`, `datenschutz.html`, `404.html`). Kopf, Menü, Fuß und Consent-Banner stehen in jeder Datei gleich; bei Änderungen alle Dateien anpassen.
- **CSS**: eine Datei `css/stil.css` mit Design-Tokens oben. Mobile first, größere Bildschirme über `min-width`.
- **JavaScript** ohne Bibliotheken: `js/seite.js` (Sprachumschaltung, Menü, Karussells, Einblenden), `js/einwilligung.js` (Cookie-Banner, Google und Meta erst nach Einwilligung).
- **Ausgeliefert über GitHub Pages** direkt aus `main` (Stamm). Eine Änderung ist nach etwa einer Minute online.
- Keine Zusatzpakete, kein `package.json`. Das Filmmakers-Skript nutzt nur Node-Bordmittel.

## Zweisprachig DE/EN

Beide Sprachen stehen im selben HTML: `<span data-l="de">…</span><span data-l="en">…</span>` (oder `div`/`ul`). CSS blendet die andere Sprache aus, `js/seite.js` schaltet um und merkt sich die Wahl. Alt-Texte über `data-alt-de`/`data-alt-en`, Aria-Labels über `data-aria-de`/`data-aria-en`, Seitentitel über `<meta name="titel" data-titel-de data-titel-en>`. Ohne JavaScript erscheint Deutsch. Englische Texte sind Übersetzungsvorschläge von Claude, Alina liest gegen. Rechtstexte nur auf Deutsch.

## Filmmakers ist die Datenquelle

Steckbrief, Film/TV, Theater, Rollen im Studium, Hörspiel, Ausbildung, Weiterbildung, Preise kommen aus `daten/filmmakers.json` und werden **nicht von Hand im HTML gepflegt**.

- `skripte/filmmakers.mjs` setzt die Daten zwischen `<!-- filmmakers:NAME -->` und `<!-- /filmmakers:NAME -->` in alle HTML-Dateien ein. Lokal: `node skripte/filmmakers.mjs`.
- `.github/workflows/filmmakers.yml` läuft täglich, bei Änderungen an Daten/Skript und per Hand, und committet Änderungen.
- Mit den Secrets `FILMMAKERS_API_TOKEN` und `FILMMAKERS_PROFILE_ID` holt das Skript die Daten über die offizielle API (`https://www.filmmakers.eu/api/v1/actor_profiles/{id}`, Header `Authorization: Token token=…`). **Kein Scraping** (AGB §10).
- Stand 14.11.2026: noch kein Key. `daten/filmmakers.json` ist der Snapshot aus `inhalte/website-inhalte.md`. Die Zuordnung API → JSON (`apiUmwandeln`) ist erst mit Key schreibbar; bis dahin protokolliert das Skript nur die Feldnamen und behält den Stand.
- Vor jeder Rückfrage an Alina erst die Filmmakers-Daten prüfen.

## Fotos und Medien

- Nur freigegebene Fotos aus `material/fotos/Freigegebne Bilder mit Credits /`, immer mit Credit („Foto: …“). Nicht freigegeben: serie-alina-t, serie-sw-img, s/w-Versionen, 0426_02.
- Fotos liegen als WebP in `img/` in zwei Breiten (`-800`, `-1600`), Dateiname nach Fotograf:in und Nummer der freigegebenen Datei (z. B. `stella-butz-2026-15` = „Stella Butz 2026 15.jpeg“).
- `medien/showreel-2026.mp4` (720p, ca. 9 MB) und `medien/hoerprobe.mp3` liegen selbst gehostet hier, laden erst beim Abspielen (`preload="none"`). Rollenvideos und About me (je über 100 MB) sind noch nicht eingebunden; Hosting offen.
- Originale und `material/` nie ins Repo.

## Rechtlich sicher

- Google (GA4, Consent Mode v2) und Meta-Pixel laden **erst nach Einwilligung**. IDs in `js/einwilligung.js` (`KONFIG`). Leere IDs = nichts wird geladen, Banner erscheint trotzdem.
- Banner: „Alle ablehnen“ und „Alle akzeptieren“ gleichwertig, Einstellungen pro Kategorie, Widerruf über „Cookies“ im Fuß. Die Einwilligung (Version, Zeit, zufällige Kennung) liegt im `localStorage`. Ändern sich Zwecke: `version` erhöhen.
- Schriften (Newsreader), Bilder, Videos selbst gehostet; keine externen Einbindungen ohne Zwei-Klick-Lösung.
- `impressum.html` und `datenschutz.html` sind Entwürfe mit markierten offenen Stellen (`class="offen"`), vor Livegang prüfen lassen.
- Bis zum Livegang: `<meta name="robots" content="noindex, nofollow">` in jeder Seite und `robots.txt` mit `Disallow: /`.
- Keine privaten Daten aus Lebenslauf/Bachelorarbeit (Telefon, Anschrift, Geburtsdatum), die Schule der Theater-AG nicht nennen.

## Gestaltung (Entwurf 7)

Schrift Newsreader (eine Familie, Kursiv nur für Rollennamen). Papier `#fbf9f4`, Tinte `#2a2118`, PANTONE 18-0425 TSX Commander Green `#6b6c45`, hell `#e9e9dc`, Coaching `#d2d3b6`. Wortmarke „alina — thiemann“ klein in Grün, viel Kleinschreibung, keine Pfeil-Zeichen, Links fein unterstrichen. Karussells mit Wischen, Pfeilknöpfen, Punkten; Startbilder laufen von selbst (Pause-Knopf, „Bewegung reduzieren“ wird respektiert).

## Arbeitsweise

- Auf Deutsch mit Dennis, auch Commits und Kommentare. Website-Texte gendergerecht mit Doppelpunkt, Alinas Texte in Ich-Form.
- Änderungen über Branches und Pull Requests, Dennis prüft.
- Erst auf dem Handy (ca. 375 px) prüfen, dann Desktop. Nichts darf waagerecht überlaufen.
- CMS (Sveltia) kommt in einem zweiten Schritt: Texte und Fotos als JSON, eingesetzt vom selben Skript-Prinzip wie Filmmakers.
