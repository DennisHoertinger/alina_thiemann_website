/* Website Alina Thiemann – Verhalten ohne Zusatzbibliotheken:
   Sprachumschaltung DE/EN, Menü, Karussells, Einblenden. */
(function () {
  "use strict";
  var html = document.documentElement;
  var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sprache ---------- */
  function setzeSprache(s) {
    html.setAttribute("data-sprache", s);
    html.setAttribute("lang", s);
    try { localStorage.setItem("sprache", s); } catch (e) {}
    document.querySelectorAll("[data-titel-" + s + "]").forEach(function (el) {
      document.title = el.getAttribute("data-titel-" + s);
    });
    document.querySelectorAll("[data-alt-de]").forEach(function (img) {
      img.alt = img.getAttribute("data-alt-" + s) || "";
    });
    document.querySelectorAll("[data-aria-de]").forEach(function (el) {
      el.setAttribute("aria-label", el.getAttribute("data-aria-" + s));
    });
    document.querySelectorAll(".sprache").forEach(function (b) {
      b.textContent = s === "de" ? "en" : "de";
      b.setAttribute("aria-label", s === "de" ? "Switch to English" : "Auf Deutsch umschalten");
    });
    document.dispatchEvent(new CustomEvent("sprachwechsel", { detail: s }));
  }
  document.querySelectorAll(".sprache").forEach(function (b) {
    b.addEventListener("click", function () {
      setzeSprache(html.getAttribute("data-sprache") === "de" ? "en" : "de");
    });
  });
  setzeSprache(html.getAttribute("data-sprache") || "de");

  /* ---------- Kopfleiste: transparent, fest oben ---------- */
  var kopf = document.querySelector(".kopf");
  var hero = document.querySelector(".hero");
  if (kopf) {
    var kopfPruefen = function () {
      var ueberBild = !!hero && hero.getBoundingClientRect().bottom > kopf.offsetHeight;
      kopf.classList.toggle("ueber-bild", ueberBild);
      kopf.classList.toggle("gescrollt", !ueberBild && window.scrollY > 4);
    };
    kopfPruefen();
    window.addEventListener("scroll", kopfPruefen, { passive: true });
    window.addEventListener("resize", kopfPruefen);
  }

  /* ---------- Menü ---------- */
  var menue = document.getElementById("menue");
  var burger = document.querySelector(".burger");
  if (menue && burger) {
    var zu = menue.querySelector(".zu");
    function oeffnen() {
      menue.classList.add("offen");
      menue.removeAttribute("inert");
      burger.setAttribute("aria-expanded", "true");
      zu.focus();
    }
    function schliessen() {
      menue.classList.remove("offen");
      menue.setAttribute("inert", "");
      burger.setAttribute("aria-expanded", "false");
      burger.focus();
    }
    burger.addEventListener("click", oeffnen);
    zu.addEventListener("click", schliessen);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menue.classList.contains("offen")) schliessen();
    });
  }

  /* ---------- Karussells ---------- */
  document.querySelectorAll(".karussell").forEach(function (wrap) {
    var spur = wrap.querySelector(".spur");
    var bilder = spur.children;
    var punkte = wrap.querySelectorAll(".punkte i");
    var schritt = function () {
      var a = bilder[0].getBoundingClientRect(), b = bilder[1] ? bilder[1].getBoundingClientRect() : a;
      return (b.left - a.left) || a.width;
    };
    var aktuell = function () { return Math.round(spur.scrollLeft / schritt()); };
    var letzte = function () {
      return Math.max(0, Math.round((spur.scrollWidth - spur.clientWidth) / schritt()));
    };
    function zeige(i) {
      var n = letzte();
      if (i > n) i = 0;
      if (i < 0) i = n;
      spur.scrollTo({ left: i * schritt(), behavior: ruhig ? "auto" : "smooth" });
    }
    function punkteSetzen() {
      var i = aktuell();
      punkte.forEach(function (p, j) { p.classList.toggle("an", j === i); });
    }
    /* Auf breiten Bildschirmen sind mehrere Bilder gleichzeitig sichtbar: überzählige Punkte ausblenden */
    function punkteZaehlen() {
      var n = letzte();
      punkte.forEach(function (p, j) { p.style.display = j > n ? "none" : ""; });
    }
    punkteZaehlen();
    window.addEventListener("resize", punkteZaehlen);
    var tick;
    spur.addEventListener("scroll", function () {
      cancelAnimationFrame(tick);
      tick = requestAnimationFrame(punkteSetzen);
    }, { passive: true });

    var weiter = wrap.querySelector(".weiter"), zurueck = wrap.querySelector(".zurueck");
    if (weiter) weiter.addEventListener("click", function () { zeige(aktuell() + 1); });
    if (zurueck) zurueck.addEventListener("click", function () { zeige(aktuell() - 1); });
    spur.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); zeige(aktuell() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); zeige(aktuell() - 1); }
    });

    /* Startbilder laufen von selbst weiter, außer bei "Bewegung reduzieren",
       Pause-Knopf, Finger auf dem Bild oder wenn das Karussell nicht sichtbar ist. */
    if (wrap.hasAttribute("data-auto")) {
      var pause = wrap.querySelector(".pause");
      var angehalten = ruhig, beruehrt = false;
      if (pause) {
        pause.setAttribute("aria-pressed", String(angehalten));
        pause.addEventListener("click", function () {
          angehalten = !angehalten;
          pause.setAttribute("aria-pressed", String(angehalten));
        });
      }
      ["pointerdown", "focusin", "mouseenter"].forEach(function (ev) {
        wrap.addEventListener(ev, function () { beruehrt = true; });
      });
      ["pointerup", "focusout", "mouseleave"].forEach(function (ev) {
        wrap.addEventListener(ev, function () { beruehrt = false; });
      });
      setInterval(function () {
        if (angehalten || beruehrt || document.hidden) return;
        if (spur.getBoundingClientRect().bottom < 0) return;
        zeige(aktuell() + 1);
      }, 5000);
    }
  });

  /* ---------- Einblenden beim Scrollen ---------- */
  if (!ruhig && "IntersectionObserver" in window) {
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("sichtbar"); beob.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".einblenden").forEach(function (el) { beob.observe(el); });
  } else {
    document.querySelectorAll(".einblenden").forEach(function (el) { el.classList.add("sichtbar"); });
  }
})();
