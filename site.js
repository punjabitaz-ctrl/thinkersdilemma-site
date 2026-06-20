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

  function init() {
    initFilter();
    initSubscribe();
    initProgress();
    initPlaceholderLinks();
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
