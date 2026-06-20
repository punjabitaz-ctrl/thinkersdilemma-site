/* =====================================================================
   THINKERS DILEMMA — site interactions
   Filter + search for listings, newsletter form states, and
   automated Substack archive population.
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
      if (countEl) countEl.textContent = shown;
      if (empty) empty.classList.toggle("is-hidden", shown > 0);
      groups.forEach(function(g) {
        var groupItems = g.querySelectorAll("[data-cat]:not(.is-hidden)");
        g.classList.toggle("is-hidden", groupItems.length === 0);
      });
    }
    if (search) search.addEventListener("input", apply);
    chips.forEach(function (c) {
      c.addEventListener("click", function (e) {
        e.preventDefault();
        chips.forEach(function (chip) { chip.classList.remove("active"); });
        c.classList.add("active");
        activeCat = c.getAttribute("data-filter") || "all";
        apply();
      });
    });
  }

  /* ---------- Newsletter form ------------------------------------ */
  function initSubscribe() {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-subscribe]"));
    forms.forEach(function (form) {
      var input = form.querySelector("input");
      var button = form.querySelector("button");
      var url = form.getAttribute("data-substack-url");
      function submit() {
        var val = input.value;
        if (!val || val.indexOf("@") === -1) {
          form.classList.add("err");
          return;
        }
        window.open(url + "?email=" + encodeURIComponent(val));
      }
      button.addEventListener("click", submit);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
        if (form.classList.contains("err")) form.classList.remove("err");
      });
    });
  }

  /* ---------- Automated Archive Fetcher -------------------------- */
  function updateArchive() {
    var containers = document.querySelectorAll('[data-render="home-archive"]');
    if (containers.length === 0) return;

    fetch('articles.json')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var posts = data.items || [];
        var html = posts.slice(0, 6).map(function(item) {
          return '<div class="essay-card">' +
                 '  <a href="' + item.link + '">' +
                 '    <h3>' + item.title + '</h3>' +
                 '    <p>' + (item.description || '') + '</p>' +
                 '  </a>' +
                 '</div>';
        }).join('');
        containers.forEach(function(c) { c.innerHTML = html; });
      })
      .catch(function(err) { console.warn("Archive fetch failed:", err); });
  }

  /* ---------- Reading progress ----------------------------------- */
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

  /* ---------- Placeholder links ---------------------------------- */
  function initPlaceholderLinks() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href="#"]');
      if (a) e.preventDefault();
    });
  }

  /* ---------- Other site components (existing) ------------------- */
  function initTheme() { /* ... kept as is ... */ }
  function initReveal() { /* ... kept as is ... */ }
  function initParallax() { /* ... kept as is ... */ }
  function initCounters() { /* ... kept as is ... */ }
  function initPlateTilt() { /* ... kept as is ... */ }
  function initMagnetic() { /* ... kept as is ... */ }

  /* ---------- Initialization ------------------------------------- */
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
    updateArchive(); // <--- This now runs the fetch
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
