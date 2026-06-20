/* =====================================================================
   THINKERS DILEMMA — site interactions
   Filter + search for listings, and newsletter form states.
   Progressive enhancement: everything works as plain links without JS.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Filterable listings -------------------------------- */
  function initFilter() {
    var list = document.querySelector("[data-list]");
    if (!list) return;

    var items = Array.prototype.slice.call(list.querySelectorAll("[data-cat]"));
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
    var search = document.querySelector("[data-search]");
    var countEl = document.querySelector("[data-count]");
    var empty = document.querySelector("[data-empty]");
    var groups = Array.prototype.slice.call(document.querySelectorAll("[data-group]"));
    var activeCat = "all";

    function norm(s) { return (s || "").toLowerCase().trim(); }

    function apply() {
      var q = norm(search && search.value);
      var shown = 0;

      items.forEach(function (it) {
        var cat = norm(it.getAttribute("data-cat"));
        var hay = norm(it.getAttribute("data-title") || it.textContent);
        var okCat = activeCat === "all" || (" " + cat + " ").indexOf(" " + activeCat + " ") > -1;
        var okQ = !q || hay.indexOf(q) > -1;
        var show = okCat && okQ;
        it.classList.toggle("is-hidden", !show);
        if (show) shown++;
      });

      // hide year/group headers that have no visible children
      groups.forEach(function (g) {
        var hasVisible = g.querySelectorAll("[data-cat]:not(.is-hidden)").length > 0;
        g.classList.toggle("is-hidden", !hasVisible);
      });

      if (countEl) countEl.textContent = shown;
      if (empty) empty.classList.toggle("is-hidden", shown > 0);
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active");
        activeCat = norm(c.getAttribute("data-cat")) || "all";
        apply();
      });
    });

    if (search) {
      search.addEventListener("input", apply);
      // Esc clears the search
      search.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { search.value = ""; apply(); }
      });
    }

    apply();
  }

  /* ---------- Newsletter form states ----------------------------- */
  function initSubscribe() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-subscribe]"));
    forms.forEach(function (form) {
      var input = form.querySelector("input");
      var button = form.querySelector("button");
      if (!input || !button) return;

      function valid(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }

      function submit() {
        var v = input.value.trim();
        if (!valid(v)) {
          form.classList.add("err");
          input.focus();
          return;
        }
        form.classList.remove("err");
        var substackUrl = form.getAttribute("data-substack-url");
        if (substackUrl) {
          window.open(substackUrl + "?email=" + encodeURIComponent(v), "_blank", "noopener");
          var sf = form.querySelector(".field");
          if (sf) sf.innerHTML = '<div class="sub-ok"><span class="ok-mark">\u2713</span> Opening Substack \u2014 complete your free subscription there.</div>';
          return;
        }
        var field = form.querySelector(".field");
        var name = (v.split("@")[0] || "reader");
        if (field) {
          field.innerHTML =
            '<div class="sub-ok"><span class="ok-mark">\u2713</span> You\u2019re on the list, <b>' +
            name.replace(/[<>&]/g, "") +
            "</b>. The next inquiry lands Friday.</div>";
        }
      }

      button.addEventListener("click", submit);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
        if (form.classList.contains("err")) form.classList.remove("err");
      });
    });
  }

  /* ---------- Reading progress (article pages) ------------------- */
  function initProgress() {
    var bar = document.getElementById("progress");
    if (!bar) return;
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
      bar.style.width = pct + "%";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Motion preference ---------------------------------- */
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal -------------------------------------- */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!els.length) return;
    if (reduceMotion) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var pending = els.slice();
    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = pending.length - 1; i >= 0; i--) {
        var el = pending[i];
        var top = el.getBoundingClientRect().top;
        if (top < vh * 0.92) {
          el.classList.add("is-in");
          pending.splice(i, 1);
        }
      }
      if (!pending.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }
    var ticking = false;
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; check(); }); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    check();
    // failsafe: never leave content hidden
    setTimeout(function () { els.forEach(function (el) { el.classList.add("is-in"); }); }, 3000);
  }

  /* ---------- Parallax (scroll-driven) --------------------------- */
  function initParallax() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    if (!nodes.length || reduceMotion) return;
    var ticking = false;
    function frame() {
      var vh = window.innerHeight;
      nodes.forEach(function (n) {
        var rect = n.getBoundingClientRect();
        var speed = parseFloat(n.getAttribute("data-parallax")) || 0.15;
        // distance of element center from viewport center, normalized
        var mid = rect.top + rect.height / 2 - vh / 2;
        n.style.setProperty("--py", (-mid * speed).toFixed(1) + "px");
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    frame();
  }

  /* ---------- Count-up numerals ---------------------------------- */
  function initCounters() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-count-to]"));
    if (!els.length) return;
    function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count-to")) || 0;
      var prefix = el.getAttribute("data-count-prefix") || "";
      var suffix = el.getAttribute("data-count-suffix") || "";
      if (reduceMotion) { el.textContent = prefix + fmt(target) + suffix; return; }
      var dur = 1400, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + fmt(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var pending = els.slice();
    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = pending.length - 1; i >= 0; i--) {
        var el = pending[i];
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) { run(el); pending.splice(i, 1); }
      }
      if (!pending.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }
    var ticking = false;
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; check(); }); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    check();
  }

  /* ---------- Lead plate — pointer tilt + numeral depth ---------- */
  function initPlateTilt() {
    var plate = document.querySelector(".lead .plate");
    if (!plate || reduceMotion) return;
    if (window.matchMedia && !window.matchMedia("(hover: hover)").matches) return;
    plate.classList.add("tilt");
    plate.addEventListener("pointermove", function (e) {
      var r = plate.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
      var dy = (e.clientY - r.top) / r.height - 0.5;
      plate.style.transform =
        "perspective(900px) rotateY(" + (dx * 6).toFixed(2) + "deg) rotateX(" +
        (-dy * 6).toFixed(2) + "deg)";
      plate.style.setProperty("--nx", (dx * 16).toFixed(1) + "px");
      plate.style.setProperty("--ny", (dy * 16).toFixed(1) + "px");
    });
    plate.addEventListener("pointerleave", function () {
      plate.style.transform = "";
      plate.style.setProperty("--nx", "0px");
      plate.style.setProperty("--ny", "0px");
    });
  }

  /* ---------- Magnetic subscribe button -------------------------- */
  function initMagnetic() {
    var btns = Array.prototype.slice.call(document.querySelectorAll("[data-magnetic]"));
    if (!btns.length || reduceMotion) return;
    if (window.matchMedia && !window.matchMedia("(hover: hover)").matches) return;
    btns.forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = "translate(" + (dx * 10).toFixed(1) + "px," + (dy * 8).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- Night reading mode --------------------------------- */
  function initTheme() {
    var root = document.documentElement;
    var KEY = "td-theme";

    function current() { return root.getAttribute("data-theme") === "night" ? "night" : "day"; }

    function syncMeta(mode) {
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute("content", mode === "night" ? "#15120D" : "#F2EBDD");
    }

    function label(mode) { return mode === "night" ? "Day" : "Night"; }

    function apply(mode, save) {
      if (mode === "night") root.setAttribute("data-theme", "night");
      else root.removeAttribute("data-theme");
      syncMeta(mode);
      var lbls = document.querySelectorAll("[data-theme-toggle] .lbl");
      Array.prototype.forEach.call(lbls, function (l) { l.textContent = label(mode); });
      var btns = document.querySelectorAll("[data-theme-toggle]");
      Array.prototype.forEach.call(btns, function (b) {
        b.setAttribute("aria-pressed", mode === "night" ? "true" : "false");
        b.setAttribute("title", "Switch to " + label(mode).toLowerCase() + " reading");
      });
      if (save) { try { localStorage.setItem(KEY, mode); } catch (e) {} }
    }

    // Build the toggle into the right-hand utility group (once).
    function mountToggle() {
      if (document.querySelector("[data-theme-toggle]")) return;
      var groups = document.querySelectorAll(".utility .group");
      var host = groups.length ? groups[groups.length - 1] : null;
      if (!host) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "theme-toggle";
      btn.setAttribute("data-theme-toggle", "");
      btn.setAttribute("aria-label", "Toggle night reading mode");
      btn.innerHTML = '<span class="ic" aria-hidden="true"></span><span class="lbl">Night</span>';
      var sep = document.createElement("span");
      sep.className = "dot";
      sep.textContent = "·";
      host.appendChild(sep);
      host.appendChild(btn);
      btn.addEventListener("click", function () {
        apply(current() === "night" ? "day" : "night", true);
      });
    }

    mountToggle();
    apply(current(), false);            // reflect whatever the inline head set
    // enable transitions only after first paint
    requestAnimationFrame(function () { root.classList.add("theme-ready"); });

    // follow system changes only when the user hasn't chosen explicitly
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function (e) {
        var saved; try { saved = localStorage.getItem(KEY); } catch (err) {}
        if (!saved) apply(e.matches ? "night" : "day", false);
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  function init() {
    initFilter();
    initSubscribe();
    initProgress();
    initPlaceholderLinks();
    initTheme();
    initReveal();
    initParallax();
    initCounters();
    initPlateTilt();
    initMagnetic();
  }

  /* ---------- Placeholder links ---------------------------------- */
  /* Cards and social links use href="#" until real URLs exist.
     Stop them from jumping the page to the top when clicked. */
  function initPlaceholderLinks() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href="#"]');
      if (a) e.preventDefault();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
