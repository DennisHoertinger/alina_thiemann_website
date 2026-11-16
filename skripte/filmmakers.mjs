// Holt Alinas Profildaten von Filmmakers und setzt sie in die HTML-Seiten ein.
// Läuft als GitHub Action (täglich und bei Änderungen), ohne Zusatzpakete (Node 20+).
//
//   node skripte/filmmakers.mjs
//
// Ablauf:
// 1. Ist FILMMAKERS_API_TOKEN gesetzt, werden die Daten über die offizielle API geholt
//    (https://api.filmmakers.eu, Header "Authorization: Token token=…") und nach
//    daten/filmmakers.json geschrieben. Kein Scraping (AGB §10).
// 2. Ohne Token oder bei einem Fehler bleibt der letzte Stand in daten/filmmakers.json.
// 3. Aus daten/filmmakers.json entstehen HTML-Blöcke, die zwischen den Markierungen
//    <!-- filmmakers:NAME --> … <!-- /filmmakers:NAME --> in allen *.html-Dateien ersetzt werden.

import { readFile, writeFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATEI = join(WURZEL, "daten", "filmmakers.json");
// Aktuelles (News) pflegt Alina/Dennis selbst, nicht Filmmakers. Gleicher Einsetz-Mechanismus.
const NEWS = join(WURZEL, "daten", "news.json");

// ---------- 1. Daten holen ----------

async function vonApiHolen(alt) {
  const token = process.env.FILMMAKERS_API_TOKEN;
  const profilId = process.env.FILMMAKERS_PROFILE_ID;
  if (!token || !profilId) {
    console.log("Kein FILMMAKERS_API_TOKEN/FILMMAKERS_PROFILE_ID gesetzt: nutze daten/filmmakers.json.");
    return null;
  }
  const url = `https://www.filmmakers.eu/api/v1/actor_profiles/${encodeURIComponent(profilId)}`;
  const antwort = await fetch(url, {
    headers: { Authorization: `Token token=${token}`, Accept: "application/json" },
  });
  if (!antwort.ok) throw new Error(`Filmmakers-API antwortet mit ${antwort.status}`);
  const roh = await antwort.json();
  return apiUmwandeln(roh, alt);
}

// Wandelt die API-Antwort in das Format von daten/filmmakers.json um.
// Der genaue Aufbau der API-Antwort ist erst mit Key prüfbar. Bis die Zuordnung
// geschrieben ist, werden nur die Feldnamen protokolliert (keine Inhalte, keine
// privaten Daten) und der bisherige Stand bleibt erhalten.
function apiUmwandeln(roh, alt) {
  const felder = (o) => (o && typeof o === "object" ? Object.keys(o).join(", ") : typeof o);
  console.log("API erreichbar. Felder der Antwort:", felder(roh));
  if (roh && roh.data) console.log("Felder in data:", felder(roh.data));
  console.log("Zuordnung API → filmmakers.json ist noch nicht umgesetzt: bisheriger Stand bleibt.");
  return null;
}

// ---------- 2. HTML erzeugen ----------

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[z]));

// Text in beiden Sprachen: {de, en} → zwei Spans, die per CSS umgeschaltet werden
function t(wert) {
  if (wert == null) return "";
  if (typeof wert === "string") return esc(wert);
  if (wert.de === wert.en) return esc(wert.de);
  return `<span data-l="de">${esc(wert.de)}</span><span data-l="en">${esc(wert.en)}</span>`;
}
const beide = (de, en) => t({ de, en });
const link = (url, inhalt) =>
  url ? `<a class="link" href="${esc(url)}" rel="noopener" target="_blank">${inhalt}</a>` : inhalt;

