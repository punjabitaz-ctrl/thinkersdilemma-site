/* =====================================================================
   THINKERS DILEMMA — RSS SYNC  (client-side layer)
   Fetches the Substack RSS feed on page load and merges any posts not
   yet in content-substack.js into the live page — so the site auto-
   updates the moment a new essay is published to Substack, with no
   server or rebuild required.

   Strategy
   ─────────
   1. Check localStorage for a cached feed (TTL: 15 min).
   2. If stale/missing, fetch via rss2json.com (JSON, CORS-enabled).
   3. Fall back to allorigins.win if rss2json fails (returns raw XML).
   4. Diff incoming items against window.TD_CONTENT.essays (by href).
   5. Inject new essay cards into any listing containers on this page.
   6. Show a brief toast notification.

   For a fully automated rebuild that also generates local essay pages,
   see .github/workflows/sync-rss.yml + scripts/sync-rss-node.js.
   ===================================================================== */
(function () {
  "use strict";

  var RSS_URL     = "https://thinkersdilemma.substack.com/feed";
  var API_R2J     = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(RSS_URL);
  var API_ALLORG  = "https://api.allorigins.win/get?url=" + encodeURIComponent(RSS_URL);
  var CACHE_KEY   = "td-rss-cache";
  var CACHE_TTL   = 15 * 60 * 1000; // 15 minutes

  /* ---- localStorage cache ----------------------------------------- */
  function cacheGet() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return (Date.now() - d.ts < CACHE_TTL) ? d.items : null;
    } catch (e) { return null; }
  }
  function cacheSet(items) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: items })); } catch (e) {}
  }

  /* ---- Text helpers ----------------------------------------------- */
  function strip(html) {
    return String(html || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&#\d+;/g, "").trim();
  }
  function dek(html, max) {
    var t = strip(html);
    if (t.length <= max) return t;
    var cut = t.lastIndexOf(".", max);
    return t.slice(0, cut > 60 ? cut + 1 : max) + (cut <= 60 ? "…" : "");
  }
  function parseDate(str) {
    var d = new Date(str);
    if (isNaN(d)) return { full: "", short: "", year: "" };
    var M = ["January","February","March","April","May","June",
             "July","August","September","October","November","December"];
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return {
      full:  M[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(),
      short: p(d.getMonth() + 1) + " · " + p(d.getDate()) + " · " + String(d.getFullYear()).slice(2),
      year:  String(d.getFullYear())
    };
  }
  function readMin(html) {
    return Math.max(3, Math.round(strip(html).split(/\s+/).length / 200));
  }
  function mapCat(cats, title) {
    var text = (cats || []).join(" ").toLowerCase() + " " + (title || "").toLowerCase();
    if (/diaspora|migration|immigr|identity/.test(text)) return "diaspora";
    if (/housing|economy|polic|financ|money/.test(text))  return "economy";
    if (/tech|ai\b|algorithm|data|digital|software/.test(text)) return "technology";
    return "power";
  }
  function pad(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }

  /* ---- Map an RSS item → TD essay schema -------------------------- */
  function toEssay(item, no) {
    var dt  = parseDate(item.pubDate || "");
    var cat = mapCat(item.categories, item.title);
    var cap = cat.charAt(0).toUpperCase() + cat.slice(1);
    var body = item.content || item.description || "";
    return {
      no: pad(no), cat: cat, catLabel: cap,
      titleHtml: strip(item.title),
      dek:  dek(body, 220),
      meta: "By Taz Punjabi · " + dt.full,
      readMin: readMin(body),
      date: dt.full, dateShort: dt.short, year: dt.year,
      type: "Essay",
      href: item.link || "",
      localHref: null   // no local page yet — links go to Substack
    };
  }

  /* ---- Fetch helpers ---------------------------------------------- */
  function xhrGet(url, cb) {
    var x = new XMLHttpRequest();
    x.open("GET", url, true);
    x.timeout = 9000;
    x.onload  = function () { cb(x.status === 200 ? x.responseText : null); };
    x.onerror = x.ontimeout = function () { cb(null); };
    x.send();
  }

  function fetchRss2json(cb) {
    xhrGet(API_R2J, function (text) {
      if (!text) return cb(null);
      try {
        var d = JSON.parse(text);
        cb(d.status === "ok" && d.items && d.items.length ? d.items : null);
      } catch (e) { cb(null); }
    });
  }

  function xmlToItems(xmlStr) {
    var doc = new DOMParser().parseFromString(xmlStr, "text/xml");
    return Array.prototype.slice.call(doc.querySelectorAll("item")).map(function (el) {
      function t(tag) { var n = el.querySelector(tag); return n ? n.textContent : ""; }
      var cats = Array.prototype.slice.call(el.querySelectorAll("category")).map(function (c) { return c.textContent; });
      // content:encoded lives in a namespace — try both routes
      var encoded = "";
      var ns = el.getElementsByTagName("content:encoded");
      if (ns.length) encoded = ns[0].textContent;
      return {
        title: t("title"), link: t("link") || t("guid"),
        pubDate: t("pubDate"), description: t("description"),
        content: encoded || t("description"), categories: cats
      };
    });
  }

  function fetchAllOrigins(cb) {
    xhrGet(API_ALLORG, function (text) {
      if (!text) return cb(null);
      try {
        var w = JSON.parse(text);
        var items = xmlToItems(w.contents || "");
        cb(items.length ? items : null);
      } catch (e) { cb(null); }
    });
  }

  /* ---- Diff against existing content ------------------------------ */
  function findNew(items) {
    var C = window.TD_CONTENT || window.TD || {};
    var existing = (C.essays || []).map(function (e) { return e.href; });
    return items.filter(function (it) { return it.link && existing.indexOf(it.link) === -1; });
  }

  /* ---- HTML builders ---------------------------------------------- */
  function esc(s) {
    return String(s || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
  }
  function newBadge() {
    return '<span class="kicker-tag" style="margin-left:8px;vertical-align:middle;font-size:9px;">New ↗</span>';
  }
  function essayCardHTML(e) {
    return '<a href="' + esc(e.href) + '" class="essay-card"' +
      ' data-cat="' + esc(e.cat) + '"' +
      ' data-title="' + esc((e.titleHtml + " " + e.dek + " " + e.cat).toLowerCase()) + '"' +
      ' target="_blank" rel="noopener">' +
      '<div class="ec-no"><span>№ ' + esc(e.no) + '</span><span class="cat">' + esc(e.catLabel) + '</span></div>' +
      '<div>' +
        '<div class="ec-title">' + esc(e.titleHtml) + newBadge() + '</div>' +
        '<p class="ec-dek">' + esc(e.dek) + '</p>' +
      '</div>' +
      '<div class="ec-meta"><span class="read">' + e.readMin + ' min read</span>' + esc(e.date) + '</div>' +
      '</a>';
  }
  function archRowHTML(e) {
    return '<a href="' + esc(e.href) + '" class="arch-row"' +
      ' data-cat="' + esc(e.cat) + '"' +
      ' target="_blank" rel="noopener">' +
      '<span class="ano">№ ' + esc(e.no) + '</span>' +
      '<span class="attl">' + esc(e.titleHtml) + '</span>' +
      '<span class="acat">' + esc(e.catLabel) + '</span>' +
      '<span class="adate">' + esc(e.dateShort) + '</span>' +
      '<span class="atype">New ↗</span>' +
      '</a>';
  }
  function homeStoryHTML(e) {
    return '<a href="' + esc(e.href) + '" class="story" target="_blank" rel="noopener">' +
      '<div class="kicker-row"><span class="kicker-tag">New · ' + esc(e.catLabel) + '</span></div>' +
      '<h3 class="hl">' + esc(e.titleHtml) + '</h3>' +
      '<span class="meta">Essay · ' + e.readMin + ' min</span>' +
      '</a>';
  }

  /* ---- Inject into DOM -------------------------------------------- */
  function inject(newEssays) {
    if (!newEssays.length) return;

    var C = window.TD_CONTENT || window.TD || {};
    var existing = C.essays || [];
    var maxNo = existing.reduce(function (m, e) { return Math.max(m, parseInt(e.no, 10) || 0); }, 0);
    // RSS comes newest-first; assign descending numbers so newest = highest
    var mapped = newEssays.map(function (item, i) {
      return toEssay(item, maxNo + newEssays.length - i);
    });

    // Patch in-memory content so filter chips work on new cards
    C.essays = mapped.concat(existing);
    if (window.TD_CONTENT) window.TD_CONTENT = C;
    if (window.TD)         window.TD         = C;

    // Essays listing
    var essayList = document.querySelector("[data-render=\"essays\"]");
    if (essayList) {
      essayList.insertAdjacentHTML("afterbegin", mapped.map(essayCardHTML).join(""));
      var countEl = document.querySelector("[data-count]");
      if (countEl) countEl.textContent = parseInt(countEl.textContent, 10) + mapped.length;
    }

    // Archive listing — insert into the first .archive group
    var archiveHost = document.querySelector("[data-render=\"archive\"]");
    if (archiveHost) {
      var archiveDiv = archiveHost.querySelector(".archive");
      if (archiveDiv) {
        archiveDiv.insertAdjacentHTML("afterbegin", mapped.map(archRowHTML).join(""));
        var countEl2 = document.querySelector("[data-count]");
        if (countEl2) countEl2.textContent = parseInt(countEl2.textContent, 10) + mapped.length;
      }
    }

    // Home page secondary story grid
    if ((document.body.getAttribute("data-page") || "") === "home") {
      var grid = document.querySelector("[data-render=\"home-secondary\"]");
      if (grid) grid.insertAdjacentHTML("afterbegin", mapped.slice(0, 2).map(homeStoryHTML).join(""));
    }

    toast(mapped.length);
  }

  /* ---- Toast notification ----------------------------------------- */
  function toast(count) {
    var t = document.createElement("div");
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    t.style.cssText =
      "position:fixed;bottom:28px;right:28px;z-index:9999;" +
      "background:var(--ink);color:var(--paper);" +
      "font:600 11px/1 var(--mono);letter-spacing:0.2em;text-transform:uppercase;" +
      "padding:12px 20px;border-left:3px solid var(--signal);" +
      "opacity:0;transition:opacity 0.35s;pointer-events:none;";
    t.textContent = (count === 1 ? "1 new essay" : count + " new essays") + " from Substack";
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.style.opacity = "1"; });
    });
    setTimeout(function () {
      t.style.opacity = "0";
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 420);
    }, 4000);
  }

  /* ---- Entry point ------------------------------------------------ */
  function run() {
    var cached = cacheGet();
    if (cached) {
      var newFromCache = findNew(cached);
      if (newFromCache.length) inject(newFromCache);
      return;
    }
    // Primary: rss2json.com (clean JSON, CORS-safe)
    fetchRss2json(function (items) {
      if (items) { cacheSet(items); inject(findNew(items)); return; }
      // Fallback: allorigins.win (raw XML)
      fetchAllOrigins(function (items2) {
        if (!items2) return;
        cacheSet(items2);
        inject(findNew(items2));
      });
    });
  }

  // Wait until render.js has already populated the DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    setTimeout(run, 0);
  }
})();
