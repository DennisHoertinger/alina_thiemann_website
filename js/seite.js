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
  if (kopf) {
    /* Schwarz oder weiß je nach Hintergrund: Für Menü, Name und Sprache wird geprüft,
       ob darunter ein Foto oder Video liegt (dann weiß) oder Papier (dann schwarz). */
    var teile = [kopf.querySelector(".burger"), kopf.querySelector(".marke"), kopf.querySelector(".sprache")].filter(Boolean);
    var dunkelDarunter = function (el) {
      var r = el.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (el.classList.contains("marke")) {
        var t = el.firstChild && document.createRange ? document.createRange() : null;
        if (t) { t.selectNodeContents(el); var tr = t.getBoundingClientRect(); if (tr.width) { x = tr.left + tr.width / 2; y = tr.top + tr.height / 2; } }
      }
      var liste = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
      for (var i = 0; i < liste.length; i++) {
        var u = liste[i];
        if (kopf.contains(u)) continue;
        return u.tagName === "IMG" || u.tagName === "VIDEO" || !!u.closest(".rahmen, .hero");
      }
      return false;
    };
    kopf.classList.remove("ueber-bild");
    kopf.classList.add("selbst");
    var kopfTick;
    var kopfPruefen = function () {
      teile.forEach(function (el) { el.classList.toggle("hell", dunkelDarunter(el)); });
      kopf.classList.toggle("gescrollt", window.scrollY > 4);
    };
    var kopfPlanen = function () { cancelAnimationFrame(kopfTick); kopfTick = requestAnimationFrame(kopfPruefen); };
    kopfPruefen();
    window.addEventListener("scroll", kopfPlanen, { passive: true });
    window.addEventListener("resize", kopfPlanen);
    window.addEventListener("load", kopfPlanen);
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
    /* Laufender Balken am unteren Bildrand statt Punkten */
    var balken = document.createElement("div");
    balken.className = "balken";
    balken.setAttribute("aria-hidden", "true");
    balken.appendChild(document.createElement("i"));
    wrap.appendChild(balken);
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
    /* Breite = sichtbarer Anteil, Lage = Scrollposition; folgt dem Wischen fließend */
    function balkenSetzen() {
      var breit = spur.scrollWidth || 1, sicht = spur.clientWidth || 1;
      balken.style.setProperty("--anteil", Math.min(100, sicht / breit * 100) + "%");
      balken.style.setProperty("--stelle", (spur.scrollLeft / sicht * 100) + "%");
    }
    /* Bei den Foto-Karussells sitzt der Balken direkt unter den Bildern (über der Bildunterschrift) */
    var erstesBild = spur.querySelector("img");
    function balkenLage() {
      if (wrap.classList.contains("fotos") && erstesBild) {
        var oben = erstesBild.getBoundingClientRect().bottom - wrap.getBoundingClientRect().top;
        balken.style.setProperty("--balken-oben", oben + "px");
      }
      balkenSetzen();
    }
    balkenLage();
    window.addEventListener("resize", balkenLage);
    window.addEventListener("load", balkenLage);
    if (erstesBild && !erstesBild.complete) erstesBild.addEventListener("load", balkenLage);
    var tick;
    spur.addEventListener("scroll", function () {
      cancelAnimationFrame(tick);
      tick = requestAnimationFrame(balkenSetzen);
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

  /* ---------- Filter der Filmografie (Vita) ---------- */
  document.querySelectorAll(".filter").forEach(function (leiste) {
    var liste = leiste.parentNode.querySelector("ul.vita");
    if (!liste) return;
    leiste.hidden = false;
    leiste.addEventListener("click", function (e) {
      var knopf = e.target.closest("button[data-filter]");
      if (!knopf) return;
      var f = knopf.getAttribute("data-filter");
      leiste.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === knopf)); });
      liste.querySelectorAll("li").forEach(function (li) {
        li.hidden = f !== "alle" && li.getAttribute("data-art") !== f;
      });
    });
  });

  /* ---------- Einblenden beim Scrollen ----------
     Inhalte sind immer sichtbar, solange das Einblenden nicht sicher läuft:
     Erst wenn der Beobachter steht, wird ausgeblendet. Sicherheitsnetz nach 2,5 s. */
  var bloecke = document.querySelectorAll(".einblenden");
  function alleZeigen() { bloecke.forEach(function (el) { el.classList.add("sichtbar"); }); }
  if (!ruhig && "IntersectionObserver" in window) {
    try {
      var beob = new IntersectionObserver(function (eintraege) {
        eintraege.forEach(function (e) {
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            e.target.classList.add("sichtbar");
            beob.unobserve(e.target);
          }
        });
      }, { threshold: 0.01 });
      bloecke.forEach(function (el) { beob.observe(el); });
      html.classList.add("einblenden-an");
      setTimeout(function () {
        bloecke.forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("sichtbar");
        });
      }, 2500);
    } catch (e) { alleZeigen(); }
  } else {
    alleZeigen();
  }

  /* Laufschrift „Aktuell“: Pause-Knopf */
  document.querySelectorAll(".laufband").forEach(function (band) {
    var knopf = band.querySelector(".laufband-pause");
    if (!knopf) return;
    knopf.addEventListener("click", function () {
      var an = band.classList.toggle("angehalten");
      knopf.setAttribute("aria-pressed", String(an));
    });
  });
  /* Fotos groß ansehen (Website-Analyse, Dennis 16.11.2026): Tipp auf ein Foto öffnet es bildschirmfüllend, darin wischen */
  var gruppen = [];
  document.querySelectorAll(".fotos .spur, .stueck-bild .reihe").forEach(function (g) {
    var b = Array.prototype.slice.call(g.querySelectorAll("img"));
    if (b.length) gruppen.push(b);
  });
  if (gruppen.length && window.HTMLDialogElement) {
    var dlg = document.createElement("dialog");
    dlg.className = "gross";
    dlg.innerHTML = '<div class="gross-spur"></div>' +
      '<button type="button" class="gross-zu" data-aria-de="Schließen" data-aria-en="Close"></button>' +
      '<button type="button" class="gross-vor" data-aria-de="Vorheriges Foto" data-aria-en="Previous photo"></button>' +
      '<button type="button" class="gross-nach" data-aria-de="Nächstes Foto" data-aria-en="Next photo"></button>';
    document.body.appendChild(dlg);
    var gSpur = dlg.querySelector(".gross-spur");
    var sprachAria = function () {
      var s = document.documentElement.getAttribute("data-sprache") || "de";
      dlg.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-label", b.getAttribute("data-aria-" + s)); });
    };
    var gross = function (img) {
      var set = img.getAttribute("srcset");
      return set ? set.split(",").pop().trim().split(" ")[0] : img.getAttribute("src");
    };
    var unterschrift = function (img) {
      var fig = img.closest("figure");
      var cap = fig && fig.querySelector("figcaption");
      if (cap) return cap.innerHTML;
      var li = img.closest("li");
      var fuss = li && li.querySelector(".stueck-fuss");
      var titel = li && li.querySelector(".stueck-titel");
      return (titel ? titel.innerHTML : "") + (fuss ? "<br>" + fuss.innerHTML : "");
    };
    var gZeige = function (i) {
      var n = gSpur.children.length;
      i = Math.max(0, Math.min(n - 1, i));
      gSpur.scrollTo({ left: i * gSpur.clientWidth, behavior: "smooth" });
    };
    var gAktuell = function () { return Math.round(gSpur.scrollLeft / gSpur.clientWidth); };
    var gOeffnen = function (bilder, i) {
      gSpur.innerHTML = "";
      bilder.forEach(function (img) {
        var fig = document.createElement("figure");
        var neu = document.createElement("img");
        neu.src = gross(img);
        neu.alt = img.alt;
        neu.decoding = "async";
        var cap = document.createElement("figcaption");
        cap.innerHTML = unterschrift(img);
        cap.querySelectorAll("a").forEach(function (a) { a.setAttribute("tabindex", "-1"); });
        fig.appendChild(neu);
        fig.appendChild(cap);
        gSpur.appendChild(fig);
      });
      dlg.classList.toggle("einzeln", bilder.length < 2);
      sprachAria();
      dlg.showModal();
      gSpur.scrollLeft = i * gSpur.clientWidth;
    };
    gruppen.forEach(function (bilder) {
      bilder.forEach(function (img, i) {
        img.classList.add("vergroesserbar");
        img.setAttribute("tabindex", "0");
        img.setAttribute("role", "button");
        img.addEventListener("click", function () { gOeffnen(bilder, i); });
        img.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); gOeffnen(bilder, i); }
        });
      });
    });
    dlg.querySelector(".gross-zu").addEventListener("click", function () { dlg.close(); });
    dlg.querySelector(".gross-vor").addEventListener("click", function () { gZeige(gAktuell() - 1); });
    dlg.querySelector(".gross-nach").addEventListener("click", function () { gZeige(gAktuell() + 1); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") gZeige(gAktuell() + 1);
      if (e.key === "ArrowLeft") gZeige(gAktuell() - 1);
    });
    dlg.addEventListener("close", function () { gSpur.innerHTML = ""; });
  }
})();