function filmEintrag(f) {
  const hinweis = f.inEntwicklung ? `<span class="hinweis">${beide("In Entwicklung", "In development")}</span>` : "";
  // data-art: für den Filter auf der Vita-Seite (Kino/TV, Kurzfilm, Ausbildung)
  const art = /Kurzfilm/.test(f.art?.de) ? "kurz" : /Ausbildung/.test(f.art?.de) ? "ausbildung" : "kino-tv";
  // "video" ist eine Ergänzung (nicht auf Filmmakers): Anker des Films auf der Film-Seite
  const video = f.video
    ? `<span class="details"><a class="link" href="film.html#video-${esc(f.video)}">${beide("Film ansehen", "Watch the film")}</a></span>`
    : "";
  return `<li data-art="${art}"><span class="jahr">${esc(f.jahr)}</span><span class="werk">${link(f.link, esc(f.titel))}</span>` +
    `<span class="rolle">${esc(f.rolle)}</span>` +
    `<span class="details">${t(f.art)} · ${t(f.rollentyp)} · ${beide("Regie", "Dir.")} ${esc(f.regie)}<br>${esc(f.produktion)}</span>${video}${hinweis}</li>`;
}

// Theater als Listeneintrag (Kurz-Vita auf der Startseite)
function theaterEintrag(e) {
  const teile = [beide("Theater", "Theatre")];
  if (e.zusatz) teile.push(t(e.zusatz));
  if (e.regie) teile.push(`${beide("Regie", "Dir.")} ${esc(e.regie)}`);
  const titel = esc(e.titel) + (e.autor ? ` <span class="details" style="display:inline">(${esc(e.autor)})</span>` : "");
  return `<li><span class="jahr">${esc(e.jahr)}</span><span class="werk">${link(e.link, titel)}</span>` +
    (e.rolle ? `<span class="rolle">${t(e.rolle)}</span>` : "") +
    `<span class="details">${teile.join(" · ")}<br>${esc(e.haus)}</span></li>`;
}

// Theater auf der Vita als Kacheln (Bild oben, Text zentriert darunter). Ohne Fotos: Platzhalter.
function theaterKarte(e) {
  const bilder = e.bilder || (e.bild ? [e.bild] : []);
  const alt = (de, en) => `alt="${esc(de)}" data-alt-de="${esc(de)}" data-alt-en="${esc(en)}"`;
  const bild = bilder.length
    ? `<div class="reihe" tabindex="0" aria-label="${esc(e.titel)}">` +
      bilder.map((b) => `<img src="img/${esc(b)}-800.webp" srcset="img/${esc(b)}-800.webp 800w, img/${esc(b)}-1600.webp 1600w" sizes="(min-width:1100px) 360px, (min-width:760px) 33vw, 50vw" width="800" height="1000" ${alt(`Alina Thiemann in „${e.titel}“`, `Alina Thiemann in “${e.titel}”`)} loading="lazy" decoding="async">`).join("") +
      `</div>`
    : `<div class="platzhalter" aria-hidden="true"><span>${beide("Foto folgt", "Photo to come")}</span></div>`;
  const info = [];
  if (e.autor) info.push(esc(e.autor));
  if (e.regie) info.push(`${beide("Regie", "Dir.")} ${esc(e.regie)}`);
  if (e.zusatz) info.push(t(e.zusatz));
  const fuss = [];
  if (bilder.length > 1) fuss.push(beide(`${bilder.length} Fotos`, `${bilder.length} photos`));
  if (e.foto) fuss.push(beide("Foto: " + e.foto, "Photo: " + e.foto));
  return `<li class="stueck"><div class="stueck-bild">${bild}</div>` +
    `<p class="stueck-titel"><span class="jahr">${esc(e.jahr)}</span> / ${link(e.link, esc(e.titel))}</p>` +
    (e.rolle ? `<p class="rolle">${t(e.rolle)}</p>` : "") +
    `<p class="stueck-info">${info.length ? info.join(" · ") + "<br>" : ""}${esc(e.haus)}</p>` +
    (fuss.length ? `<p class="stueck-fuss">${fuss.join(" · ")}</p>` : "") + `</li>`;
}

function preisEintrag(p) {
  const text = p.text && (p.text.de || p.text.en) ? `<span class="details">${t(p.text)}</span>` : "";
  return `<li><span class="jahr">${esc(p.jahr)}</span><span class="werk">${link(p.link, t(p.titel))}</span>${text}</li>`;
}

