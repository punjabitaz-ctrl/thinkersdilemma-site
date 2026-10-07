/* =====================================================================
   DIGITAL SOVEREIGNTY AUDIT — data visuals
   Everything here is drawn from window.DSP (dsp-data.js) at load time: no
   images, no hand-placed numbers. Add or change a score in the data file and
   the map, the unit chart, the heat table and every per-state infographic
   redraw themselves. Every mark links to the audit or page it describes.

   Slots:  [data-dsp="us-map"]           interactive US map + popover scorecard
           [data-dsp="viz-dist"]         unit chart of states by grade band
           [data-dsp="viz-pillar-heat"]  pillar scores, state by state
           [data-viz-state="Name"]       the per-state infographic panels
   ===================================================================== */
(function () {
  "use strict";
  var D = window.DSP, M = window.DSP_MAP;
  if (!D) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var REV = D.revealed ? D.revealed() : true;   /* false = locked: no grades, scores or colors */
  var PAGE_GATED = !!document.querySelector('[data-dsp="us-map"]');   /* State audits page: publish week by week */
  var ABBR = { Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY" };
  /* too small to carry a label inside the outline */
  var NO_LABEL = { "New Hampshire": 1, Vermont: 1, Massachusetts: 1, "Rhode Island": 1, Connecticut: 1, "New Jersey": 1, Delaware: 1, Maryland: 1 };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function slot(name) { return $('[data-dsp="' + name + '"]'); }
  function chip(g) { return '<span class="grade-chip g-' + g + '" aria-label="Grade ' + g + '">' + g + "</span>"; }
  function href(name) { return "state-" + D.slug(name) + ".html"; }
  function ord(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function rec(name) { return D.states.filter(function (x) { return x.state === name; })[0] || null; }
  function statusOf(name) { var r = rec(name); return !r ? "queued" : (r.status === "reaudit" ? "reaudit" : "audited"); }
  function scoredList() { return D.states.filter(function (x) { return x.status !== "reaudit" && (!PAGE_GATED || (REV && D.isLive(x))); }); }
  /* what the public may see for a state right now (null = not published yet) */
  function vrec(n) { var r = rec(n); return r && REV && D.isLive(r) ? r : null; }
  function vstatus(n) { var r = vrec(n); return !r ? "queued" : (r.status === "reaudit" ? "reaudit" : "audited"); }
  function pillarsFor(r) {
    if (!r) return null;
    if (r.pillars) return { p: r.pillars, penalty: r.penalty || 0 };
    var ex = D.examples.filter(function (e) { return e.state === r.state; })[0];
    return ex ? { p: ex.pillars, penalty: ex.penalty || 0 } : null;
  }
  function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

  /* animate on first view; content is fully visible if JS or the observer is unavailable */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = null;
  if (!reduce && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
  }
  function reveal(el) {
    el.classList.add("viz");
    if (!io) { el.classList.add("in"); return; }
    el.classList.add("anim");
    io.observe(el);
    setTimeout(function () { el.classList.add("in"); }, 2500);
  }

  /* =================================================================
     US MAP
     ================================================================= */
  function renderMap(host) {
    if (!M) { host.innerHTML = '<p class="state-empty">The map could not load.</p>'; return; }
    var names = D.roster;
    var paths = names.map(function (n) {
      var r = vrec(n), st = vstatus(n), g = st === "audited" ? r.grade : "";
      var label = n + ", " + (st === "audited" ? "grade " + r.grade + ", " + r.score + " out of 100" : st === "reaudit" ? "score under correction" : "publishes " + D.fmtDate(D.weekDate(D.weekOf(n))));
      return '<path class="us-state" d="' + M.states[n] + '" data-name="' + esc(n) + '" data-status="' + st + '"' + (g ? ' data-grade="' + g + '"' : "") +
        (D.next && D.next.state === n ? ' data-next="1"' : "") + ' tabindex="0" role="button" aria-label="' + esc(label) + '"></path>';
    }).join("");
    var labels = names.map(function (n) {
      if (NO_LABEL[n]) return "";
      var c = M.centers[n], r = vrec(n), g = r && r.status !== "reaudit" ? r.grade : "";
      return '<text class="us-lab" x="' + c[0] + '" y="' + c[1] + '"' + (g ? ' data-grade="' + g + '"' : "") + ">" + ABBR[n] + "</text>";
    }).join("");
    var scored = scoredList().length, pend = D.roster.filter(function (n) { return vstatus(n) === "reaudit"; }).length;

    var legend = !REV ? "" : D.bands.slice().reverse().map(function (b) {
      var n = scoredList().filter(function (s) { return s.grade === b.grade; }).length;
      return '<li><i class="sw g-' + b.grade + '"></i><b>' + b.grade + "</b><span>" + b.min + "&ndash;" + b.max + (n ? " &middot; " + n : "") + "</span></li>";
    }).join("");

    host.innerHTML =
      '<div class="usmap">' +
      '<div class="usmap-stage">' +
      '<svg class="usmap-svg" viewBox="' + M.viewBox + '" role="group" aria-label="Map of the fifty states, colored by Sovereignty grade. Select a state to open its scorecard.">' +
      '<defs><pattern id="usHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="hatch-ln"/></pattern></defs>' +
      '<g class="us-states">' + paths + '</g><g class="us-labels" aria-hidden="true">' + labels + "</g></svg>" +
      '<div class="us-tip" hidden></div>' +
      '<div class="us-pop" role="dialog" aria-modal="false" aria-label="State scorecard" tabindex="-1" hidden></div>' +
      "</div>" +
      '<div class="usmap-foot"><ul class="usmap-legend" aria-label="Legend">' + legend +
      '<li><i class="sw sw-q"></i><span>' + (REV ? "Not yet published" : "Scores locked") + "</span></li>" +
      (REV && pend ? '<li><i class="sw sw-h"></i><span>Under correction</span></li>' : "") +
      '<li><i class="sw sw-n"></i><span>Next up</span></li></ul>' +
      '<p class="usmap-hint">' + (REV ? (scored ? scored + " of " + D.totalStates + " audits published. One more each week." : "Audits publish weekly, Alabama first.") + " Select a state for its scorecard or schedule." : "Scores and grades publish weekly from " + D.fmtDate(D.launch) + ", Alabama first. Select a state for its schedule.") + "</p></div></div>";

    var stage = $(".usmap-stage", host), svg = $(".usmap-svg", host), grp = $(".us-states", host), pop = $(".us-pop", host), tip = $(".us-tip", host);
    var current = null, lastFocus = null;

    function px(n) {   /* state centre in stage pixels */
      var b = M.boxes[n], vb = svg.viewBox.baseVal, k = svg.getBoundingClientRect().width / vb.width;
      return { cx: ((b[0] + b[2]) / 2) * k, cy: ((b[1] + b[3]) / 2) * k, x0: b[0] * k, x1: b[2] * k, y0: b[1] * k, y1: b[3] * k, k: k };
    }

    function popHtml(n) {
      var r = vrec(n), st = vstatus(n), pil = pillarsFor(r);
      var h = '<button type="button" class="up-x" aria-label="Close scorecard">&times;</button>';
      if (st === "queued") {
        var w = D.weekOf(n), when = D.fmtDate(D.weekDate(w));
        return h + '<div class="up-head"><div><span class="up-k">Week ' + w + " of " + D.totalStates + "</span><h3>" + esc(n) + '</h3></div><span class="grade-chip g-queued">&ndash;</span></div>' +
          '<div class="up-score"><em>' + (REV ? "Not yet published" : "Score locked until launch") + "</em></div>" +
          '<p class="up-blurb">' + (D.next && D.next.state === n ? esc(D.next.note) + " " : "") + "The " + esc(n) + " audit publishes " + D.weekdayName(D.weekDate(w)) + ", " + when + ". States publish alphabetically, one a week, through Wyoming on " + D.fmtDate(D.weekDate(D.totalStates)) + ".</p>" +
          '<a class="up-link" href="grading.html">How states are graded &rarr;</a>';
      }
      if (st === "audited") {
        var band = D.gradeFor(r.score);
        h += '<div class="up-head"><div><span class="up-k">Week ' + r.week + " of " + D.totalStates + "</span><h3>" + esc(n) + "</h3></div>" + chip(r.grade) + "</div>" +
          '<div class="up-score"><b>' + r.score + "</b><span>/100</span><em>Grade " + r.grade + " &middot; " + esc(band.short) + "</em></div>" +
          '<div class="up-track"><i class="g-' + r.grade + '" style="width:' + r.score + '%"></i><b style="left:70%"></b></div>';
        if (pil) {
          h += '<ul class="up-pillars">' + D.pillars.map(function (p) {
            var v = pil.p[p.key];
            return "<li><span>" + esc(p.name) + '</span><div class="mini"><i class="g-' + D.gradeFor(v).grade + '" style="width:' + v + '%"></i></div><b>' + v + "</b></li>";
          }).join("") + "</ul>";
        } else {
          h += '<p class="up-hold">Pillar scores publish with the full audit.</p>';
        }
        h += '<p class="up-blurb">' + esc(r.finding) + "</p>" +
          '<p class="up-meta"><span>Comprehensive law: <b>' + (r.comp ? "Yes" : "None") + "</b></span><span>Verified " + D.fmtDate(r.verified) + "</span></p>" +
          '<a class="up-link" href="' + href(n) + '">Read the full audit &rarr;</a>';
      } else if (st === "reaudit") {
        h += '<div class="up-head"><div><span class="up-k">Week ' + r.week + " of " + D.totalStates + "</span><h3>" + esc(n) + '</h3></div><span class="grade-chip g-pending">?</span></div>' +
          '<div class="up-score"><em>Score withdrawn while the audit is corrected</em></div>' +
          '<p class="up-blurb">' + esc(r.finding) + "</p>" +
          '<a class="up-link" href="' + href(n) + '">See the correction &rarr;</a>';
      }
      return h;
    }

    function place(n) {
      pop.classList.remove("sheet");
      pop.style.left = pop.style.top = "";
      if (window.innerWidth < 720) { pop.classList.add("sheet"); return; }
      var p = px(n), W = stage.clientWidth, H = stage.clientHeight, pw = pop.offsetWidth, ph = pop.offsetHeight;
      var left = p.cx > W * 0.5 ? p.x0 - pw - 14 : p.x1 + 14;
      left = Math.max(8, Math.min(W - pw - 8, left));
      var top = Math.max(8, Math.min(H - ph - 8, p.cy - ph / 2));
      pop.style.left = left + "px"; pop.style.top = top + "px";
    }

    function select(n, focusPop) {
      var el = $('.us-state[data-name="' + n.replace(/"/g, '\\"') + '"]', host);
      if (!el) return;
      $$(".us-state.is-sel", host).forEach(function (x) { x.classList.remove("is-sel"); });
      el.classList.add("is-sel");
      grp.appendChild(el);                       /* draw the selected outline on top */
      current = n; lastFocus = el;
      pop.innerHTML = popHtml(n);
      pop.hidden = false; tip.hidden = true;
      place(n);
      try { history.replaceState(null, "", "#map-" + D.slug(n)); } catch (e) {}
      if (focusPop) pop.focus({ preventScroll: true });
    }
    function close(restore) {
      if (!current) return;
      $$(".us-state.is-sel", host).forEach(function (x) { x.classList.remove("is-sel"); });
      pop.hidden = true; current = null;
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (restore && lastFocus) lastFocus.focus({ preventScroll: true });
    }

    svg.addEventListener("click", function (e) {
      var t = e.target.closest(".us-state"); if (t) { e.stopPropagation(); select(t.getAttribute("data-name"), false); }
    });
    svg.addEventListener("keydown", function (e) {
      var t = e.target.closest(".us-state");
      if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(t.getAttribute("data-name"), true); }
    });
    pop.addEventListener("click", function (e) { if (e.target.closest(".up-x")) close(true); });
    document.addEventListener("click", function (e) { if (current && !e.target.closest(".us-pop") && !e.target.closest(".us-state")) close(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && current) close(true); });
    window.addEventListener("resize", function () { if (current) place(current); });

    /* hover label */
    stage.addEventListener("mousemove", function (e) {
      var t = e.target.closest && e.target.closest(".us-state");
      if (!t || !pop.hidden && window.innerWidth >= 720 && pop.contains(e.target)) { tip.hidden = true; return; }
      var n = t.getAttribute("data-name"), r = vrec(n), s = stage.getBoundingClientRect();
      tip.textContent = REV ? n + (r && r.status !== "reaudit" ? " · " + r.score + " · " + r.grade : r ? " · under correction" : "") : n;
      tip.hidden = false;
      tip.style.left = Math.min(stage.clientWidth - tip.offsetWidth - 4, e.clientX - s.left + 14) + "px";
      tip.style.top = Math.max(2, e.clientY - s.top - 34) + "px";
    });
    stage.addEventListener("mouseleave", function () { tip.hidden = true; });

    /* deep link: states.html#map-virginia */
    function fromHash() {
      var m = /^#map-([a-z-]+)$/.exec(location.hash);
      if (!m) return;
      var n = names.filter(function (x) { return D.slug(x) === m[1]; })[0];
      if (n) select(n, false);
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    reveal(host);
  }

  /* =================================================================
     UNIT CHART: every scored state, stacked in its grade band
     ================================================================= */
  function renderDist(host) {
    var sc = scoredList();
    var cols = D.bands.slice().reverse().map(function (b) {
      var m = sc.filter(function (s) { return s.grade === b.grade; }).sort(function (a, c) { return a.score - c.score; });
      var tiles = m.map(function (s, i) {
        return '<a class="vt g-' + s.grade + '" style="--i:' + i + '" href="' + href(s.state) + '" title="' + esc(s.state) + " · " + s.score + " · Grade " + s.grade + '"><span>' + ABBR[s.state] + "</span></a>";
      }).join("");
      return '<div class="vcol"><div class="vstack">' + (tiles || '<span class="vnone">None yet</span>') + "</div>" +
        '<a class="vlab" href="grading.html#bands"><b class="g-' + b.grade + '">' + b.grade + "</b><span>" + b.min + "&ndash;" + b.max + "</span><em>" + m.length + "</em></a></div>";
    }).join("");
    var med = median(sc.map(function (s) { return s.score; }));
    var top = sc.slice().sort(function (a, b) { return b.score - a.score; });
    var pend = D.states.filter(function (x) { return x.status === "reaudit"; });
    host.innerHTML = '<div class="vz-dist">' + cols + "</div>" +
      '<p class="vz-cap">' + sc.length + " scored states. Median <b>" + Math.round(med) + "</b>, high <a href=\"" + href(top[0].state) + '">' + esc(top[0].state) + " " + top[0].score + "</a>, low <a href=\"" + href(top[top.length - 1].state) + '">' + esc(top[top.length - 1].state) + " " + top[top.length - 1].score + "</a>." +
      (pend.length ? " " + pend.map(function (p) { return '<a href="' + href(p.state) + '">' + esc(p.state) + "</a>"; }).join(", ") + " is under correction and not shown." : "") +
      ' Each tile opens that state&rsquo;s audit.</p>';
    reveal(host);
  }

  /* =================================================================
     HEAT TABLE: pillar scores, where published
     ================================================================= */
  function renderPillarHeat(host) {
    var rows = scoredList().map(function (r) { return { r: r, pil: pillarsFor(r) }; }).filter(function (x) { return x.pil; }).sort(function (a, b) { return b.r.score - a.r.score; });
    var total = scoredList().length;
    var head = D.pillars.map(function (p, i) { return '<th scope="col"><a href="declaration.html#art-' + ["i", "ii", "iii", "iv", "v"][i] + '">' + esc(p.name) + "</a><small>" + p.weight + "%</small></th>"; }).join("");
    var body = rows.map(function (x) {
      return '<tr><th scope="row"><a href="' + href(x.r.state) + '">' + esc(x.r.state) + "</a></th>" + D.pillars.map(function (p) {
        var v = x.pil.p[p.key];
        return '<td><a class="hc g-' + D.gradeFor(v).grade + '" href="' + href(x.r.state) + "#art-" + p.key + '" title="' + esc(x.r.state + " · " + p.name + " · " + v) + '"><b>' + v + "</b></a></td>";
      }).join("") + '<td class="hs">' + chip(x.r.grade) + "<b>" + x.r.score + "</b></td></tr>";
    }).join("");
    host.innerHTML = '<div class="vz-heat-wrap"><table class="vz-heat"><thead><tr><th scope="col">State</th>' + head + '<th scope="col" class="hs">Score</th></tr></thead><tbody>' + body + "</tbody></table></div>" +
      '<p class="vz-cap">Pillar-level scores are published for ' + rows.length + " of " + total + " scored states so far; the rest appear with their full audits. Color is the grade band of the pillar score. Each cell opens that article of the audit.</p>";
    reveal(host);
  }

  /* =================================================================
     PER-STATE INFOGRAPHIC
     ================================================================= */
  function svgEl(w, h, cls, label) { return '<svg class="' + cls + '" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' + esc(label) + '">'; }

  function panelSits(r) {
    var sc = scoredList(), W = 680, pad = 14, step = 20;
    function X(v) { return pad + v / 100 * (W - 2 * pad); }
    var order = sc.slice().sort(function (a, b) { return a.state === r.state ? -1 : b.state === r.state ? 1 : a.score - b.score; });
    var lv = [], place = {};
    order.forEach(function (s) {
      var px = X(s.score), k = 0;
      for (;;) { lv[k] = lv[k] || []; if (lv[k].every(function (o) { return Math.abs(o - px) >= step - 1; })) { lv[k].push(px); break; } k++; }
      place[s.state] = k;
    });
    var levels = lv.length, H = 78 + levels * step + 26, base = H - 44;
    var bands = D.bands.map(function (b) {
      var x0 = X(b.min), x1 = X(b.max + 1);
      return '<rect class="sb g-' + b.grade + '" x="' + x0 + '" y="0" width="' + (x1 - x0) + '" height="' + (H - 26) + '"/><text class="sbl" x="' + (x0 + 8) + '" y="18">' + b.grade + "</text>";
    }).join("");
    var ticks = [0, 20, 40, 55, 70, 85, 100].map(function (v) { return '<text class="stk" x="' + X(v) + '" y="' + (H - 8) + '" text-anchor="middle">' + v + "</text>"; }).join("");
    var dots = sc.slice().sort(function (a, b) { return (a.state === r.state) - (b.state === r.state); }).map(function (s, i) {
      var cx = X(s.score), cy = base - place[s.state] * step, me = s.state === r.state, rad = me ? 11 : 9;
      return '<a href="' + (me ? "#scorecard" : href(s.state)) + '" class="sd' + (me ? " me" : "") + '" style="--i:' + i + '"><title>' + esc(s.state) + " · " + s.score + " · Grade " + s.grade + "</title>" +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" class="g-' + s.grade + '"/><text x="' + cx + '" y="' + (cy + 3) + '" text-anchor="middle">' + ABBR[s.state] + "</text></a>";
    }).join("");
    var mx = X(r.score), anchor = mx < 90 ? "start" : mx > W - 90 ? "end" : "middle";
    var lab = '<line class="sle" x1="' + mx + '" x2="' + mx + '" y1="50" y2="' + (base - place[r.state] * step - 14) + '"/><text class="sme" x="' + mx + '" y="44" text-anchor="' + anchor + '">' + esc(r.state) + " &middot; " + r.score + "</text>";
    var ranked = sc.slice().sort(function (a, b) { return b.score - a.score || a.entry - b.entry; });
    var rank = ranked.map(function (s) { return s.state; }).indexOf(r.state) + 1;
    var lead = ranked[0];
    var line = r.state === lead.state ? "Highest score on the board." : (lead.score - r.score) + " points behind " + '<a href="' + href(lead.state) + '">' + esc(lead.state) + "</a>.";
    return '<figure class="vz-panel vz-wide"><figcaption><b>Where ' + esc(r.state) + " sits</b><span>Ranked " + ord(rank) + " of " + sc.length + " scored states. " + line + "</span></figcaption>" +
      '<div class="vz-scroll">' + svgEl(W, H, "vz-sits", r.state + " scored " + r.score + ", ranked " + rank + " of " + sc.length) + bands + '<line class="sax" x1="' + pad + '" x2="' + (W - pad) + '" y1="' + (H - 26) + '" y2="' + (H - 26) + '"/>' + ticks + dots + lab + "</svg></div>" +
      '<p class="vz-note"><a href="states.html#map-' + D.slug(r.state) + '">See it on the map &rarr;</a> &nbsp;&middot;&nbsp; <a href="index.html#leaderboard">Full leaderboard &rarr;</a></p></figure>';
  }

  function panelRadar(r, pil) {
    var W = 420, H = 330, cx = 210, cy = 165, R = 104, n = D.pillars.length;
    function pt(i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + R * v / 100 * Math.cos(a), cy + R * v / 100 * Math.sin(a)]; }
    var rings = [25, 50, 75, 100].map(function (v) { return '<polygon class="rg" points="' + D.pillars.map(function (p, i) { return pt(i, v).join(","); }).join(" ") + '"/>'; }).join("");
    var axes = D.pillars.map(function (p, i) { var e = pt(i, 100); return '<line class="ax" x1="' + cx + '" y1="' + cy + '" x2="' + e[0] + '" y2="' + e[1] + '"/>'; }).join("");
    var poly = D.pillars.map(function (p, i) { return pt(i, pil.p[p.key]).join(","); }).join(" ");
    var marks = D.pillars.map(function (p, i) {
      var v = pil.p[p.key], q = pt(i, v), l = pt(i, 100), a = -Math.PI / 2 + i * 2 * Math.PI / n, c = Math.cos(a), s = Math.sin(a);
      var lx = cx + (R + 16) * c, ly = cy + (R + 16) * s + (s > 0.5 ? 10 : s < -0.5 ? -2 : 4);
      var anc = c > 0.3 ? "start" : c < -0.3 ? "end" : "middle";
      return '<a href="#art-' + p.key + '"><title>' + esc(p.name + " · " + v + " · " + p.weight + "% of the score") + "</title>" +
        '<circle class="rv g-' + D.gradeFor(v).grade + '" cx="' + q[0] + '" cy="' + q[1] + '" r="6"/>' +
        '<text class="rl" x="' + lx + '" y="' + ly + '" text-anchor="' + anc + '">' + esc(p.name) + '<tspan class="rn" x="' + lx + '" dy="13">' + v + " &middot; " + p.weight + "%</tspan></text></a>";
    }).join("");
    return '<figure class="vz-panel"><figcaption><b>The five articles</b><span>Each score out of 100. Each point opens that article.</span></figcaption>' +
      svgEl(W, H, "vz-radar", r.state + " pillar scores") + rings + axes + '<polygon class="rp" points="' + poly + '"/>' + marks + "</svg></figure>";
  }

  function panelBuild(r, pil) {
    var calc = D.score(pil.p, pil.penalty, false);
    var cum = 0, segs = D.pillars.map(function (p, i) {
      var c = pil.p[p.key] * p.weight / 100, left = cum; cum += c;
      return '<a class="seg s' + i + '" href="#art-' + p.key + '" style="left:' + left + "%;width:" + c + '%" title="' + esc(p.name + ": " + pil.p[p.key] + " × " + p.weight + "% = " + c.toFixed(1)) + '">' + (c >= 5 ? "<span>" + c.toFixed(0) + "</span>" : "") + "</a>";
    }).join("");
    var pen = calc.penalty;
    return '<figure class="vz-panel"><figcaption><b>How the score is built</b><span>Weighted pillars, less the exemption penalty.</span></figcaption>' +
      '<div class="vz-build">' +
      '<div class="vb"><span class="vl">Weighted pillars</span><div class="vt2">' + segs + '<i class="m70"></i></div><b class="vv">' + calc.weighted.toFixed(1) + "</b></div>" +
      '<div class="vb"><span class="vl">Exemption penalty</span><div class="vt2"><a class="seg pen" href="#adjustments" style="left:' + Math.max(0, calc.weighted - pen) + "%;width:" + Math.min(pen, calc.weighted) + '%"></a><i class="m70"></i></div><b class="vv neg">&minus;' + pen + "</b></div>" +
      '<div class="vb"><span class="vl">Sovereignty Score</span><div class="vt2"><a class="seg fin g-' + r.grade + '" href="#scorecard" style="left:0;width:' + r.score + '%"></a><i class="m70"></i></div><b class="vv">' + r.score + "</b></div>" +
      '<div class="vaxis"><span>0</span><span>25</span><span>50</span><span class="b70">70 &middot; B</span><span>100</span></div></div></figure>';
  }

  function panelGap(r) {
    var sc = scoredList().sort(function (a, b) { return b.score - a.score; });
    var top = sc[0], bot = sc[sc.length - 1], med = median(sc.map(function (s) { return s.score; }));
    var rows = [
      { l: r.state, v: r.score, me: true, g: r.grade },
      { l: "Highest · " + top.state, v: top.score, h: href(top.state), g: top.grade },
      { l: "Median of " + sc.length, v: Math.round(med), g: D.gradeFor(med).grade },
      { l: "Lowest · " + bot.state, v: bot.score, h: href(bot.state), g: bot.grade }
    ];
    return '<figure class="vz-panel"><figcaption><b>Against the board</b><span>The highest, the median and the lowest scored state.</span></figcaption><div class="vz-build">' +
      rows.map(function (x) {
        var lab = x.h && x.l.split(" · ")[1] !== r.state ? '<a href="' + x.h + '">' + esc(x.l) + "</a>" : esc(x.l);
        return '<div class="vb' + (x.me ? " me" : "") + '"><span class="vl">' + lab + '</span><div class="vt2"><i class="seg fin g-' + x.g + '" style="left:0;width:' + x.v + '%"></i><i class="m70"></i></div><b class="vv">' + x.v + "</b></div>";
      }).join("") + '<div class="vaxis"><span>0</span><span>25</span><span>50</span><span class="b70">70 &middot; B</span><span>100</span></div></div></figure>';
  }

  function panelHold(text) { return '<figure class="vz-panel"><div class="sd-hold">' + text + "</div></figure>"; }

  function renderStateViz(host) {
    var name = host.getAttribute("data-viz-state"), r = rec(name);
    if (!r) return;
    if (r.status === "reaudit") {
      host.innerHTML = '<div class="vz-grid">' + panelHold("No score is published while this audit is under correction, so there is nothing to plot. The other states are on the <a href=\"states.html\">map</a> and in the <a href=\"index.html#leaderboard\">leaderboard</a>.") + "</div>";
      return;
    }
    var pil = pillarsFor(r), h = '<div class="vz-grid">' + panelSits(r);
    if (pil) h += panelRadar(r, pil) + panelBuild(r, pil);
    else h += panelHold("<b>Pillar scores publish with the full audit.</b> The five-article chart and the score build-up appear here once they do.") + panelGap(r);
    host.innerHTML = h + "</div>";
    reveal(host);
  }

  /* =================================================================
     boot
     ================================================================= */
  /* Embargo interstitial: the map stays live; everything below it is hazed behind a launch card. */
  function embargoPage() {
    var map = document.getElementById("map"), glance = document.getElementById("glance"), states = document.getElementById("states");
    if (!map || !states) return;
    /* decorative, data-free skeletons: no scores exist in the DOM while embargoed */
    var sk = slot("viz-dist");
    if (sk && glance && glance.contains(sk)) sk.innerHTML = '<div class="vz-dist">' + D.bands.slice().reverse().map(function (b) {
      return '<div class="vcol"><div class="vstack"><span class="vt vt-empty"></span></div><span class="vlab"><b>' + b.grade + "</b><span>" + b.min + "&ndash;" + b.max + "</span></span></div>";
    }).join("") + "</div>";
    var hk = slot("viz-pillar-heat");
    if (hk && glance && glance.contains(hk)) hk.innerHTML = '<div class="vz-heat-wrap"><div class="hc-skel"></div></div>';

    var wrap = document.createElement("div");
    wrap.className = "embargo";
    var body = document.createElement("div");
    body.className = "embargo-body";
    body.setAttribute("aria-hidden", "true");
    if ("inert" in body) body.inert = true;
    var veil = document.createElement("div");
    veil.className = "embargo-veil";
    var when = D.weekdayName(D.launch) + ", " + D.fmtDate(D.launch) + " \u00b7 12:00 a.m. Eastern";
    veil.innerHTML = '<aside class="embargo-card" role="region" aria-label="Launch countdown">' +
      '<span class="ek">Opens at launch</span>' +
      "<h2>Fifty states. One rubric. <em>Week 1 is Alabama.</em></h2>" +
      '<div class="ek-clock" role="timer" aria-live="off"></div>' +
      '<p class="ek-when">' + when + "</p>" +
      "<p>The map shows the schedule. Each audit unlocks on its week, alphabetically, from Alabama to Wyoming on " + D.fmtDate(D.weekDate(D.totalStates)) + ".</p>" +
      '<div class="ek-btns"><a class="up-link" href="https://thinkersdilemma.substack.com/subscribe" rel="noopener">Get the launch note</a>' +
      '<a class="ek-ghost" href="declaration.html">Read the Declaration</a></div></aside>';
    var clock = $(".ek-clock", veil);
    function tick() {
      var ms = D.launchAt - Date.now();
      if (ms <= 0) { clock.innerHTML = ""; location.reload(); return; }
      var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4), sec = Math.floor(ms % 6e4 / 1e3);
      function cell(n, l) { return "<div><b>" + String(n).padStart(2, "0") + "</b><span>" + l + "</span></div>"; }
      clock.innerHTML = cell(d, "days") + cell(h, "hours") + cell(m, "min") + cell(sec, "sec");
      clock.setAttribute("aria-label", d + " days, " + h + " hours, " + m + " minutes until launch");
    }
    tick();
    var timer = setInterval(tick, 1000);
    map.parentNode.insertBefore(wrap, map.nextSibling);
    [glance, states].forEach(function (n) { if (n) body.appendChild(n); });
    wrap.appendChild(body);
    wrap.appendChild(veil);
  }

  function boot() {
    var h;
    if ((h = slot("us-map"))) renderMap(h);
    if (!REV && slot("us-map")) embargoPage();
    if (REV || !(slot("viz-dist") && document.getElementById("glance") && document.getElementById("glance").contains(slot("viz-dist")))) {
      if ((h = slot("viz-dist"))) renderDist(h);
      if ((h = slot("viz-pillar-heat"))) renderPillarHeat(h);
    }
    $$("[data-viz-state]").forEach(renderStateViz);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
