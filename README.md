# alinathiemann.de

Website der Schauspielerin Alina Thiemann. Reines HTML, CSS und JavaScript ohne Framework, ausgeliefert über GitHub Pages.

## Ansehen

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Aufbau

| Pfad | Inhalt |
|---|---|
| `*.html` | eine Datei pro Seite, Deutsch und Englisch in derselben Datei |
| `css/stil.css` | Farben, Schriften, Abstände, Handy zuerst |
| `js/seite.js` | Sprachumschaltung, Menü, Karussells |
| `js/einwilligung.js` | Cookie-Banner; Google und Meta erst nach Einwilligung |
| `daten/filmmakers.json` | Vita-Daten von Filmmakers (Übergangsstand bis zum API-Key) |
| `skripte/filmmakers.mjs` | holt Filmmakers-Daten und setzt sie in die Seiten ein |
| `.github/workflows/filmmakers.yml` | führt das Skript täglich aus |
| `img/`, `medien/`, `fonts/` | Fotos (WebP), Showreel, Hörprobe, Schrift |

Vita-Abschnitte zwischen `<!-- filmmakers:… -->`-Markierungen nicht von Hand ändern, sondern `daten/filmmakers.json` (bzw. später Filmmakers selbst).

## Einrichten

1. **GitHub Pages**: Settings → Pages → Deploy from a branch → `main` / `(root)`. Für private Repos braucht GitHub Pages ein bezahltes Konto (GitHub Pro).
2. **Filmmakers**: Secrets `FILMMAKERS_API_TOKEN` und `FILMMAKERS_PROFILE_ID` anlegen, sobald der Key da ist.
3. **Tracking**: GA4-Mess-ID und Meta-Pixel-ID in `js/einwilligung.js` eintragen.
4. **Domain (umgestellt 16.11.2026)**: Datei `CNAME` mit `alinathiemann.de`. DNS bei INWX: A-Records für `@` auf 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; AAAA auf 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153; CNAME `www` auf `alina-thiemann.github.io` (Repo seit 16.11.2026 in der Organisation `alina-thiemann`). Danach in Settings → Pages „Enforce HTTPS“.
5. **Livegang**: `noindex` aus allen Seiten entfernen, `robots.txt` öffnen, Impressum und Datenschutz final prüfen lassen.
