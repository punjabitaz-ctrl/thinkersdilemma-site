/* =====================================================================
   THINKERS DILEMMA — RENDER
   Hydrates every page from window.TD_CONTENT (content.js).
   Runs synchronously at end of <body>, BEFORE site.js, so the filter,
   reveal and count logic in site.js sees the finished DOM.

   • [data-bind="path"]       → element.textContent = value
   • [data-bind-html="path"]  → element.innerHTML  = value
   • [data-render="key"]      → filled by a renderer below
   "page.*" paths resolve against pages[<body data-page>].
   A draft from Studio (localStorage) is used only when the URL has
   ?tdpreview=1 — the public site always reads content.js.
   ===================================================================== */
(function () {
  "use strict";

  // ---- source (with optional Studio preview override) -------------
  var C = window.TD_CONTENT || {};
  try {
    if (/[?&]tdpreview=1\b/.test(location.search)) {
      var draft = localStorage.getItem("td-studio-draft");
      if (draft) C = JSON.parse(draft);
    }
  } catch (e) { /* fall back to file content */ }
  window.TD = C;

  var pageKey = (document.body && document.body.getAttribute("data-page")) || "";

  // ---- helpers ----------------------------------------------------
  function get(path) {
    if (!path) return undefined;
    var parts = path.split(".");
    var ctx = C;
    if (parts[0] === "page") { ctx = (C.pages || {})[pageKey] || {}; parts.shift(); }
    for (var i = 0; i < parts.length; i++) {
      if (ctx == null) return undefined;
      ctx = ctx[parts[i]];
    }
    return ctx;
  }
  function stripTags(s) { return String(s == null ? "" : s).replace(/<[^>]*>/g, ""); }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function attr(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content; }
  function num(n) { return Number(n || 0).toLocaleString("en-US"); }

  function catLabel(item) { return item.catLabel || cap(item.cat); }
  function hay(/* …strings */) {
    var s = [];
    for (var i = 0; i < arguments.length; i++) s.push(stripTags(arguments[i]));
    if (Array.isArray(arguments[arguments.length])) { /* noop */ }
    return attr(s.join(" ").toLowerCase());
  }

  // ---- text/html binding -----------------------------------------
  function bind(root) {
    (root || document).querySelectorAll("[data-bind]").forEach(function (n) {
      var v = get(n.getAttribute("data-bind"));
      if (v != null) n.textContent = v;
    });
    (root || document).querySelectorAll("[data-bind-html]").forEach(function (n) {
      var v = get(n.getAttribute("data-bind-html"));
      if (v != null) n.innerHTML = v;
    });
  }

  // =================================================================
  // RENDERERS  (keyed by [data-render] value)
  // =================================================================
  var R = {};

  // ---- shared chrome ----------------------------------------------
  R.ticker = function (host) {
    var items = (C.site && C.site.ticker) || [];
    function one(it) {
      var star = it.star ? '<span class="star">✦</span> ' : "";
      return '<span class="item' + (it.hot ? " hot" : "") + '">' + star + attrText(it.text) + "</span>";
    }
    function attrText(s) { return String(s == null ? "" : s); }
    var seq = items.map(one).join("");
    host.innerHTML = seq + seq; // doubled for the seamless loop
  };

  R.social = function (host) {
    var s = (C.site && C.site.social) || [];
    host.innerHTML = s.map(function (l) {
      return '<a href="' + attr(l.href) + '">' + stripTags(l.label) + "</a>";
    }).join("");
  };

  R["footer-cols"] = function (host) {
    var cols = (C.site && C.site.footer && C.site.footer.columns) || [];
    host.innerHTML = cols.map(function (col) {
      var links = (col.links || []).map(function (l) {
        // items without an href (or marked note) render as styled text, not a link
        if (l.note || !l.href || l.href === "#") return '<span class="soon">' + stripTags(l.label) + "</span>";
        return '<a href="' + attr(l.href) + '">' + stripTags(l.label) + "</a>";
      }).join("");
      return '<div class="col"><h5>' + stripTags(col.title) + "</h5>" + links + "</div>";
    }).join("");
  };

  // ---- homepage ---------------------------------------------------
  R["home-excerpt"] = function (host) {
    var ps = (C.home && C.home.excerpt) || [];
    host.innerHTML = ps.map(function (p, i) {
      return "<p" + (i === 0 ? ' class="dropcap"' : "") + ">" + p + "</p>";
    }).join("");
  };

  R["home-secondary"] = function (host) {
    var list = (C.essays || []).slice(1, 5);
    host.innerHTML = list.map(function (e, i) {
      var delay = i > 0 ? ' data-reveal-delay="' + i + '"' : "";
      return '<a href="' + (e.localHref || e.href || 'article.html') + '" class="story" data-reveal' + delay + '>' +
        '<div class="kicker-row"><span class="kicker-tag">' + cap(e.cat) + "</span></div>" +
        '<h3 class="hl">' + stripTags(e.titleHtml) + "</h3>" +
        '<p class="dek">' + (e.dek || "") + "</p>" +
        '<span class="meta">' + (e.type || "Essay") + " · " + (e.readMin || 6) + " min</span>" +
        "</a>";
    }).join("");
  };

  R["home-episodes"] = function (host) {
    var list = (C.episodes || []).slice(0, 3);
    host.innerHTML = list.map(function (ep, i) {
      var delay = i > 0 ? ' data-reveal-delay="' + i + '"' : "";
      return '<a href="' + (ep.localHref || '#') + '" class="episode" data-reveal' + delay + '>' +
        '<div class="thumb"><span class="corner">№ ' + stripTags(ep.no) + "</span>" +
        '<div class="big-q"><div class="q">' + ep.questionHtml + "</div></div>" +
        '<div class="play"><div class="ring"></div></div>' +
        '<span class="runtime">' + stripTags(ep.runtime) + "</span></div>" +
        '<div class="cap"><span class="epno">Ep ' + stripTags(ep.no) + '</span><span class="epttl">' + stripTags(ep.title) + "</span></div>" +
        '<div class="submeta">' + stripTags(ep.submeta) + "</div></a>";
    }).join("");
  };

  R["home-notes"] = function (host) {
    var list = (C.notes || []).slice(0, 4);
    host.innerHTML = list.map(function (n, i) {
      var delay = i > 0 ? ' data-reveal-delay="' + i + '"' : "";
      return '<a href="' + (n.localHref || '#') + '" class="note-card" data-reveal' + delay + '>' +
        '<div class="thumb portrait"><span class="corner">Note ' + stripTags(n.no) + "</span>" +
        '<div class="big-q"><div class="q">' + n.questionHtml + "</div></div></div>" +
        '<div class="note-meta">' + stripTags(n.meta) + "</div></a>";
    }).join("");
  };

  R["home-archive"] = function (host) {
    var list = (C.essays || []).slice(0, 6);
    host.innerHTML = list.map(function (e) {
      return '<a href="' + (e.localHref || e.href || 'article.html') + '" class="arch-row">' +
        '<span class="ano">№ ' + stripTags(e.no) + "</span>" +
        '<span class="attl">' + stripTags(e.titleHtml) + "</span>" +
        '<span class="acat">' + cap(e.cat) + "</span>" +
        '<span class="adate">' + stripTags(e.dateShort) + "</span></a>";
    }).join("");
  };

  // ---- essays page ------------------------------------------------
  R.essays = function (host) {
    var list = C.essays || [];
    host.innerHTML = list.map(function (e) {
      var search = (stripTags(e.titleHtml) + " " + (e.dek || "") + " " + e.cat + " " + (e.tags || []).join(" ")).toLowerCase();
      if (e.lead) {
        return '<a href="' + (e.localHref || e.href || 'article.html') + '" class="essay-card lead" data-cat="' + attr(e.cat) + '" data-title="' + attr(search) + '">' +
          '<div class="ec-no"><span>№ ' + stripTags(e.no) + '</span><span class="cat">' + catLabel(e) + "</span></div>" +
          "<div>" +
          '<div class="ec-title">' + e.titleHtml + "</div>" +
          '<p class="ec-dek">' + (e.dek || "") + "</p>" +
          '<div class="ec-meta">' + (e.meta || "") + "</div>" +
          "</div></a>";
      }
      var tags = (e.tags || []).length
        ? '<div class="ec-tags">' + e.tags.map(function (t, i) {
            return (i ? "<span>·</span>" : "") + "<span>" + stripTags(t) + "</span>";
          }).join("") + "</div>"
        : "";
      return '<a href="' + (e.localHref || e.href || 'article.html') + '" class="essay-card" data-cat="' + attr(e.cat) + '" data-title="' + attr(search) + '">' +
        '<div class="ec-no"><span>№ ' + stripTags(e.no) + '</span><span class="cat">' + cap(e.cat) + "</span></div>" +
        "<div>" +
        '<div class="ec-title">' + e.titleHtml + "</div>" +
        '<p class="ec-dek">' + (e.dek || "") + "</p>" + tags +
        "</div>" +
        '<div class="ec-meta"><span class="read">' + (e.readMin || 6) + " min read</span>" + (e.date || "") + "</div></a>";
    }).join("");
  };

  // ---- episodes page ----------------------------------------------
  R["episode-featured"] = function (host) {
    var ep = (C.episodes || []).filter(function (e) { return e.featured; })[0] || (C.episodes || [])[0];
    if (!ep) return;
    host.innerHTML =
      '<a href="' + (ep.localHref || '#') + '" class="thumb grain"><span class="corner">№ ' + stripTags(ep.no) + ' · Latest</span>' +
      '<div class="big-q"><div class="q">' + ep.questionHtml + "</div></div>" +
      '<div class="play"><div class="ring"></div></div>' +
      '<span class="runtime">' + stripTags(ep.runtime) + "</span></a>" +
      '<div class="info">' +
      '<div class="tag">Episode ' + stripTags(ep.no) + " · " + cap(ep.cat) + (ep.part ? " · " + ep.part : "") + "</div>" +
      '<h2 class="ttl">' + (ep.featuredTitleHtml || ("The <em>" + stripTags(ep.title).replace(/^The\s+/i, "") + "</em>")) + "</h2>" +
      '<p class="dek">' + (ep.dek || stripTags(ep.questionHtml)) + "</p>" +
      '<div class="row"><a href="' + (ep.localHref || '#') + '" class="watch">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z"></path></svg> Watch on YouTube</a>' +
      '<span class="submeta">' + stripTags(ep.submeta) + "</span></div></div>";
  };

  R.episodes = function (host) {
    var list = C.episodes || [];
    host.innerHTML = list.map(function (ep) {
      var search = (stripTags(ep.questionHtml) + " " + ep.title + " " + ep.cat).toLowerCase();
      return '<a href="' + (ep.localHref || '#') + '" class="episode" data-cat="' + attr(ep.cat) + '" data-title="' + attr(search) + '">' +
        '<div class="thumb grain"><span class="corner">№ ' + stripTags(ep.no) + "</span>" +
        '<div class="big-q"><div class="q">' + ep.questionHtml + "</div></div>" +
        '<div class="play"><div class="ring"></div></div>' +
        '<span class="runtime">' + stripTags(ep.runtime) + "</span></div>" +
        '<div class="cap"><span class="epno">Ep ' + stripTags(ep.no) + '</span><span class="epttl">' + stripTags(ep.title) + "</span></div>" +
        '<div class="submeta">' + stripTags(ep.submeta) + "</div></a>";
    }).join("");
  };

  // ---- notes page -------------------------------------------------
  R.notes = function (host) {
    var list = C.notes || [];
    host.innerHTML = list.map(function (n) {
      var search = (stripTags(n.questionHtml) + " " + n.cat).toLowerCase();
      return '<a href="' + (n.localHref || '#') + '" class="note-card" data-cat="' + attr(n.cat) + '" data-title="' + attr(search) + '">' +
        '<div class="thumb portrait grain"><span class="corner">Note ' + stripTags(n.no) + "</span>" +
        '<div class="big-q"><div class="q">' + n.questionHtml + "</div></div></div>" +
        '<div class="note-meta">' + stripTags(n.meta) + "</div></a>";
    }).join("");
  };

  // ---- archive page (grouped by year) -----------------------------
  R.archive = function (host) {
    var list = C.essays || [];
    var years = [];
    var byYear = {};
    list.forEach(function (e) {
      var y = e.year || "";
      if (!byYear[y]) { byYear[y] = []; years.push(y); }
      byYear[y].push(e);
    });
    var cycles = {
      "2026": "Issues 008 — 014 · The Watchers cycle",
      "2025": "Issues 001 — 007 · First principles"
    };
    host.innerHTML = years.map(function (y) {
      var rows = byYear[y].map(function (e) {
        var search = (stripTags(e.titleHtml) + " " + e.cat).toLowerCase();
        var typeCls = e.type === "Episode" ? " episode" : "";
        return '<a href="' + (e.localHref || e.href || 'article.html') + '" class="arch-row" data-cat="' + attr(e.cat) + '" data-title="' + attr(search) + '">' +
          '<span class="ano">№ ' + stripTags(e.no) + "</span>" +
          '<span class="attl">' + stripTags(e.titleHtml) + "</span>" +
          '<span class="acat">' + cap(e.cat) + "</span>" +
          '<span class="adate">' + stripTags(e.dateShort) + "</span>" +
          '<span class="atype' + typeCls + '">' + (e.type || "Essay") + "</span></a>";
      }).join("");
      return '<div data-group>' +
        '<div class="year-head"><span class="y">' + stripTags(y) + '</span><span class="c">' + (cycles[y] || "") + "</span></div>" +
        '<div class="archive full">' + rows + "</div></div>";
    }).join("");
  };

  // =================================================================
  // RUN
  // =================================================================
  function render() {
    try { bind(document); } catch (e) { /* keep going */ }
    document.querySelectorAll("[data-render]").forEach(function (host) {
      var key = host.getAttribute("data-render");
      if (R[key]) { try { R[key](host); } catch (e) { console.warn("render", key, e); } }
    });
    // reader count-up figures pull from site.readers
    var readers = (C.site && C.site.readers) || 0;
    document.querySelectorAll("[data-readers]").forEach(function (n) {
      n.setAttribute("data-count-to", readers);
      n.textContent = num(readers);
    });
  }

  render();
})();
