// Holt Alinas Profildaten von Filmmakers und setzt sie in die HTML-Seiten ein.
// Läuft als GitHub Action (täglich, bei Änderungen und nach jedem Speichern im CMS), ohne Zusatzpakete (Node 20+).
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
// 4. Genauso setzt es die Inhalte ein, die Alina im CMS pflegt (Sveltia CMS unter /admin):
//    daten/news.json, daten/texte.json, daten/fotos.json → Markierungen <!-- cms:NAME -->.

import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATEI = join(WURZEL, "daten", "filmmakers.json");
// Aktuelles (News) pflegt Alina/Dennis selbst, nicht Filmmakers. Gleicher Einsetz-Mechanismus.
const NEWS = join(WURZEL, "daten", "news.json");
// Texte und Fotos aus dem CMS (admin/config.yml)
const TEXTE = join(WURZEL, "daten", "texte.json");
const FOTOS = join(WURZEL, "daten", "fotos.json");

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
  // Leeres Englisch (z. B. im CMS nicht ausgefüllt) → Deutsch in beiden Sprachen
  const en = wert.en || wert.de;
  if (wert.de === en) return esc(wert.de);
  return `<span data-l="de">${esc(wert.de)}</span><span data-l="en">${esc(en)}</span>`;
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

// Film auf der Film-Seite als Kacheln, genau wie Theater (Dennis 16.11.2026).
// Bild: "bilder" (Ergänzung) oder das Standbild des Films, wenn er auf der Seite läuft; sonst Platzhalter.
function filmKarte(f) {
  const art = /Kurzfilm/.test(f.art?.de) ? "kurz" : /Ausbildung/.test(f.art?.de) ? "ausbildung" : "kino-tv";
  const alt = (de, en) => `alt="${esc(de)}" data-alt-de="${esc(de)}" data-alt-en="${esc(en)}"`;
  const altText = alt(`Alina Thiemann in „${f.titel}“`, `Alina Thiemann in “${f.titel}”`);
  const bilder = f.bilder || [];
  let bild;
  if (bilder.length) {
    bild = `<div class="reihe" tabindex="0" aria-label="${esc(f.titel)}">` +
      bilder.map((b) => `<img src="img/${esc(b)}-800.webp" srcset="img/${esc(b)}-800.webp 800w, img/${esc(b)}-1600.webp 1600w" sizes="(min-width:1100px) 360px, (min-width:760px) 33vw, 50vw" width="800" height="1000" ${altText} loading="lazy" decoding="async">`).join("") +
      `</div>`;
  } else if (f.video) {
    bild = `<a class="standbild" href="film.html#video-${esc(f.video)}"><img src="img/${esc(f.video)}-standbild.webp" ${altText} loading="lazy" decoding="async"></a>`;
  } else {
    bild = `<div class="platzhalter" aria-hidden="true"><span>${beide("Foto folgt", "Photo to come")}</span></div>`;
  }
  const info = [t(f.art), t(f.rollentyp), `${beide("Regie", "Dir.")} ${esc(f.regie)}`];
  const fuss = [];
  if (f.video) fuss.push(`<a class="link" href="film.html#video-${esc(f.video)}">${beide("Film ansehen", "Watch the film")}</a>`);
  if (bilder.length > 1) fuss.push(beide(`${bilder.length} Fotos`, `${bilder.length} photos`));
  if (f.foto) fuss.push(beide("Foto: " + f.foto, "Photo: " + f.foto));
  return `<li class="stueck" data-art="${art}"><div class="stueck-bild">${bild}</div>` +
    `<p class="stueck-titel"><span class="jahr">${esc(f.jahr)}</span> / ${link(f.link, esc(f.titel))}</p>` +
    (f.rolle ? `<p class="rolle">${esc(f.rolle)}</p>` : "") +
    `<p class="stueck-info">${info.join(" · ")}<br>${esc(f.produktion)}</p>` +
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
  return `<li><span class="jahr">${esc(a.jahr)}</span><span class="details" style="font-size:var(--text);color:inherit">${t(a.text)}</span>${notiz}${verweis}</li>`;
}

