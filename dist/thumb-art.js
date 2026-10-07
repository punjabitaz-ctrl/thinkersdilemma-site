/* =====================================================================
   THUMB ART: animated line-art for every episode and field-note card.
   Replaces the empty black placeholder with a generative motif drawn in
   the site's own language (hairline rules, dashed rings, signal red).
   Motif follows the item's category; variation is seeded by its number,
   so the same card always looks the same. Pure SVG + CSS, no images.
   ===================================================================== */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rng(seed) { var s = (seed * 9301 + 49297) % 233280 || 1; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function f(n) { return Math.round(n * 10) / 10; }

  /* ---------- motifs ----------------------------------------------- */
  var M = {};

  /* technology: the observatory, as a small instrument */
  M.orbit = function (w, h, r) {
    var cx = w * 0.5, cy = h * 0.5, u = Math.min(w, h) / 2, o = "";
    o += '<g class="a-grid"><circle cx="' + cx + '" cy="' + cy + '" r="' + f(u * 0.92) + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + f(u * 0.66) + '"/>' +
      '<line x1="' + cx + '" y1="0" x2="' + cx + '" y2="' + h + '"/><line x1="0" y1="' + cy + '" x2="' + w + '" y2="' + cy + '"/></g>';
    o += '<g class="a-spin s1"><circle cx="' + cx + '" cy="' + cy + '" r="' + f(u * 0.48) + '" stroke-dasharray="3 11"/></g>';
    o += '<g class="a-spin s2 rev"><circle cx="' + cx + '" cy="' + cy + '" r="' + f(u * 0.33) + '" stroke-dasharray="2 14"/></g>';
    var rot = Math.floor(r() * 90);
    o += '<g class="a-spin s3" style="--a0:' + rot + 'deg"><circle cx="' + f(cx + u * 0.92) + '" cy="' + cy + '" r="4" class="dot sig"/></g>';
    o += '<g class="a-spin s4 rev" style="--a0:' + (rot + 140) + 'deg"><circle cx="' + f(cx + u * 0.66) + '" cy="' + cy + '" r="3" class="dot"/></g>';
    o += '<g class="a-spin s5" style="--a0:' + (rot + 250) + 'deg"><circle cx="' + f(cx + u * 0.48) + '" cy="' + cy + '" r="2.4" class="dot"/></g>';
    return o;
  };

  /* economy: a ledger. bars rise, a trend line draws itself */
  M.ledger = function (w, h, r) {
    var o = "", n = 9, pad = w * 0.08, bw = (w - pad * 2) / n, base = h * 0.86, i, pts = [];
    for (i = 0; i < 5; i++) { var y = f(base - i * (h * 0.15)); o += '<line class="a-grid" x1="' + pad + '" y1="' + y + '" x2="' + (w - pad) + '" y2="' + y + '"/>'; }
    for (i = 0; i < n; i++) {
      var bh = f(h * (0.12 + r() * 0.5)), x = f(pad + i * bw + bw * 0.22);
      o += '<rect class="a-bar" x="' + x + '" y="' + f(base - bh) + '" width="' + f(bw * 0.56) + '" height="' + bh + '" style="animation-delay:' + f(i * 0.18) + 's"/>';
      pts.push(f(pad + i * bw + bw * 0.5) + "," + f(base - bh - h * 0.06 - i * h * 0.012));
    }
    o += '<polyline class="a-draw" pathLength="1" points="' + pts.join(" ") + '"/>';
    var last = pts[pts.length - 1].split(",");
    o += '<circle class="dot sig a-blink" cx="' + last[0] + '" cy="' + last[1] + '" r="4.5"/>';
    return o;
  };

  /* power: columns of an institution; a scan line audits them */
  M.pillars = function (w, h, r) {
    var o = "", n = 7, pad = w * 0.1, gap = (w - pad * 2) / n, top = h * 0.3, base = h * 0.84, i;
    o += '<polygon class="a-grid" points="' + pad + "," + f(top - 6) + " " + f(w / 2) + "," + f(h * 0.1) + " " + (w - pad) + "," + f(top - 6) + '"/>';
    o += '<line class="a-grid" x1="' + f(pad - 8) + '" y1="' + base + '" x2="' + f(w - pad + 8) + '" y2="' + base + '"/>';
    var weak = 1 + Math.floor(r() * (n - 2));
    for (i = 0; i < n; i++) {
      var x = f(pad + i * gap + gap * 0.5), tp = f(top + (i === weak ? h * 0.1 : 0));
      o += '<line class="a-col' + (i === weak ? " weak" : "") + '" x1="' + x + '" y1="' + tp + '" x2="' + x + '" y2="' + base + '" style="animation-delay:' + f(i * 0.35) + 's"/>';
    }
    o += '<rect class="a-scan" x="' + f(pad - 8) + '" y="' + f(h * 0.1) + '" width="' + f(w - pad * 2 + 16) + '" height="2" style="--sweep:' + f(base - h * 0.1) + 'px"/>';
    return o;
  };

  /* diaspora: routes between places; something is always in transit */
  M.routes = function (w, h, r) {
    var o = "", k = 5, pts = [], i;
    for (i = 0; i < k; i++) pts.push([f(w * (0.12 + 0.76 * (i / (k - 1)))), f(h * (0.22 + 0.56 * r()))]);
    for (i = 0; i < k - 1; i++) {
      var a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - h * (0.14 + 0.12 * r());
      var d = "M" + a[0] + " " + a[1] + " Q" + f(mx) + " " + f(my) + " " + b[0] + " " + b[1];
      o += '<path class="a-route" d="' + d + '"/>';
      o += '<circle class="dot ' + (i === 1 ? "sig " : "") + 'a-travel" r="3" style="offset-path:path(\'' + d + '\');animation-delay:' + f(i * 0.9) + 's"/>';
    }
    for (i = 0; i < k; i++) o += '<circle class="a-node" cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="4"/><circle class="a-ping" cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="4" style="animation-delay:' + f(i * 0.6) + 's"/>';
    return o;
  };

  /* housing: a facade whose windows keep switching on and off */
  M.windows = function (w, h, r) {
    var o = "", cols = Math.max(6, Math.round(w / 26)), rows = Math.max(5, Math.round(h / 26)), cw = w / cols, ch = h * 0.78 / rows, c, i;
    o += '<line class="a-grid" x1="0" y1="' + f(h * 0.88) + '" x2="' + w + '" y2="' + f(h * 0.88) + '"/>';
    for (i = 0; i < rows; i++) for (c = 0; c < cols; c++) {
      var x = f(c * cw + cw * 0.2), y = f(h * 0.1 + i * ch + ch * 0.18), p = r();
      if (p < 0.12) continue;
      o += '<rect class="a-win' + (p > 0.93 ? " sig" : "") + '" x="' + x + '" y="' + y + '" width="' + f(cw * 0.6) + '" height="' + f(ch * 0.64) + '" style="animation-delay:' + f(r() * 6) + 's;animation-duration:' + f(3 + r() * 5) + 's"/>';
    }
    return o;
  };

  /* default: a signal scanning for something true */
  M.wave = function (w, h, r) {
    var o = "", L = 0, i, cy = h * 0.5;
    function path(amp, freq, ph) { var d = "M-" + w + " " + cy, x; for (x = -w; x <= w * 2; x += 6) d += " L" + x + " " + f(cy + Math.sin(x * freq + ph) * amp); return d; }
    var per = (2 * Math.PI) / 0.045;
    o += '<line class="a-grid" x1="0" y1="' + cy + '" x2="' + w + '" y2="' + cy + '"/>';
    o += '<g class="a-drift d1" style="--dx:' + f(per) + 'px"><path class="a-wave" d="' + path(h * 0.16, 0.045, r() * 6) + '"/></g>';
    o += '<g class="a-drift d2" style="--dx:' + f(per) + 'px"><path class="a-wave faint" d="' + path(h * 0.09, 0.045, r() * 6) + '"/></g>';
    o += '<circle class="dot sig a-blink" cx="' + f(w * 0.82) + '" cy="' + cy + '" r="4.5"/>';
    return o;
  };

  var KIND = { technology: "orbit", economy: "ledger", power: "pillars", diaspora: "routes", housing: "windows" };

  /* ---------- lookup: card → content item -------------------------- */
  function item(thumb) {
    var C = window.TD_CONTENT || window.TD || {};
    var corner = thumb.querySelector(".corner");
    var m = corner && /(\d{1,3})/.exec(corner.textContent);
    var no = m ? m[1] : "0";
    var isNote = /note/i.test(corner ? corner.textContent : "") || thumb.classList.contains("portrait");
    var list = (isNote ? C.notes : C.episodes) || [];
    var it = list.filter(function (x) { return parseInt(x.no, 10) === parseInt(no, 10); })[0] || {};
    return { no: parseInt(no, 10) || 1, note: isNote, it: it };
  }
  function kindFor(info) {
    var it = info.it, blob = JSON.stringify(it).toLowerCase();
    if (/housing|rent|mortgage/.test(blob)) return "windows";
    return KIND[it.cat] || "wave";
  }

  function build(thumb) {
    if (thumb.querySelector(":scope > .art")) return;
    var info = item(thumb), kind = kindFor(info);
    var portrait = thumb.classList.contains("portrait");
    var w = portrait ? 180 : 320, h = portrait ? 320 : 180;
    var r = rng(info.no * 7 + (info.note ? 3 : 0) + 1);
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "art k-" + kind);
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = M[kind](w, h, r);
    thumb.insertBefore(svg, thumb.firstChild);
    thumb.setAttribute("data-art", kind);
    if (io) io.observe(svg);
    else svg.classList.add("live");
  }

  /* run animations only while a card is on screen */
  var io = !REDUCED && "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle("live", e.isIntersecting); });
  }, { rootMargin: "80px" }) : null;

  function scan(root) { Array.prototype.forEach.call((root || document).querySelectorAll(".thumb"), build); }

  function boot() {
    scan();
    /* cards are rendered by render.js and can be re-rendered by filters/RSS */
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) if (muts[i].addedNodes.length) { scan(); break; }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