// Ausbildung/Weiterbildung; "notiz" und "link" sind Ergänzungen, die nicht auf Filmmakers stehen
function bildungEintrag(a) {
  const notiz = a.notiz ? `<span class="details">${t(a.notiz)}</span>` : "";
  const verweis = a.link
    ? `<span class="details"><a class="link" href="${esc(a.link)}" rel="noopener" target="_blank">${t(a.linktext || { de: "Mehr", en: "More" })}</a></span>`
    : "";
  return `<li><span class="jahr">${esc(a.jahr)}</span><span class="details" style="font-size:17px;color:inherit">${t(a.text)}</span>${notiz}${verweis}</li>`;
}

// Aktuell als Laufschrift (Wunsch Alina 16.11.2026): Meldungen laufen als eine Zeile durch.
// Die Spur steht zweimal hintereinander, damit die Bewegung nahtlos ist; die Kopie ist für Screenreader verborgen.
function newsBlock(n) {
  if (!n || !n.eintraege || !n.eintraege.length) return "";
  const meldung = (e) => {
    const vorne = /^\d{4}$/.test(e.datum?.de ?? "") ? "" : `<span class="datum">${t(e.datum)}</span> `;
    const titel = e.link ? `<a href="${esc(e.link)}" rel="noopener" target="_blank">${t(e.titel)}</a>` : t(e.titel);
    return `<span class="meldung">${vorne}${titel}${e.ort ? `, <span class="ort-zeile">${t(e.ort)}</span>` : ""}</span>`;
  };
  const zeile = n.eintraege.map(meldung).join('<span class="trenner" aria-hidden="true">·</span>') + '<span class="trenner" aria-hidden="true">·</span>';
  const zeichen = n.eintraege.reduce((z, e) => z + String(e.titel?.de ?? "").length + String(e.ort?.de ?? "").length + 6, 0);
  return `<div class="laufband" style="--dauer:${Math.max(18, Math.round(zeichen * 0.28))}s">` +
    `<span class="laufband-titel"><span data-l="de">aktuell</span><span data-l="en">news</span></span>` +
    `<div class="laufband-fenster"><div class="laufband-spur"><div class="laufband-teil">${zeile}</div><div class="laufband-teil" aria-hidden="true">${zeile}</div></div></div>` +
    `<button class="laufband-pause" type="button" aria-pressed="false" aria-label="Laufschrift anhalten" data-aria-de="Laufschrift anhalten" data-aria-en="Pause ticker"></button></div>`;
}

