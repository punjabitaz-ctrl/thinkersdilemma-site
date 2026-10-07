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
  function scored() { return D.states.filter(function (x) { return x.status !== "reaudit"; }); }
  function pendingStates() { return D.states.filter(function (x) { return x.status === "reaudit"; }); }

  /* ---------- derived stats (never hard-coded) -------------------- */
  function stats() {
    var s = scored().sort(function (a, b) { return b.score - a.score; });
    var top = s[0], bottom = s[s.length - 1];
    var aboveC = s.filter(function (x) { return x.score >= 70; }).length;
    return { n: s.length, pending: D.states.length - s.length, top: top, bottom: bottom, spread: top.score - bottom.score, aboveC: aboveC };
  }

  function renderStats(host) {
    var st = stats();
    host.innerHTML =
      '<div class="dsp-stat"><span class="n">' + st.n + '<small>/' + D.totalStates + '</small></span><span class="l">States audited' + (st.pending ? '<br>+ ' + st.pending + ' under correction' : "") + '</span></div>' +
      '<div class="dsp-stat"><span class="n">' + st.top.score + '</span><span class="l">Highest score<br>' + esc(st.top.state) + " · " + st.top.grade + "</span></div>" +
      '<div class="dsp-stat"><span class="n">' + st.bottom.score + '</span><span class="l">Lowest score<br>' + esc(st.bottom.state) + " · " + st.bottom.grade + "</span></div>" +
      '<div class="dsp-stat"><span class="n">' + st.aboveC + '</span><span class="l">States above a C</span></div>';
  }

  /* ---------- leaderboard ----------------------------------------- */
  function renderBoard(host) {
    var rows = scored().sort(function (a, b) { return b.score - a.score || a.entry - b.entry; });
    var html = '<div class="board-head" aria-hidden="true"><span>#</span><span>State</span><span class="c-law">Comprehensive law</span><span class="c-bar">Sovereignty Score</span><span class="c-grade">Grade</span></div>';
    rows.forEach(function (r, i) {
      html +=
        '<article class="board-row" data-grade="' + r.grade + '">' +
        '<span class="c-rank">' + (i + 1) + "</span>" +
        '<div class="c-state"><h3>' + esc(r.state) + '</h3><p>' + esc(r.finding) + '</p><span class="entry">Week ' + r.week + " · Entry " + r.entry + " of " + D.totalStates + " · Verified " + D.fmtDate(r.verified) + "</span>" + rescored(r) + updatesHtml(r) + "</div>" +
        '<span class="c-law ' + (r.comp ? "yes" : "no") + '">' + (r.comp ? "Yes" : "None") + "</span>" +
        '<div class="c-bar"><div class="track" role="img" aria-label="' + esc(r.state) + " scored " + r.score + ' out of 100"><i class="fill g-' + r.grade + '" style="width:' + r.score + '%"></i><b class="tick" style="left:70%"></b></div><span class="num">' + r.score + "</span></div>" +
        '<span class="c-grade">' + chip(r.grade) + "</span></article>";
    });
    pendingStates().forEach(function (r) {
      html += '<article class="board-row pending" data-grade="pending">' +
        '<span class="c-rank">&ndash;</span>' +
        '<div class="c-state"><h3>' + esc(r.state) + '</h3><p>' + esc(r.finding) + '</p><span class="entry">Week ' + r.week + " · Entry " + r.entry + " of " + D.totalStates + " · Checked " + D.fmtDate(r.verified) + "</span>" + updatesHtml(r) + "</div>" +
        '<span class="c-law no">Re-audit</span>' +
        '<div class="c-bar"><span class="pend-note">Score withdrawn. Republished in Week ' + r.week + ".</span></div>" +
        '<span class="c-grade"><span class="grade-chip g-pending" aria-label="Under correction">?</span></span></article>';
    });
    html += '<p class="board-foot"><b class="tickkey"></b> The line at 70 is where a B begins. No audited state has crossed it.</p>';
    host.innerHTML = html;

    var chipsHost = slot("board-filter");
    if (chipsHost) {
      var grades = ["all"].concat(D.bands.map(function (b) { return b.grade; }).filter(function (g) {
        return D.states.some(function (s) { return s.grade === g; });
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
        var ms = Date.parse(D.launch + "T00:00:00") - Date.now();
        if (ms < 0) ms = 0;
        var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
        host.innerHTML = '<div class="cd-label">Week 1 publishes ' + launch + '</div>' +
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
    D.states.forEach(function (s) { (s.updates || []).forEach(function (u) { all.push({ s: s, u: u }); }); });
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

  /* ---------- boot ------------------------------------------------ */
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
    $$("[data-bind-stat]").forEach(function (el) {
      var st = stats(), k = el.getAttribute("data-bind-stat");
      var map = { n: st.n, top: st.top.score, topState: st.top.state, topGrade: st.top.grade, bottom: st.bottom.score, bottomState: st.bottom.state, spread: st.spread, left: D.totalStates - st.n, nextEntry: D.next.entry, nextState: D.next.state, launch: D.fmtDate(D.launch), verified: D.fmtDate(D.verifiedOn), lastWeek: D.fmtDate(D.weekDate(D.totalStates)), tagline: D.tagline };
      if (k in map) el.textContent = map[k];
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
