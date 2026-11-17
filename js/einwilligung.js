/* Einwilligungs-Banner (Cookie-Banner) ohne Fremdanbieter.
   Google (GA4) und Meta-Pixel laden erst NACH aktiver Einwilligung.
   Vorher: keine Skripte, keine Cookies, keine Anfragen an Google oder Meta. */
(function () {
  "use strict";

  /* ---- Einstellungen: IDs eintragen, sobald die Konten angelegt sind ---- */
  var KONFIG = {
    googleId: "G-LLQPLBFDLJ", // GA4-Mess-ID (Dennis 17.11.2026)
    metaPixelId: "1627555221597219", // Meta-Pixel/Datensatz (Dennis 17.11.2026)
    version: 1         // erhöhen, wenn sich Zwecke ändern: Banner erscheint dann erneut
  };

  var SCHLUESSEL = "einwilligung";
  var banner = document.getElementById("consent");
  if (!banner) return;

  function lesen() {
    try {
      var w = JSON.parse(localStorage.getItem(SCHLUESSEL) || "null");
      return w && w.version === KONFIG.version ? w : null;
    } catch (e) { return null; }
  }

  function speichern(statistik, marketing) {
    var vorher = lesen();
    var w = {
      version: KONFIG.version,
      statistik: !!statistik,
      marketing: !!marketing,
      zeit: new Date().toISOString(),
      /* Nachweis-Kennung: zufällig, ohne Personenbezug */
      id: (vorher && vorher.id) || Math.random().toString(36).slice(2) + Date.now().toString(36)
    };
    try { localStorage.setItem(SCHLUESSEL, JSON.stringify(w)); } catch (e) {}
    var widerruf = vorher && ((vorher.statistik && !w.statistik) || (vorher.marketing && !w.marketing));
    if (widerruf) {
      cookiesLoeschen();
      location.reload();   // bereits geladene Skripte sicher entfernen
      return;
    }
    anwenden(w);
    schliessen();
  }

  function cookiesLoeschen() {
    var host = location.hostname.replace(/^www\./, "");
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (/^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/.test(name)) {
        ["", "; domain=" + host, "; domain=." + host].forEach(function (d) {
          document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
        });
      }
    });
  }

  var geladen = { google: false, meta: false };

  function anwenden(w) {
    if (w.statistik && KONFIG.googleId && !geladen.google) {
      geladen.google = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      /* Google Consent Mode v2: Standard "verweigert", dann nur das Erlaubte freigeben */
      gtag("consent", "default", {
        ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
        analytics_storage: "denied", wait_for_update: 500
      });
      gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: w.marketing ? "granted" : "denied",
        ad_user_data: w.marketing ? "granted" : "denied",
        ad_personalization: w.marketing ? "granted" : "denied"
      });
      gtag("js", new Date());
      gtag("config", KONFIG.googleId);
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(KONFIG.googleId);
      document.head.appendChild(s);
    }
    if (w.marketing && KONFIG.metaPixelId && !geladen.meta) {
      geladen.meta = true;
      /* offizieller Meta-Pixel-Ladecode, erst nach Einwilligung ausgeführt */
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      fbq("consent", "grant");
      fbq("init", KONFIG.metaPixelId);
      fbq("track", "PageView");
    }
  }

  var statistikFeld = banner.querySelector('[name="statistik"]');
  var marketingFeld = banner.querySelector('[name="marketing"]');
  var auswahl = banner.querySelector(".auswahl");
  var einstellen = banner.querySelector(".einstellen");
  var speichernKnopf = banner.querySelector(".speichern");
  var letzterFokus = null;

  function oeffnen(mitEinstellungen) {
    var w = lesen();
    statistikFeld.checked = !!(w && w.statistik);
    marketingFeld.checked = !!(w && w.marketing);
    auswahl.hidden = !mitEinstellungen;
    speichernKnopf.hidden = !mitEinstellungen;
    einstellen.hidden = !!mitEinstellungen;
    letzterFokus = document.activeElement;
    banner.hidden = false;
    banner.querySelector("h2").focus();
  }
  function schliessen() {
    banner.hidden = true;
    if (letzterFokus && letzterFokus.focus) letzterFokus.focus();
  }

  banner.querySelector(".alle-ablehnen").addEventListener("click", function () { speichern(false, false); });
  banner.querySelector(".alle-annehmen").addEventListener("click", function () { speichern(true, true); });
  einstellen.addEventListener("click", function () {
    auswahl.hidden = false; speichernKnopf.hidden = false; einstellen.hidden = true;
  });
  speichernKnopf.addEventListener("click", function () {
    speichern(statistikFeld.checked, marketingFeld.checked);
  });
  /* Widerruf jederzeit: Link "Cookies" im Fuß jeder Seite */
  document.querySelectorAll("[data-einwilligung-oeffnen]").forEach(function (b) {
    b.addEventListener("click", function () { oeffnen(true); });
  });

  var w = lesen();
  if (w) anwenden(w); else oeffnen(false);
})();