function bloecke(d, news) {
  const liste = (eintraege) => `<ul class="vita">\n${eintraege.join("\n")}\n</ul>`;
  const datum = new Date(d.stand + "T12:00:00Z");
  const standDe = datum.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
  const standEn = datum.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
  return {
    news: newsBlock(news),
    "start-vita": liste([filmEintrag(d.film[0]), theaterEintrag(d.theater[0]), preisEintrag(d.preise[0])]),
    steckbrief:
      `<dl class="steckbrief">\n` +
      d.steckbrief.map((s) => `<div${String(s.wert?.de ?? s.wert).length > 34 ? ' class="lang"' : ""}><dt>${beide(s.de, s.en)}</dt><dd>${t(s.wert)}</dd></div>`).join("\n") +
      `\n<div><dt>${beide("Agentur", "Agency")}</dt><dd>${link(d.agentur.url, esc(d.agentur.name))}</dd></div>\n</dl>`,
    "vita-kurz":
      `<dl class="kurzdaten">\n` +
      ["Spielalter", "Größe", "Wohnort", "Wohnmöglichkeiten"]
        .map((n) => d.steckbrief.find((s) => s.de === n))
        .filter(Boolean)
        .map((s) => `<div><dt>${beide(s.de, s.en)}</dt><dd>${t(s.wert)}</dd></div>`).join("\n") +
      `\n</dl>`,
    studienrollen:
      `<ul class="rollenraster">\n` +
      d.studium.map((s) => `<li><span class="rolle">${esc(s.rolle)}</span><span class="werk">${esc(s.stueck)}</span><span class="details">${esc(s.autor)}</span></li>`).join("\n") +
      `\n</ul>`,
    // Film-Seite: Auswahl oben ("auswahl": true, Ergänzung), Projekte in Entwicklung getrennt, darunter die Filmografie
    "film-auswahl": liste(d.film.filter((f) => f.auswahl && !f.inEntwicklung).map(filmEintrag)),
    "film-entwicklung": liste(d.film.filter((f) => f.inEntwicklung).map(filmEintrag)),
    film: liste(d.film.filter((f) => !f.inEntwicklung).map(filmEintrag)),
    theater: `<ul class="stuecke">\n${d.theater.map(theaterKarte).join("\n")}\n</ul>`,
    studium: liste(d.studium.map((s) =>
      `<li><span class="werk">${esc(s.stueck)}</span><span class="rolle">${esc(s.rolle)}</span><span class="details">${esc(s.autor)}</span></li>`)),
    hoerspiel: liste(d.hoerspiel.map((h) =>
      `<li><span class="jahr">${esc(h.jahr)}</span><span class="werk">${t(h.titel)}</span><span class="rolle">${esc(h.rolle)}</span>` +
      `<span class="details">${beide("Regie", "Dir.")} ${esc(h.regie)}<br>${esc(h.haus)}</span></li>`)),
    ausbildung: liste(d.ausbildung.map(bildungEintrag)),
    weiterbildung: liste(d.weiterbildung.map(bildungEintrag)),
    preise: liste(d.preise.map(preisEintrag)),
    stand:
      `<p class="quelle">${beide(`Daten von Filmmakers, Stand ${standDe}.`, `Data from Filmmakers, as of ${standEn}.`)} ` +
      `${link(d.profil, beide("Profil auf Filmmakers", "Profile on Filmmakers"))} · ${link(d.vitaPdf, beide("Vita als PDF", "CV as PDF"))}</p>`,
  };
}

// ---------- 3. In die Seiten einsetzen ----------

async function htmlDateien(ordner) {
  const ergebnis = [];
  for (const e of await readdir(ordner, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "vergleich") continue;
    const pfad = join(ordner, e.name);
    if (e.isDirectory()) ergebnis.push(...(await htmlDateien(pfad)));
    else if (e.name.endsWith(".html")) ergebnis.push(pfad);
  }
  return ergebnis;
}

async function main() {
  let daten = JSON.parse(await readFile(DATEI, "utf8"));
  try {
    const neu = await vonApiHolen(daten);
    if (neu) {
      daten = neu;
      await writeFile(DATEI, JSON.stringify(daten, null, 2) + "\n");
      console.log("daten/filmmakers.json aktualisiert.");
    }
  } catch (fehler) {
    // Fällt die API aus, bleibt der letzte Stand online.
    console.warn("Filmmakers nicht erreichbar, nutze letzten Stand:", fehler.message);
  }

  let news = null;
  try { news = JSON.parse(await readFile(NEWS, "utf8")); } catch { console.log("Keine daten/news.json gefunden."); }
  const b = bloecke(daten, news);
  let geaendert = 0;
  for (const datei of await htmlDateien(WURZEL)) {
    const alt = await readFile(datei, "utf8");
    const neu = alt.replace(
      /(<!-- filmmakers:([a-z-]+) -->)[\s\S]*?(<!-- \/filmmakers:\2 -->)/g,
      (ganz, auf, name, zu) => {
        if (!(name in b)) { console.warn(`Unbekannter Block "${name}" in ${datei}`); return ganz; }
        return `${auf}\n${b[name]}\n${zu}`;
      }
    );
    if (neu !== alt) { await writeFile(datei, neu); geaendert++; }
  }
  console.log(`${geaendert} HTML-Datei(en) aktualisiert.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