// Aktuell als Laufschrift (Wunsch Alina 16.11.2026): Meldungen laufen als eine Zeile durch.
// Die Spur steht zweimal hintereinander, damit die Bewegung nahtlos ist; die Kopie ist für Screenreader verborgen.
function newsBlock(n) {
  if (!n || !n.eintraege) return "";
  n = { ...n, eintraege: n.eintraege.filter((e) => e && e.titel?.de) };
  if (!n.eintraege.length) return "";
  const meldung = (e) => {
    const datum = e.datum?.de ?? "";
    const vorne = !datum || /^\d{4}$/.test(datum) ? "" : `<span class="datum">${t(e.datum)}</span> `;
    const titel = e.link ? `<a href="${esc(e.link)}" rel="noopener" target="_blank">${t(e.titel)}</a>` : t(e.titel);
    return `<span class="meldung">${vorne}${titel}${e.ort?.de ? `, <span class="ort-zeile">${t(e.ort)}</span>` : ""}</span>`;
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
  const kacheln = (eintraege) => `<ul class="stuecke">\n${eintraege.join("\n")}\n</ul>`;
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
    "film-auswahl": kacheln(d.film.filter((f) => f.auswahl && !f.inEntwicklung).map(filmKarte)),
    "film-entwicklung": kacheln(d.film.filter((f) => f.inEntwicklung).map(filmKarte)),
    film: kacheln(d.film.filter((f) => !f.inEntwicklung).map(filmKarte)),
    theater: kacheln(d.theater.map(theaterKarte)),
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


// ---------- CMS-Blöcke (Texte und Fotos, die Alina selbst pflegt) ----------

// Fließtext aus dem CMS: Leerzeile = neuer Absatz, einfacher Zeilenumbruch = <br>.
// *so* wird kursiv (z. B. Rollennamen), [Text](https://…) wird ein Link. Sonst kein HTML.
function absaetze(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => {
      let h = esc(a);
      h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g, (_, txt, url) =>
        `<a class="link" href="${url}"${url.startsWith("http") ? ' rel="noopener" target="_blank"' : ""}>${txt}</a>`);
      h = h.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
      return `<p>${h.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}
const zweiSprachen = (wert) =>
  `<div data-l="de">\n${absaetze(wert?.de)}\n</div>\n<div data-l="en">\n${absaetze(wert?.en || wert?.de)}\n</div>`;

// Foto: "img/NAME-1600.webp" mit vorhandener -800-Fassung bekommt srcset, sonst (z. B. hochgeladen
// nach img/cms/) wird die Datei direkt genutzt. Pfade immer relativ zum Stamm.
function fotoImg(f, sizes, extra) {
  const pfad = String(f.bild ?? "").replace(/^\//, "");
  const m = pfad.match(/^img\/(.+)-1600\.webp$/);
  const quelle = m && existsSync(join(WURZEL, "img", `${m[1]}-800.webp`))
    ? `src="img/${esc(m[1])}-800.webp" srcset="img/${esc(m[1])}-800.webp 800w, img/${esc(m[1])}-1600.webp 1600w" sizes="${sizes}"`
    : `src="${esc(pfad)}"`;
  const de = f.alt?.de || "Alina Thiemann";
  const en = f.alt?.en || de;
  return `<img ${quelle} alt="${esc(de)}" data-alt-de="${esc(de)}" data-alt-en="${esc(en)}" ${extra}>`;
}
const sichtbare = (liste) => (liste || []).filter((f) => f && f.bild && f.sichtbar !== false);

// Fotostrecke mit Credit unter jedem Foto (Start und Medien)
const fotoSpur = (liste) =>
  `  <div class="spur" tabindex="0" aria-label="Fotos" data-aria-de="Fotos" data-aria-en="Photos">\n` +
  sichtbare(liste).map((f) =>
    `    <figure>${fotoImg(f, "(min-width:1100px) 33vw, (min-width:760px) 50vw, 100vw", 'loading="lazy" decoding="async"')}` +
    (f.credit ? `<figcaption>${beide("Foto: " + f.credit, "Photo: " + f.credit)}</figcaption>` : "") + `</figure>`).join("\n") +
  `\n  </div>`;

function cmsBloecke(texte, fotos) {
  const b = {};
  if (texte) {
    b["ueber-mich"] = `  <div class="text">\n${zweiSprachen(texte.ueberMich)}\n  </div>`;
    b["mag-ich-spielen"] = `  <div class="text">\n${zweiSprachen(texte.magIchSpielen)}\n  </div>`;
    const eig = (l) => `    <ul class="eigenschaften" data-l="${l}">\n` +
      (texte.persoenliches || []).map((p) => `      <li><span class="etikett">${esc(p.etikett?.[l] || p.etikett?.de)}</span>${esc(p.text?.[l] || p.text?.de)}</li>`).join("\n") +
      `\n    </ul>`;
    b.persoenliches = `  <div class="text">\n${eig("de")}\n${eig("en")}\n  </div>`;
    const c = texte.coaching || {};
    b.coaching =
      `    <span class="kaps">${t(c.untertitel)}</span>\n${zweiSprachen(c.text)}\n` +
      `    <ul class="eckdaten">\n` +
      (c.eckdaten || []).map((e) => `      <li><span>${beide(e.etikett?.de, e.etikett?.en || e.etikett?.de)}</span>` +
        `<span data-l="de">${esc(e.text?.de)}</span><span data-l="en">${esc(e.text?.en || e.text?.de)}</span></li>`).join("\n") +
      `\n    </ul>`;
  }
  if (fotos) {
    // Startbilder ohne Credit-Zeile (wie bisher); das erste lädt sofort, die übrigen später
    b.startbilder = `  <div class="spur">\n` +
      sichtbare(fotos.start).map((f, i) =>
        `    <figure>${fotoImg(f, "(min-width:1100px) 50vw, 100vw", i === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"')}</figure>`).join("\n") +
      `\n  </div>`;
    b.fotos = fotoSpur(fotos.fotos);
    b["fotos-medien"] = fotoSpur(fotos.medien);
  }
  return b;
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
  const lesen = async (pfad) => {
    try { return JSON.parse(await readFile(pfad, "utf8")); } catch (fehler) {
      if (fehler.code !== "ENOENT") throw new Error(`${pfad} ist kein gültiges JSON: ${fehler.message}`);
      return null;
    }
  };
  const b = { ...bloecke(daten, news), ...cmsBloecke(await lesen(TEXTE), await lesen(FOTOS)) };
  let geaendert = 0;
  for (const datei of await htmlDateien(WURZEL)) {
    const alt = await readFile(datei, "utf8");
    const neu = alt.replace(
      /(<!-- (filmmakers|cms):([a-z-]+) -->)[\s\S]*?(<!-- \/\2:\3 -->)/g,
      (ganz, auf, art, name, zu) => {
        if (!(name in b)) { console.warn(`Unbekannter Block "${name}" in ${datei}`); return ganz; }
        return `${auf}\n${b[name]}\n${zu}`;
      }
    );
    if (neu !== alt) { await writeFile(datei, neu); geaendert++; }
  }
  console.log(`${geaendert} HTML-Datei(en) aktualisiert.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
