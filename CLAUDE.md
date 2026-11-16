# CLAUDE.md – Website Alina Thiemann (Code)

Persönliche Website der Schauspielerin **Alina Thiemann** (Berlin, ADK Baden-Württemberg 2026), gebaut von Dennis Hörtinger. Erste Website einer Reihe für Schauspielende: Aufbau so halten, dass er sich für weitere Schauspieler:innen kopieren lässt.

Planung, Texte, Design-Entwürfe, Protokolle und Rohmaterial liegen **nicht** hier, sondern in Dennis' Projektordner `/Applications/Development/2026_Alinas Website ` (Ordnername endet mit Leerzeichen). Quelle der Wahrheit für Texte ist dort `inhalte/website-inhalte.md`, für Fotos `inhalte/fotos-credits.md`, für das Design `design/musterbogen/entwurf-7-iphone.html` (abgenommen 14.11.2026).

## Technik: bewusst schlicht (Entscheidung Dennis, 14.11.2026)

Kein Framework, kein Baukasten, kein Build-Schritt.

- **HTML**: jede Unterseite ist eine eigene Datei im Stamm (`index.html`, `vita.html`, `steckbrief.html`, `film.html`, `theater.html`, `ausbildung.html`, `medien.html`, `coaching.html`, `kontakt.html`, `impressum.html`, `datenschutz.html`, `404.html`). `kamera.html` und `buehne.html` sind nur noch Weiterleitungen auf die neuen Adressen (für alte Links). Kopf, Menü, Fuß und Consent-Banner stehen in jeder Datei gleich; bei Änderungen alle Dateien anpassen.
- **CSS**: eine Datei `css/stil.css` mit Design-Tokens oben. Mobile first, größere Bildschirme über `min-width`.
- **JavaScript** ohne Bibliotheken: `js/seite.js` (Sprachumschaltung, Menü, Karussells, Einblenden), `js/einwilligung.js` (Cookie-Banner, Google und Meta erst nach Einwilligung).
- **Ausgeliefert über GitHub Pages** aus dem Repo `alina-thiemann/alina_thiemann_website` (Organisation seit 16.11.2026), direkt aus `main` (Stamm) unter **alinathiemann.de** (Datei `CNAME`, umgestellt 16.11.2026 auf Dennis' Wunsch; DNS bei INWX). Eine Änderung ist nach etwa einer Minute online.
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
- Ergänzungen, die nicht auf Filmmakers stehen (`link`, `notiz`, `linktext` bei Ausbildung, `bilder`/`foto` bei Theater, `video` und `auswahl` bei Film), bleiben beim API-Abgleich erhalten.
- **Aktuell (News)**: `daten/news.json` (nicht Filmmakers), eingesetzt vom selben Skript in den Block `news` auf der Startseite, als Laufschrift direkt unter den Startbildern (Alina 16.11.2026, mit Pause-Knopf, steht bei „Bewegung reduzieren“ still). Neueste Meldung oben.

## Seitenstruktur (Dennis 16.11.2026, nach Website-Analyse)

Menü als Einzelseiten ohne Unterpunkte: **Start, Vita, Film, Theater, Medien, Coaching, Kontakt**. Struktur darf optimiert werden; Fotos und Design entscheidet Alina. Die Vita-Struktur bleibt dabei unverändert (Dennis 16.11.2026: „Ich wollte nur das Menü ändern“): Vita ist Übersicht mit vier Karten zu Steckbrief, Film, Theater, Ausbildung; diese vier Seiten tragen oben und unten die Leiste `nav.unterseiten` (übersicht, steckbrief, film, theater, ausbildung).

- Start: Startbild mit zwei Knöpfen „Showreel ansehen“ (springt zu `#videos`) und „Vita (PDF)“ (Filmmakers-PDF), Laufschrift „Aktuell“, About me und Theater-Showreel, Über mich ohne „Das mag ich spielen“/„Persönliches“, Stücktitel unter Bühnenfotos verlinkt.
- `vita.html`: Kopf mit Porträt, Eckdaten (`vita-kurz`), Schnellzugriff (Vita-PDF, Agentur, E-Mail); Über mich mit „Das mag ich spielen“ und „Persönliches“; dann die vier Wegweiser-Karten.
- `steckbrief.html`: Steckbrief mit Headshots. `ausbildung.html`: Ausbildung, Weiterbildung, Preise in drei Spalten.
- `film.html`: „Ausgewählte Projekte“ (Block `film-auswahl`, Feld `auswahl: true` in `daten/filmmakers.json`), Filmografie mit Filter (ohne Projekte in Entwicklung), „In Entwicklung“ (Block `film-entwicklung`), Auswahl Kurzfilme (`#kurzfilme`, Anker `video-NAME`), About me.
- `theater.html`: Theater als Kacheln wie ein Produktraster (Bild 4:5 oben, wischbar bei mehreren Fotos aus `bilder`, Text zentriert „Jahr / Titel“, Credit aus `foto`; ohne Foto Platzhalter „Foto folgt“, bleibt (Dennis 16.11.); 2 Spalten Handy, 3 Desktop), Theater-Showreel, gearbeitete Rollen, Hörspiel.
- `medien.html`: gegliedert in Theater, Film und Kamera, Stimme, Fotos. Videos immer mit Jahr und Laufzeit („2026 · 8:19 Min.“).
- Fotos in Karussells (`.fotos .spur`) und Theaterkacheln öffnen sich beim Tippen groß (`dialog.gross` in `js/seite.js`), darin wischen, Esc schließt.
- Kontakt: „Casting und Engagements“ → Agentur, „Coaching und Persönliches“ → E-Mail.

Listen links ausgerichtet, Jahr als eigene Spalte.

## Fotos und Medien

- Nur freigegebene Fotos aus `material/fotos/Freigegebne Bilder mit Credits /`, immer mit Credit („Foto: …“). Nicht freigegeben: serie-alina-t, serie-sw-img, s/w-Versionen, 0426_02.
- Fotos liegen als WebP in `img/` in zwei Breiten (`-800`, `-1600`), Dateiname nach Fotograf:in und Nummer der freigegebenen Datei (z. B. `stella-butz-2026-15` = „Stella Butz 2026 15.jpeg“).
- `medien/showreel-2026.mp4` (Theater-Showreel, 720p, ca. 9 MB), `medien/about-me-2026.mp4` (720p, ca. 26 MB), die Kurzfilme `medien/zorge-2026.mp4` und `medien/ballet-rivalry-2026.mp4` (720p) und `medien/hoerprobe.mp3` liegen selbst gehostet hier, laden erst beim Abspielen (`preload="none"`). Videos bleiben unter 100 MB (GitHub-Grenze). Kurzfilme stehen auf Medien und Film (`film.html#kurzfilme`, Anker `video-NAME`); in `daten/filmmakers.json` verweist das Feld `video` aus der Filmografie darauf. Showreel Film/TV und Rollenvideos fehlen noch.
- `medien/bachelorarbeit-alina-thiemann.pdf`: Bachelorarbeit ohne private Daten (Deckblatt ohne Anschrift, E-Mail, Matrikelnummer; Seite mit Unterschrift entfernt). Nie das Original verlinken.
- Originale und `material/` nie ins Repo.

## Rechtlich sicher

- Google (GA4, Consent Mode v2) und Meta-Pixel laden **erst nach Einwilligung**. IDs in `js/einwilligung.js` (`KONFIG`). Leere IDs = nichts wird geladen, Banner erscheint trotzdem.
- Banner: „Alle ablehnen“ und „Alle akzeptieren“ gleichwertig, Einstellungen pro Kategorie, Widerruf über „Cookies“ im Fuß. Die Einwilligung (Version, Zeit, zufällige Kennung) liegt im `localStorage`. Ändern sich Zwecke: `version` erhöhen.
- Schriften (Newsreader), Bilder, Videos selbst gehostet; keine externen Einbindungen ohne Zwei-Klick-Lösung.
- `impressum.html` und `datenschutz.html` sind Entwürfe mit markierten offenen Stellen (`class="offen"`), vor Livegang prüfen lassen.
- Bis zum Livegang: `<meta name="robots" content="noindex, nofollow">` in jeder Seite und `robots.txt` mit `Disallow: /`.
- Keine privaten Daten aus Lebenslauf/Bachelorarbeit (Telefon, Anschrift, Geburtsdatum), die Schule der Theater-AG nicht nennen.

## SEO (16.11.2026)

Jede Seite hat eine eigene `description` (gleich in `og:description`), `canonical` und `og:url` mit `https://alinathiemann.de/…`, Teilen-Bild `img/teilen-1200.jpg` (1200×630), `favicon.svg`. Die Startseite trägt JSON-LD `Person` (mit Filmmakers- und Agentur-Link). `sitemap.xml` ist vorbereitet (ohne Impressum/Datenschutz). Neue Seite: Beschreibung, Canonical und Sitemap-Eintrag nicht vergessen. Beim Livegang: `noindex` aus allen Seiten, `robots.txt` auf `Allow: /` plus `Sitemap:`-Zeile, dann Seite in der Google Search Console anmelden.

## Gestaltung (Entwurf 7)

Schrift Newsreader (eine Familie, Kursiv nur für Rollennamen). Papier `#fbf9f4`, Tinte `#2a2118`, PANTONE 18-0425 TSX Commander Green `#6b6c45`, hell `#e9e9dc`, Coaching `#d2d3b6`. Wortmarke „alina — thiemann“ klein in Grün. Kopfleiste fest oben und immer durchsichtig (Dennis, 15.11.2026): Menü, Name und Sprache werden einzeln weiß über Fotos/Videos und schwarz (Tinte) über Papier (`js/seite.js` prüft per `elementsFromPoint`). Alles klein geschrieben per CSS (`body{text-transform:lowercase}`, Wunsch Alina 15.11.2026), keine Pfeil-Zeichen, Links fein unterstrichen. Karussells mit Wischen, Pfeilknöpfen, Punkten; Startbilder laufen von selbst (Pause-Knopf, „Bewegung reduzieren“ wird respektiert).

## Arbeitsweise

- Auf Deutsch mit Dennis, auch Commits und Kommentare. Website-Texte gendergerecht mit Doppelpunkt, Alinas Texte in Ich-Form.
- Änderungen über Branches und Pull Requests. Dennis (14.11.2026): jede gewünschte Änderung sofort umsetzen, testen und selbst mergen.
- Bei jeder Änderung an CSS oder JS die Version `?v=JJJJMMTT-HHMM` an den Links in allen HTML-Dateien hochzählen (GitHub Pages lässt Browser bis zu 10 Minuten zwischenspeichern).
- Erst auf dem Handy (ca. 375 px) prüfen, dann Desktop. Nichts darf waagerecht überlaufen.
- CMS (Sveltia) kommt in einem zweiten Schritt: Texte und Fotos als JSON, eingesetzt vom selben Skript-Prinzip wie Filmmakers.
