/* =====================================================================
   DIGITAL SOVEREIGNTY AUDIT — page rendering + calculator
   Reads window.DSP (dsp-data.js). Each block renders into a
   [data-dsp="..."] slot, so pages stay plain HTML with no build step.
   ===================================================================== */
(function () {
  "use strict";
  var D = window.DSP;
  if (!D) return;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function slot(name) { return $('[data-dsp="' + name + '"]'); }
  function pillarByKey(k) { return D.pillars.filter(function (p) { return p.key === k; })[0]; }
  function chip(grade) { return '<span class="grade-chip g-' + grade + '" aria-label="Grade ' + grade + '">' + grade + "</span>"; }

  /* states withdrawn for re-audit carry no score and are kept out of every statistic */
  /* only audits whose week has arrived count; the board, stats and logs grow week by week */
  function scored() { return D.liveStates().filter(function (x) { return x.status !== "reaudit"; }); }
  function pendingStates() { return D.liveStates().filter(function (x) { return x.status === "reaudit"; }); }

  /* ---------- derived stats (never hard-coded) -------------------- */
  function stats() {
    var s = scored().sort(function (a, b) { return b.score - a.score; });
    var top = s[0] || null, bottom = s[s.length - 1] || null;
    var aboveC = s.filter(function (x) { return x.score >= 70; }).length;
    return { n: s.length, pending: pendingStates().length, top: top, bottom: bottom, spread: top ? top.score - bottom.score : null, aboveC: aboveC };
  }

  function renderStats(host) {
    var st = stats();
    if (!st.n) {
      host.innerHTML =
        '<div class="dsp-stat"><span class="n">0<small>/' + D.totalStates + '</small></span><span class="l">Audits published</span></div>' +
        '<div class="dsp-stat"><span class="n">' + D.weekOf(D.next.state) + '</span><span class="l">Next week<br>' + esc(D.next.state) + " &middot; " + D.fmtDate(D.weekDate(D.weekOf(D.next.state))) + "</span></div>" +
        '<div class="dsp-stat"><span class="n">' + D.totalStates + '</span><span class="l">Weeks to Wyoming<br>' + D.fmtDate(D.weekDate(D.totalStates)) + "</span></div>";
      return;
    }
    host.innerHTML =
      '<div class="dsp-stat"><span class="n">' + st.n + '<small>/' + D.totalStates + '</small></span><span class="l">States audited' + (st.pending ? '<br>+ ' + st.pending + ' under correction' : "") + '</span></div>' +
      '<div class="dsp-stat"><span class="n">' + st.top.score + '</span><span class="l">Highest score<br>' + esc(st.top.state) + " · " + st.top.grade + "</span></div>" +
      '<div class="dsp-stat"><span class="n">' + st.bottom.score + '</span><span class="l">Lowest score<br>' + esc(st.bottom.state) + " · " + st.bottom.grade + "</span></div>" +
      '<div class="dsp-stat"><span class="n">' + st.aboveC + '</span><span class="l">States above a C</span></div>';
  }

  /* ---------- leaderboard ----------------------------------------- */
  function renderBoard(host) {
    var rows = scored().sort(function (a, b) { return b.score - a.score || a.entry - b.entry; });
    if (!rows.length && !pendingStates().length) {
      host.innerHTML = '<div class="board-empty"><b>No audits are published yet.</b><p>The leaderboard ranks every state whose audit has gone live, and re-ranks each Thursday as a new one is added. Week 1 is Alabama, ' +
        D.weekdayName(D.launch) + ", " + D.fmtDate(D.launch) + ", 12:00 a.m. Eastern. Wyoming closes the series on " + D.fmtDate(D.weekDate(D.totalStates)) + ".</p></div>";
      var c0 = slot("board-count"); if (c0) c0.textContent = 0;
      var f0 = slot("board-filter"); if (f0) f0.innerHTML = "";
      return;
    }
    var html = '<div class="board-head" aria-hidden="true"><span>#</span><span>State</span><span class="c-law">Comprehensive law</span><span class="c-bar">Sovereignty Score</span><span class="c-grade">Grade</span></div>';
    rows.forEach(function (r, i) {
      html +=
        '<article class="board-row" data-grade="' + r.grade + '">' +
        '<span class="c-rank">' + (i + 1) + "</span>" +
        '<div class="c-state"><h3>' + esc(r.state) + '</h3><p>' + esc(r.finding) + '</p><span class="entry">Week ' + r.week + " of " + D.totalStates + " · Verified " + D.fmtDate(r.verified) + "</span>" + rescored(r) + updatesHtml(r) + "</div>" +
        '<span class="c-law ' + (r.comp ? "yes" : "no") + '">' + (r.comp ? "Yes" : "None") + "</span>" +
        '<div class="c-bar"><div class="track" role="img" aria-label="' + esc(r.state) + " scored " + r.score + ' out of 100"><i class="fill g-' + r.grade + '" style="width:' + r.score + '%"></i><b class="tick" style="left:70%"></b></div><span class="num">' + r.score + "</span></div>" +
        '<span class="c-grade">' + chip(r.grade) + "</span></article>";
    });
    pendingStates().forEach(function (r) {
      html += '<article class="board-row pending" data-grade="pending">' +
        '<span class="c-rank">&ndash;</span>' +
        '<div class="c-state"><h3>' + esc(r.state) + '</h3><p>' + esc(r.finding) + '</p><span class="entry">Week ' + r.week + " of " + D.totalStates + " · Checked " + D.fmtDate(r.verified) + "</span>" + updatesHtml(r) + "</div>" +
        '<span class="c-law no">Re-audit</span>' +
        '<div class="c-bar"><span class="pend-note">Score withdrawn. Republished in Week ' + r.week + ".</span></div>" +
        '<span class="c-grade"><span class="grade-chip g-pending" aria-label="Under correction">?</span></span></article>';
    });
    html += '<p class="board-foot"><b class="tickkey"></b> The line at 70 is where a B begins.' + (rows.some(function (r) { return r.score >= 70; }) ? "" : " No published state has crossed it.") + "</p>";
    host.innerHTML = html;

    var chipsHost = slot("board-filter");
    if (chipsHost) {
      var grades = ["all"].concat(D.bands.map(function (b) { return b.grade; }).filter(function (g) {
        return D.liveStates().some(function (s) { return s.grade === g; });
      }));
      chipsHost.innerHTML = grades.map(function (g, i) {
        return '<button type="button" class="chip' + (i === 0 ? " active" : "") + '" data-g="' + g + '">' + (g === "all" ? "All" : "Grade " + g) + "</button>";
      }).join("");
      chipsHost.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-g]");
        if (!b) return;
        $$("button", chipsHost).forEach(function (x) { x.classList.toggle("active", x === b); });
        var g = b.getAttribute("data-g");
        var shown = 0;
        $$(".board-row", host).forEach(function (row) {
          var show = g === "all" ? true : row.getAttribute("data-grade") === g;
          row.classList.toggle("is-hidden", !show);
          if (show && !row.classList.contains("pending")) shown++;
        });
        var c = slot("board-count");
        if (c) c.textContent = shown;
      });
    }
    var cnt = slot("board-count");
    if (cnt) cnt.textContent = rows.length;
  }

  /* ---------- update log helpers ---------------------------------- */
  function rescored(r) {
    if (r.scoreWas == null) return "";
    return '<p class="rescored">Re-scored from ' + r.scoreWas + " to " + r.score + ". See the update log.</p>";
  }
  function updatesHtml(r) {
    if (!r.updates || !r.updates.length) return '<p class="upd-none">No changes since audit.</p>';
    return '<details class="upd"><summary>Updates since audit (' + r.updates.length + ")</summary><ul>" +
      r.updates.map(function (u) {
        return "<li><time>" + D.fmtDate(u.date) + "</time> " + esc(u.text) + ' <em>' + esc(u.effect) + "</em></li>";
      }).join("") + "</ul></details>";
  }

  /* ---------- countdown ------------------------------------------- */
  function renderCountdown(host) {
    function draw() {
      var ph = D.phase();
      var launch = D.fmtDate(D.launch);
      if (ph.phase === "pre") {
        var ms = D.launchAt - Date.now();
        if (ms < 0) ms = 0;
        var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
        host.innerHTML = '<div class="cd-label">Week 1 (Alabama) publishes ' + launch + ' \u00b7 12:00 a.m. Eastern</div>' +
          '<div class="cd-clock" role="timer" aria-label="' + d + " days, " + h + " hours, " + m + ' minutes until launch">' +
          '<div><b>' + d + '</b><span>days</span></div><div><b>' + h + '</b><span>hours</span></div><div><b>' + m + '</b><span>minutes</span></div></div>' +
          '<div class="cd-tag">' + esc(D.tagline) + "</div>";
      } else {
        host.innerHTML = '<div class="cd-label">Now publishing</div><div class="cd-week"><b>Week ' + ph.week + '</b><span>of ' + D.totalStates + "</span></div>" +
          '<div class="cd-tag">' + esc(D.tagline) + "</div>";
      }
    }
    draw();
    setInterval(draw, 30000);
  }

  /* ---------- full update log ------------------------------------- */
  function renderUpdateLog(host) {
    var all = [];
    D.liveStates().forEach(function (s) { (s.updates || []).forEach(function (u) { all.push({ s: s, u: u }); }); });
    all.sort(function (a, b) { return a.u.date < b.u.date ? 1 : a.u.date > b.u.date ? -1 : 0; });
    host.innerHTML = '<ol class="logl">' + all.map(function (x) {
      return "<li><time>" + D.fmtDate(x.u.date) + '</time><b>' + esc(x.s.state) + "</b><p>" + esc(x.u.text) + "</p><em>" + esc(x.u.effect) + "</em></li>";
    }).join("") + "</ol>";
  }

  function renderWatch(host) {
    host.innerHTML = '<div class="watch-box"><h3>Schedule watch</h3><p>' + esc(D.watchNote) + '</p><ul class="watch-list">' +
      D.watch.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="watch-box"><h3>Federal preemption watch</h3><p><b>' + esc(D.preemption.bill) + ".</b> " + esc(D.preemption.text) + "</p></div>";
  }

  /* ---------- pillar summary cards -------------------------------- */
  function renderPillarCards(host) {
    host.innerHTML = D.pillars.map(function (p, i) {
      return '<div class="pillar-card' + (p.heavy ? " heavy" : "") + '">' +
        '<span class="pc-no">Pillar ' + (i + 1) + "</span>" +
        '<span class="pc-w">' + p.weight + '<small>%</small></span>' +
        '<h3>' + esc(p.name) + "</h3>" +
        '<p class="pc-q">' + esc(p.question) + "</p>" +
        '<div class="pc-bar"><i style="width:' + (p.weight / 30 * 100) + '%"></i></div></div>';
    }).join("");
  }

  /* ---------- bands ----------------------------------------------- */
  function renderBands(host) {
    host.innerHTML = D.bands.map(function (b) {
      return '<div class="band g-' + b.grade + '"><span class="bg">' + b.grade + '</span><span class="br">' + b.min + "–" + b.max + '</span><span class="bs">' + esc(b.short) + "</span></div>";
    }).join("");
  }

  /* ---------- criteria tables ------------------------------------- */
  function renderCriteria(host) {
    host.innerHTML = D.pillars.map(function (p, i) {
      var rows = p.criteria.map(function (c) { return "<tr><td>" + esc(c.label) + '</td><td class="pts">' + c.pts + "</td></tr>"; }).join("");
      return '<section class="crit-block" id="pillar-' + p.key + '">' +
        '<div class="crit-head"><span class="pc-no">Pillar ' + (i + 1) + '</span><span class="w">' + p.weight + '% of the score</span></div>' +
        '<h3>' + esc(p.name) + "</h3>" +
        '<p class="crit-q">' + esc(p.blurb) + "</p>" +
        '<table class="dsp-table"><thead><tr><th>Criterion</th><th class="pts">Points</th></tr></thead><tbody>' + rows +
        '<tr class="tot"><td>Total</td><td class="pts">100</td></tr></tbody></table>' +
        '<p class="reality"><b>Reality check.</b> ' + esc(p.reality) + "</p></section>";
    }).join("");
  }

  function renderExemptions(host) {
    var rows = D.exemptions.map(function (c) { return "<tr><td>" + esc(c.label) + '</td><td class="pts">−' + c.pts + "</td></tr>"; }).join("");
    host.innerHTML = '<table class="dsp-table"><thead><tr><th>Exemption present</th><th class="pts">Deduction</th></tr></thead><tbody>' + rows +
      '<tr class="tot"><td>Maximum deduction</td><td class="pts">−' + D.exemptionCap + "</td></tr></tbody></table>";
  }

  /* ---------- worked examples ------------------------------------- */
  function renderExamples(host) {
    host.innerHTML = D.examples.map(function (e, idx) {
      var r = D.score(e.pillars, e.penalty);
      var lines = D.pillars.map(function (p) {
        var v = e.pillars[p.key];
        return "<tr><td>" + esc(p.name) + '</td><td class="pts">' + v + '</td><td class="pts">× ' + (p.weight / 100).toFixed(2) + '</td><td class="pts">' + (v * p.weight / 100).toFixed(2) + "</td></tr>";
      }).join("");
      var ok = r.score === e.published;
      return '<article class="example">' +
        '<header><h3>' + esc(e.state) + '</h3><span class="entry">Entry ' + e.entry + "</span>" + chip(r.band.grade) + "</header>" +
        '<table class="dsp-table small"><thead><tr><th>Pillar</th><th class="pts">Score</th><th class="pts">Weight</th><th class="pts">Points</th></tr></thead><tbody>' + lines +
        '<tr class="tot"><td colspan="3">Weighted total</td><td class="pts">' + r.weighted.toFixed(2) + "</td></tr>" +
        '<tr><td colspan="3">Exemption penalty</td><td class="pts">' + (e.comp ? "−" + e.penalty : "N/A") + "</td></tr>" +
        '<tr class="tot"><td colspan="3">Sovereignty Score</td><td class="pts">' + r.score + "</td></tr></tbody></table>" +
        '<p class="ex-note">' + esc(e.note) + "</p>" +
        '<button type="button" class="try" data-ex="' + idx + '">Load into calculator →</button>' +
        (ok ? "" : '<p class="ex-warn">Calculator and published score disagree. Check data.</p>') +
        "</article>";
    }).join("");
  }

  /* ---------- calculator ------------------------------------------ */
  function renderCalc(host) {
    var state = { mode: "criteria", comp: false, reality: false, crit: {}, pillar: {}, ex: [] };
    D.pillars.forEach(function (p) { state.crit[p.key] = p.criteria.map(function () { return 0; }); state.pillar[p.key] = 0; });
    state.ex = D.exemptions.map(function () { return false; });

    function pillarTotal(p) {
      if (state.mode === "pillars") return Math.max(0, Math.min(100, state.pillar[p.key] || 0));
      return state.crit[p.key].reduce(function (a, b) { return a + b; }, 0);
    }
    function penaltyTotal() {
      if (!state.comp) return 0;
      return D.exemptions.reduce(function (a, e, i) { return a + (state.ex[i] ? e.pts : 0); }, 0);
    }

    var inputsHtml = '<div class="calc-mode" role="group" aria-label="Input mode">' +
      '<button type="button" class="chip active" data-mode="criteria">Score by criterion</button>' +
      '<button type="button" class="chip" data-mode="pillars">Enter pillar totals</button>' +
      '<button type="button" class="chip reset" data-reset>Reset</button></div>';

    inputsHtml += '<div class="calc-pillars">' + D.pillars.map(function (p) {
      var crit = p.criteria.map(function (c, i) {
        var id = "c-" + p.key + "-" + i;
        return '<div class="crit-in"><label for="' + id + '">' + esc(c.label) + '</label>' +
          '<span class="inwrap"><input id="' + id + '" type="number" inputmode="numeric" min="0" max="' + c.pts + '" step="1" value="0" data-p="' + p.key + '" data-i="' + i + '"><em>/ ' + c.pts + "</em></span></div>";
      }).join("");
      return '<fieldset class="calc-p" data-pk="' + p.key + '"><legend>' + esc(p.name) + ' <small>' + p.weight + '%</small></legend>' +
        '<div class="mode-criteria">' + crit + "</div>" +
        '<div class="mode-pillars crit-in"><label for="pt-' + p.key + '">' + esc(p.name) + ' pillar score</label><span class="inwrap"><input id="pt-' + p.key + '" type="number" inputmode="numeric" min="0" max="100" step="1" value="0" data-pt="' + p.key + '"><em>/ 100</em></span></div>' +
        '<div class="sub"><span>Pillar score</span><b data-sub="' + p.key + '">0</b><em>/ 100</em></div></fieldset>';
    }).join("") + "</div>";

    inputsHtml += '<fieldset class="calc-ex"><legend>Exemption penalty</legend>' +
      '<label class="toggle"><input type="checkbox" data-comp> This state has a comprehensive consumer privacy statute</label>' +
      '<p class="hint">If there is no comprehensive statute the penalty is N/A. The absence is already priced into the pillars (Refinement #1).</p>' +
      '<div class="ex-list is-hidden" data-exlist>' + D.exemptions.map(function (e, i) {
        return '<label class="toggle"><input type="checkbox" data-ex="' + i + '"><span>' + esc(e.label) + ' <b>−' + e.pts + "</b></span></label>";
      }).join("") + "</div></fieldset>" +
      '<fieldset class="calc-ex"><legend>Reality Test</legend><label class="toggle"><input type="checkbox" data-reality><span>The honest answer to “what could a resident actually do?” is essentially nothing. Cap the score at D (' + D.realityCapScore + ").</span></label>" +
      '<p class="hint">Used sparingly, and only when the arithmetic flatters a law that changes nothing.</p></fieldset>';

    host.innerHTML = '<div class="calc-inputs">' + inputsHtml + '</div>' +
      '<aside class="calc-result" aria-live="polite"><div class="cr-inner">' +
      '<span class="cr-label">Sovereignty Score</span>' +
      '<div class="cr-score"><span class="cr-num" data-r="score">0</span><span class="cr-of">/100</span><span data-r="chip"></span></div>' +
      '<p class="cr-meaning" data-r="meaning"></p>' +
      '<div class="cr-lines" data-r="lines"></div>' +
      '<p class="cr-cap is-hidden" data-r="cap"></p>' +
      "</div></aside>";

    function recalc() {
      D.pillars.forEach(function (p) {
        var el = $('[data-sub="' + p.key + '"]', host);
        if (el) el.textContent = pillarTotal(p);
      });
      var ps = {};
      D.pillars.forEach(function (p) { ps[p.key] = pillarTotal(p); });
      var pen = penaltyTotal();
      var r = D.score(ps, pen, state.reality);
      $('[data-r="score"]', host).textContent = r.score;
      $('[data-r="chip"]', host).innerHTML = chip(r.band.grade);
      $('[data-r="meaning"]', host).textContent = r.band.short;
      var lines = D.pillars.map(function (p) {
        return '<div class="cl"><span>' + esc(p.name) + '</span><div class="mini"><i class="g-' + D.gradeFor(ps[p.key]).grade + '" style="width:' + ps[p.key] + '%"></i></div><b>' + (ps[p.key] * p.weight / 100).toFixed(1) + "</b></div>";
      }).join("");
      lines += '<div class="cl tot"><span>Weighted total</span><div></div><b>' + r.weighted.toFixed(1) + "</b></div>";
      lines += '<div class="cl"><span>Exemption penalty</span><div></div><b>' + (state.comp ? "−" + r.penalty : "N/A") + "</b></div>";
      $('[data-r="lines"]', host).innerHTML = lines;
      var cap = $('[data-r="cap"]', host);
      cap.classList.toggle("is-hidden", !r.capped);
      cap.textContent = r.capped ? "Reality Test applied: the arithmetic gave " + Math.max(0, Math.min(100, Math.round(r.raw))) + ", capped at " + D.realityCapScore + "." : "";
      host.setAttribute("data-mode", state.mode);
    }

    function setMode(m) {
      state.mode = m;
      $$("[data-mode]", host).forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-mode") === m); });
      recalc();
    }
    function clamp(v, max) { v = parseInt(v, 10); if (isNaN(v)) v = 0; return Math.max(0, Math.min(max, v)); }

    host.addEventListener("input", function (e) {
      var t = e.target;
      if (t.matches("input[data-i]")) {
        var p = t.getAttribute("data-p"), i = +t.getAttribute("data-i");
        state.crit[p][i] = clamp(t.value, pillarByKey(p).criteria[i].pts);
      } else if (t.matches("input[data-pt]")) {
        state.pillar[t.getAttribute("data-pt")] = clamp(t.value, 100);
      }
      recalc();
    });
    host.addEventListener("change", function (e) {
      var t = e.target;
      if (t.matches("[data-comp]")) {
        state.comp = t.checked;
        $('[data-exlist]', host).classList.toggle("is-hidden", !state.comp);
      } else if (t.matches("input[data-ex]")) {
        state.ex[+t.getAttribute("data-ex")] = t.checked;
      } else if (t.matches("[data-reality]")) {
        state.reality = t.checked;
      } else if (t.matches("input[data-i]")) {
        t.value = state.crit[t.getAttribute("data-p")][+t.getAttribute("data-i")];
      } else if (t.matches("input[data-pt]")) {
        t.value = state.pillar[t.getAttribute("data-pt")];
      }
      recalc();
    });
    host.addEventListener("click", function (e) {
      var m = e.target.closest("button[data-mode]");
      if (m) { setMode(m.getAttribute("data-mode")); return; }
      if (e.target.closest("[data-reset]")) {
        $$("input[type=number]", host).forEach(function (i) { i.value = 0; });
        $$("input[type=checkbox]", host).forEach(function (i) { i.checked = false; });
        D.pillars.forEach(function (p) { state.crit[p.key] = p.criteria.map(function () { return 0; }); state.pillar[p.key] = 0; });
        state.ex = D.exemptions.map(function () { return false; });
        state.comp = false; state.reality = false;
        $('[data-exlist]', host).classList.add("is-hidden");
        recalc();
      }
    });

    /* "Load into calculator" from worked examples */
    document.addEventListener("click", function (e) {
      var b = e.target.closest("button.try");
      if (!b) return;
      var ex = D.examples[+b.getAttribute("data-ex")];
      if (!ex) return;
      D.pillars.forEach(function (p) {
        state.pillar[p.key] = ex.pillars[p.key];
        var inp = $('input[data-pt="' + p.key + '"]', host);
        if (inp) inp.value = ex.pillars[p.key];
      });
      state.comp = !!ex.comp; state.reality = false;
      $('[data-comp]', host).checked = state.comp;
      $('[data-exlist]', host).classList.toggle("is-hidden", !state.comp);
      setMode("pillars");
      host.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    setMode("criteria");
  }


  /* ---------- state audits: index grid ---------------------------- */
  function stateRows() {
    var byName = {};
    D.states.forEach(function (x) { byName[x.state] = x; });
    return D.roster.map(function (name) {
      var r = byName[name];
      var wk = D.weekOf(name);
      if (r && D.isLive(r)) return { name: name, slug: D.slug(name), week: wk, rec: r, status: r.status === "reaudit" ? "reaudit" : "audited" };
      return { name: name, slug: D.slug(name), week: wk, rec: null, status: "queued", isNext: D.next && D.next.state === name };
    });
  }
  function stateHref(slug) { return "state-" + slug + ".html"; }

  function renderStateGrid(host) {
    var rows = stateRows();
    var gated = !(D.revealed && D.revealed());
    if (gated) {
      /* embargo: no scores, no grades, no finding text, no links to audits */
      var cards = rows.map(function (r) {
        var w = r.week;
        var head = "Week " + w;
        var line = "Publishes " + D.fmtDate(D.weekDate(w)) + ".";
        return '<article class="state-card is-queued is-embargo' + (r.isNext ? " is-next" : "") + '" data-status="embargo" data-name="' + esc(r.name.toLowerCase()) + '">' +
          '<div class="sc-top"><h3>' + esc(r.name) + '</h3><span class="grade-chip g-queued" aria-hidden="true">&ndash;</span></div>' +
          '<span class="sc-score sc-note">' + head + "</span><p>" + esc(line) + "</p>" +
          '<span class="sc-foot">Score publishes with the audit</span></article>';
      }).join("");
      host.innerHTML = cards + '<p class="state-empty is-hidden" data-state-empty>No state matches that search.</p>';
      var fl = slot("state-filter"); if (fl) fl.style.display = "none";
      var inp0 = slot("state-search");
      function apply0() {
        var q = inp0 ? inp0.value.trim().toLowerCase() : "", shown = 0;
        $$(".state-card", host).forEach(function (c) { var ok = !q || c.getAttribute("data-name").indexOf(q) !== -1; c.classList.toggle("is-hidden", !ok); if (ok) shown++; });
        $("[data-state-empty]", host).classList.toggle("is-hidden", shown !== 0);
        var c2 = slot("state-count"); if (c2) c2.textContent = shown;
      }
      if (inp0) inp0.addEventListener("input", apply0);
      apply0();
      return;
    }
    var counts = { all: rows.length, audited: 0, reaudit: 0, queued: 0 };
    rows.forEach(function (r) { counts[r.status]++; });
    var html = rows.map(function (r) {
      var cls = "state-card is-" + r.status + (r.isNext ? " is-next" : "");
      var chipH, body, foot;
      if (r.status === "audited") {
        chipH = chip(r.rec.grade);
        body = '<span class="sc-score"><b>' + r.rec.score + '</b>/100</span><p>' + esc(r.rec.finding) + "</p>";
        foot = "Week " + r.rec.week + " · Read the audit &rarr;";
      } else if (r.status === "reaudit") {
        chipH = '<span class="grade-chip g-pending" aria-label="Under correction">?</span>';
        body = '<span class="sc-score sc-note">Score withdrawn</span><p>' + esc(r.rec.finding) + "</p>";
        foot = "Re-audit · Republished Week " + r.rec.week + " &rarr;";
      } else {
        chipH = '<span class="grade-chip g-queued" aria-label="Not yet audited">&ndash;</span>';
        body = '<span class="sc-score sc-note">Week ' + r.week + "</span><p>" +
          (r.isNext ? esc(D.next.note) + " " : "") + "Publishes " + D.fmtDate(D.weekDate(r.week)) + ".</p>";
        foot = "Not yet published";
      }
      var inner = '<div class="sc-top"><h3>' + esc(r.name) + "</h3>" + chipH + "</div>" + body + '<span class="sc-foot">' + foot + "</span>";
      var tag = r.status === "queued"
        ? '<article class="' + cls + '" data-status="' + r.status + '" data-name="' + esc(r.name.toLowerCase()) + '">' + inner + "</article>"
        : '<a class="' + cls + '" href="' + stateHref(r.slug) + '" data-status="' + r.status + '" data-name="' + esc(r.name.toLowerCase()) + '">' + inner + "</a>";
      return tag;
    }).join("");
    host.innerHTML = html + '<p class="state-empty is-hidden" data-state-empty>No state matches that search.</p>';

    var f = slot("state-filter");
    var q = "", status = "all";
    function apply() {
      var shown = 0;
      $$(".state-card", host).forEach(function (c) {
        var ok = (status === "all" || c.getAttribute("data-status") === status) && (!q || c.getAttribute("data-name").indexOf(q) !== -1);
        c.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      $("[data-state-empty]", host).classList.toggle("is-hidden", shown !== 0);
      var c2 = slot("state-count"); if (c2) c2.textContent = shown;
    }
    if (f) {
      var labels = [["all", "All"], ["audited", "Audited"], ["reaudit", "Under correction"], ["queued", "Queued"]];
      f.innerHTML = labels.filter(function (l) { return l[0] === "all" || counts[l[0]]; }).map(function (l, i) {
        return '<button type="button" class="chip' + (i === 0 ? " active" : "") + '" data-s="' + l[0] + '">' + l[1] + " (" + counts[l[0]] + ")</button>";
      }).join("");
      f.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-s]"); if (!b) return;
        $$("button", f).forEach(function (x) { x.classList.toggle("active", x === b); });
        status = b.getAttribute("data-s"); apply();
      });
    }
    var inp = slot("state-search");
    if (inp) inp.addEventListener("input", function () { q = inp.value.trim().toLowerCase(); apply(); });
    apply();
  }

  /* ---------- state audits: per-state page template ---------------
     The page mirrors the Declaration: one block per article (I-V), each scored
     criterion by criterion against the grading system. Optional per-state fields:
       scorecard: { ownership: [{ pts, note, src }, ...] }   aligned to D.pillars[].criteria
       exemptionsApplied: [index, ...]                      indexes into D.exemptions
       reality: { capped: bool, note }                      the Reality Test
       writeup: ["paragraph", ...]                          the published article
       forecast, infographic, sources: [{title,url}]                                   */
  var NUMERALS = ["I", "II", "III", "IV", "V"];

  function renderStateDetail(host) {
    var name = host.getAttribute("data-state");
    var r = D.states.filter(function (x) { return x.state === name; })[0];
    if (!r || !D.isLive(r)) {
      var wk = D.weekOf(name);
      host.innerHTML = '<section class="sd-locked"><span class="ek">Week ' + wk + " of " + D.totalStates + "</span><h2>The " + esc(name) + " audit publishes <em>" +
        D.weekdayName(D.weekDate(wk)) + ", " + D.fmtDate(D.weekDate(wk)) + ".</em></h2><p>States publish alphabetically, one a week, from Alabama on " + D.fmtDate(D.launch) +
        ' to Wyoming on ' + D.fmtDate(D.weekDate(D.totalStates)) + '.</p><a class="up-link" href="states.html#map-' + D.slug(name) + '">See it on the map</a></section>';
      return;
    }
    var pending = r.status === "reaudit";
    var band = pending ? null : D.gradeFor(r.score);
    var pubDate = D.fmtDate(D.weekDate(r.week));
    var sec = 0;
    function head(title, note) { sec++; return '<div class="sec-head"><span class="num">№ ' + String(sec).padStart(2, "0") + '</span><span class="title">' + title + "</span>" + (note ? '<span class="note">' + note + "</span>" : "") + "</div>"; }
    var h = "";

    /* verdict strip */
    h += '<section class="sd-verdict' + (pending ? " is-pending" : "") + '" aria-label="Verdict">';
    if (pending) {
      h += '<div class="sd-score"><span class="grade-chip g-pending sd-chip">?</span><div><span class="sd-num sd-num-w">Withdrawn</span><span class="sd-band">Score under correction</span></div></div>';
    } else {
      h += '<div class="sd-score">' + chip(r.grade).replace("grade-chip", "grade-chip sd-chip") +
        '<div><span class="sd-num">' + r.score + '<small>/100</small></span><span class="sd-band">Grade ' + r.grade + " &middot; " + esc(band.short) + "</span></div></div>";
    }
    h += '<dl class="sd-facts">' +
      "<div><dt>Comprehensive law</dt><dd>" + (r.comp ? "Yes" : "None") + "</dd></div>" +
      "<div><dt>Audit</dt><dd>Week " + r.week + " of " + D.totalStates + "</dd></div>" +
      "<div><dt>Last verified</dt><dd>" + D.fmtDate(r.verified) + "</dd></div>" +
      "<div><dt>Rubric</dt><dd>v1.1 &middot; <a href=\"grading.html\">how it scores</a></dd></div></dl></section>";
    if (!pending) h += '<div class="sd-track" role="img" aria-label="' + esc(name) + " scored " + r.score + ' out of 100"><i class="fill g-' + r.grade + '" style="width:' + r.score + '%"></i><b class="tick" style="left:70%"></b></div>';
    if (r.scoreWas != null && !pending) h += '<p class="rescored sd-rescored">Re-scored from ' + r.scoreWas + " to " + r.score + ". See the update log below.</p>";
    h += '<blockquote class="sd-finding">' + esc(r.finding) + "</blockquote>";

    /* the standard, in the Declaration's own order */
    h += '<section class="sd-block" id="scorecard">' + head("Scorecard, by article", '<a href="declaration.html">The Declaration →</a>');
    D.pillars.forEach(function (pl, pi) {
      var card = r.scorecard && r.scorecard[pl.key];
      var got = null;
      if (card) got = card.reduce(function (a, c) { return a + (Number(c.pts) || 0); }, 0);
      else if (r.pillars && r.pillars[pl.key] != null) got = r.pillars[pl.key];
      var rows = pl.criteria.map(function (c, ci) {
        var e = card && card[ci];
        return "<tr><td>" + esc(c.label) + '</td><td class="pts">' + c.pts + '</td><td class="pts aw">' + (e ? e.pts : "&ndash;") + "</td><td class=\"ev\">" +
          (e && e.note ? esc(e.note) + (e.src ? ' <a href="' + esc(e.src) + '" rel="noopener">source</a>' : "") : '<span class="ev-empty">Evidence and citation</span>') + "</td></tr>";
      }).join("");
      h += '<article class="sd-art' + (pl.heavy ? " heavy" : "") + '" id="art-' + pl.key + '">' +
        '<header><span class="no">' + NUMERALS[pi] + '</span><div><h3>' + esc(pl.name) + ' <em>' + pl.weight + '% of the score</em></h3><p class="dl">' + esc(pl.decl) + '</p><p class="q">' + esc(pl.question) + "</p></div>" +
        '<div class="ps"><b>' + (got == null ? "&ndash;" : got) + "</b><span>/100</span></div></header>" +
        '<table class="dsp-table sd-crit"><thead><tr><th>Criterion</th><th class="pts">Possible</th><th class="pts">Awarded</th><th>Evidence</th></tr></thead><tbody>' + rows + "</tbody></table></article>";
    });
    h += "</section>";

    /* exemption penalty + Reality Test */
    h += '<section class="sd-block" id="adjustments">' + head("Penalty and Reality Test", '<a href="methodology.html#exemptions">How they work →</a>');
    if (r.comp) {
      var applied = r.exemptionsApplied || [];
      h += '<table class="dsp-table sd-ex"><thead><tr><th>Exemption present</th><th class="pts">Deduction</th><th class="pts">Applied</th></tr></thead><tbody>' +
        D.exemptions.map(function (x, xi) { return "<tr><td>" + esc(x.label) + '</td><td class="pts">&minus;' + x.pts + '</td><td class="pts">' + (r.exemptionsApplied ? (applied.indexOf(xi) !== -1 ? "Yes" : "No") : "&ndash;") + "</td></tr>"; }).join("") +
        '<tr class="tot"><td>Total deduction (cap ' + D.exemptionCap + ')</td><td></td><td class="pts">' + (r.penalty != null ? "&minus;" + r.penalty : "&ndash;") + "</td></tr></tbody></table>";
    } else {
      h += '<div class="sd-hold">No comprehensive statute, so no exemption penalty applies. The absence is already priced into the pillars.</div>';
    }
    h += '<div class="sd-reality"><span class="k">Reality Test</span><p>' +
      (r.reality ? (r.reality.capped ? "<b>Cap applied.</b> " : "<b>No cap.</b> ") + esc(r.reality.note || "") : "Does the law, as it operates, deliver the rights it grants? A cap holds a score at " + D.realityCapScore + " or below. Result recorded with the full audit.") + "</p></div></section>";

    /* the write-up */
    h += '<section class="sd-block" id="writeup">' + head("The write-up", "Publishes " + pubDate);
    if (r.writeup && r.writeup.length) h += '<div class="sd-prose">' + r.writeup.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div>";
    else h += '<div class="sd-hold sd-hold-lg">The article for ' + esc(name) + " goes here: the finding in plain language, the number, and what it means for a resident.</div>";
    h += "</section>";

    if (r.forecast != null) {
      var err = r.score - r.forecast;
      h += '<section class="sd-block" id="forecast">' + head("Forecast vs. audit", "Rankings Hypothesis") +
        '<div class="sd-forecast"><div><span class="n">' + r.forecast + '</span><span class="l">Pre-registered forecast</span></div>' +
        '<div><span class="n">' + r.score + '</span><span class="l">Audited score</span></div>' +
        '<div><span class="n">' + (err > 0 ? "+" : "") + err + '</span><span class="l">Error (audited &minus; forecast)</span></div></div></section>';
    }

    h += '<section class="sd-block" id="infographic">' + head("The data, in pictures", "Drawn from the scores") +
      (r.infographic
        ? '<figure class="sd-info"><img src="' + esc(r.infographic) + '" alt="Data infographic for ' + esc(name) + '" loading="lazy"></figure>'
        : '<div class="viz-host" data-viz-state="' + esc(name) + '"></div>') + "</section>";

    h += '<section class="sd-block" id="updates">' + head("Updates since audit", "Last verified " + D.fmtDate(r.verified));
    if (r.updates && r.updates.length) {
      h += '<ol class="sd-log">' + r.updates.map(function (u) {
        return "<li><time>" + D.fmtDate(u.date) + "</time><p>" + esc(u.text) + "</p><em>" + esc(u.effect) + "</em></li>";
      }).join("") + "</ol>";
    } else {
      h += '<p class="upd-none">No changes since audit.</p>';
    }
    h += '<p class="dsp-footnote">A score changes only when an enacted, in-force change moves a rubric criterion. The ruler stays frozen; the world is allowed to move. <a href="methodology.html#verification">Change policy →</a></p></section>';

    if (r.sources && r.sources.length) {
      h += '<section class="sd-block" id="sources">' + head("Sources") + '<ul class="sd-sources">' +
        r.sources.map(function (x) { return '<li><a href="' + esc(x.url) + '" rel="noopener">' + esc(x.title) + "</a></li>"; }).join("") + "</ul></section>";
    }

    var ordered = D.roster, i = ordered.indexOf(name), prev = ordered[i - 1], next = ordered[i + 1];
    function nb(n, dir) {
      if (!n) return "<span></span>";
      var rec = D.liveStates().filter(function (x) { return x.state === n; })[0];
      var href = rec ? stateHref(D.slug(n)) : "states.html#map-" + D.slug(n);
      return '<a class="sd-' + dir + '" href="' + href + '"><span>' + (dir === "prev" ? "&larr; Previous" : "Next &rarr;") + "</span><b>" + esc(n) + "</b><i>" + (rec ? (rec.status === "reaudit" ? "Under correction" : rec.score + " · " + rec.grade) : "Queued") + "</i></a>";
    }
    h += '<nav class="sd-pager" aria-label="Other states">' + nb(prev, "prev") + nb(next, "next") + "</nav>";
    host.innerHTML = h;
    document.title = name + " — Digital Sovereignty Audit — Thinkers Dilemma";
  }

  /* keep the active sub-menu item in view on narrow screens */
  function revealActiveSubnav() {
    var a = $(".dsp-subnav a.active"), w = $(".dsp-subnav .wrap");
    if (a && w && w.scrollWidth > w.clientWidth) w.scrollLeft = Math.max(0, a.offsetLeft - 16);
  }

  /* ---------- boot ------------------------------------------------ */
  /* Findings that name specific states appear only once those audits are live. */
  function pruneFindings() {
    var sec = document.querySelector("[data-findings]"); if (!sec) return;
    var live = {}; D.liveStates().forEach(function (r) { live[r.state] = r.status !== "reaudit"; });
    var items = $$("[data-needs]", sec), kept = 0;
    items.forEach(function (el) {
      var need = el.getAttribute("data-needs"), ok = need === "*" ? Object.keys(live).some(function (k) { return live[k]; }) : need.split(",").every(function (n) { return live[n]; });
      if (!ok) { el.parentNode.removeChild(el); return; }
      kept++; var no = $(".no", el); if (no) no.textContent = String(kept).padStart(2, "0");
    });
    var t = $("[data-find-title]", sec), n = $("[data-find-note]", sec);
    if (!kept) { sec.parentNode.removeChild(sec); }
    else {
      var cnt = scored().length;
      if (t) t.textContent = D.states.length && cnt === D.totalStates ? "What the fifty show" : "What the first " + (cnt === 1 ? "audit shows" : cnt + " show");
      if (n) n.textContent = kept + (kept === 1 ? " finding" : " findings");
    }
    /* keep the section numbers consecutive */
    $$("main > .dsp-section > .sec-head > .num").forEach(function (el, i) { el.textContent = "\u2116 " + String(i + 1).padStart(2, "0"); });
  }

  function boot() {
    var h;
    if ((h = slot("countdown"))) renderCountdown(h);
    if ((h = slot("update-log"))) renderUpdateLog(h);
    if ((h = slot("watch"))) renderWatch(h);
    if ((h = slot("stats"))) renderStats(h);
    if ((h = slot("board"))) renderBoard(h);
    if ((h = slot("pillar-cards"))) renderPillarCards(h);
    if ((h = slot("bands"))) renderBands(h);
    if ((h = slot("criteria"))) renderCriteria(h);
    if ((h = slot("exemptions"))) renderExemptions(h);
    if ((h = slot("examples"))) renderExamples(h);
    if ((h = slot("calculator"))) renderCalc(h);
    if ((h = slot("state-grid"))) renderStateGrid(h);
    if ((h = slot("state-detail"))) renderStateDetail(h);
    revealActiveSubnav();
    pruneFindings();
    $$("[data-bind-stat]").forEach(function (el) {
      var st = stats(), k = el.getAttribute("data-bind-stat");
      var map = { n: st.n, top: st.top ? st.top.score : "–", topState: st.top ? st.top.state : "–", topGrade: st.top ? st.top.grade : "–", bottom: st.bottom ? st.bottom.score : "–", bottomState: st.bottom ? st.bottom.state : "–", spread: st.spread == null ? "–" : st.spread, left: D.totalStates - st.n, nextEntry: D.next.entry, nextState: D.next.state, launch: D.fmtDate(D.launch), verified: D.fmtDate(D.verifiedOn), lastWeek: D.fmtDate(D.weekDate(D.totalStates)), topClaim: st.top ? (st.aboveC ? st.aboveC + " published state" + (st.aboveC === 1 ? " has" : "s have") + " reached the 70 where a B begins." : "No published state has reached the 70 where a B begins. The hypothesis going in was that none would.") : "", tagline: D.tagline };
      if (k in map) el.textContent = map[k];
    });
  }
  /* a page left open re-ranks itself the moment the next audit goes live */
  (function () {
    if (D.preview()) return;
    var at = D.nextChangeAt();
    if (!at) return;
    var wait = at - Date.now();
    if (wait > 0 && wait < 2147483000) setTimeout(function () { location.reload(); }, wait + 500);
  })();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
