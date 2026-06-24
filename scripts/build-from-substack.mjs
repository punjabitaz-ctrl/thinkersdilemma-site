/* =====================================================================
   THINKERS DILEMMA — Substack → site generator  (GitHub Actions, Node 20+,
   global fetch, no deps). Runs on a schedule (8am ET Tue/Thu) + manual.

   PREPEND-ONLY: the 5 hand-curated essays + their pages are preserved. Only
   posts NOT already in essays[] are added:
     • generate an on-site reading page  dist/essay-<NNN>.html
     • prepend an essays[] entry (newest = the lead/featured)
     • set the homepage featured lead + running excerpt to the newest post
     • bump the essays count
   Idempotent: if the feed has no new posts, nothing changes.
   ===================================================================== */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FEED = "https://thinkersdilemma.substack.com/feed";
const DIST = "dist";
const CONTENT = join(DIST, "content-substack.js");

/* ---- text helpers (decode CDATA/entities BEFORE stripping tags) ---- */
const decode = (s) =>
  String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;|&#8217;|&rsquo;/g, "'")
    .replace(/&#160;|&nbsp;/g, " ").replace(/&#8230;|&hellip;/g, "…")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"').replace(/&#8212;|&mdash;/g, "—");
const strip = (h) => decode(h).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsstr = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const getTag = (block, name) => {
  const m = new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">", "i").exec(block);
  return m ? m[1] : "";
};
const pad3 = (n) => String(n).padStart(3, "0");
const slugOf = (url) => { const m = /\/p\/([a-z0-9-]+)/i.exec(url || ""); return m ? m[1].toLowerCase() : ""; };
const firstImg = (html) => { const m = /<img[^>]+src=["']([^"']+)["']/i.exec(String(html || "")); return m ? m[1] : ""; };

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function fmtDates(s) {
  const d = new Date(s);
  if (isNaN(d)) return { full: "", short: "", year: "" };
  const p = (n) => (n < 10 ? "0" : "") + n;
  return {
    full: MONTHS[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear(),
    short: p(d.getUTCMonth() + 1) + " · " + p(d.getUTCDate()) + " · " + String(d.getUTCFullYear()).slice(2),
    year: String(d.getUTCFullYear()),
  };
}
function mapCat(cats, title) {
  const t = ((cats || []).join(" ") + " " + (title || "")).toLowerCase();
  if (/diaspora|migration|immigr|identity|abroad/.test(t)) return "diaspora";
  if (/housing|econom|financ|money|market|rent|wage/.test(t)) return "economy";
  if (/\bai\b|algorithm|software|digital|\bdata\b|privacy|surveillance|tech/.test(t)) return "technology";
  return "power";
}
const CATLABEL = { power: "Power & systems", economy: "Economy & markets", technology: "Technology", diaspora: "Diaspora & identity" };
const readMin = (html) => Math.max(3, Math.round(strip(html).split(/\s+/).length / 200));

function makeDek(html) {
  const t = strip(html);
  if (t.length <= 230) return t;
  const cut = t.lastIndexOf(". ", 230);
  return cut > 80 ? t.slice(0, cut + 1) : t.slice(0, 227) + "…";
}
function leadParagraphs(html, n) {
  return [...String(html || "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => m[1].replace(/<\/?(?:a|span|div|figure|figcaption)[^>]*>/gi, "").trim())
    .filter((p) => strip(p).length > 40)
    .slice(0, n);
}
function cleanBody(html) {
  let h = String(html || "");
  h = h
    .replace(/<div class="subscription-widget[\s\S]*?<\/div>\s*<\/div>/gi, "")
    .replace(/<div class="subscription-widget[\s\S]*?<\/div>/gi, "")
    .replace(/<p class="button-wrapper[\s\S]*?<\/p>/gi, "")
    .replace(/<div[^>]*class="[^"]*(subscribe|share|footer|cta|paywall)[^"]*"[\s\S]*?<\/div>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/<div class="captioned-image-container">([\s\S]*?)<\/div>/gi, "$1")
    .replace(/<a class="image-link[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  return h.trim();
}

/* ---- on-site reading page template ------------------------------- */
function pageHtml(p) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.titlePlain)} — Thinkers Dilemma</title>
<meta name="description" content="${esc(p.dek)}">
<meta name="theme-color" content="#F2EBDD">
<meta property="og:title" content="${esc(p.titlePlain)}">
<meta property="og:description" content="${esc(p.dek)}">
<meta property="og:type" content="article">
${p.image ? `<meta property="og:image" content="${esc(p.image)}">` : ""}
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<script>(function(){try{var s=localStorage.getItem("td-theme");var n=s?s==="night":(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(n)document.documentElement.setAttribute("data-theme","night");}catch(e){}})();</script>
<link rel="stylesheet" href="colors_and_type.css">
<link rel="stylesheet" href="site.css">
<style>
  .progress{position:fixed;top:0;left:0;height:3px;background:var(--signal);width:0;z-index:100;transition:width 80ms linear;}
  .art-head{padding:56px 0 36px;border-bottom:2px solid var(--ink);text-align:center;max-width:860px;margin:0 auto;}
  .art-head .kicker-row{justify-content:center;}
  .art-head .hl{font:500 italic clamp(40px,5.5vw,76px)/0.98 var(--serif);letter-spacing:-0.025em;margin:6px 0 22px;}
  .art-head .hl em{color:var(--signal);font-style:italic;}
  .art-head .dek{font:400 22px/1.5 var(--serif);color:var(--ink-2);max-width:660px;margin:0 auto 28px;}
  .art-meta{display:flex;justify-content:center;gap:16px;align-items:center;flex-wrap:wrap;font:500 11px/1 var(--mono);letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-3);}
  .art-meta b{color:var(--signal);font-weight:500;}
  .prose{font:var(--body-lg);color:var(--ink);max-width:680px;margin:36px auto 0;}
  .prose>p{margin:0 0 22px;}
  .prose>p:first-of-type::first-letter{font:500 italic 96px/0.66 var(--serif);float:left;color:var(--signal);padding:10px 12px 0 0;margin-top:6px;}
  .prose h2,.prose h3,.prose h4{font:500 italic 30px/1.1 var(--serif);letter-spacing:-0.01em;margin:40px 0 16px;}
  .prose blockquote{margin:32px 0;padding:0 0 0 26px;border-left:3px solid var(--signal);font:400 italic 26px/1.3 var(--serif);}
  .prose a{color:var(--signal);text-decoration:underline;text-underline-offset:3px;}
  .prose img{max-width:100%;height:auto;display:block;margin:28px auto;border:1px solid var(--rule);}
  .prose ul,.prose ol{margin:0 0 22px;padding-left:1.3em;} .prose li{margin:0 0 8px;}
  .art-foot{max-width:680px;margin:56px auto 0;padding:28px 0;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink);display:flex;gap:18px;align-items:center;}
  .art-foot .av{width:56px;height:56px;border-radius:999px;background:var(--ink);color:var(--paper);display:grid;place-items:center;font:500 italic 24px/1 var(--serif);flex-shrink:0;}
  .art-foot .who .n{font:500 italic 22px/1 var(--serif);}
  .art-foot .who .d{font:400 14px/1.5 var(--sans);color:var(--ink-2);margin-top:4px;}
</style>
</head>
<body class="paper-grain" data-page="article">

<div class="progress" id="progress"></div>

<div class="utility">
  <div class="wrap">
    <div class="group">
      <a href="index.html">← Front Page</a>
      <span class="dot">·</span>
      <span>Issue № ${p.no} · ${esc(CATLABEL[p.cat] || "")}</span>
    </div>
    <div class="group">
      <a class="substack-cta" href="${esc(p.href)}" target="_blank" rel="noopener">Read on Substack ↗</a>
    </div>
  </div>
</div>

<nav class="mainnav">
  <div class="wrap">
    <a href="index.html" class="mini-mark" aria-label="Thinkers Dilemma">
      <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" stroke="currentColor" stroke-width="5"/><line x1="50" y1="4" x2="50" y2="96" stroke="currentColor" stroke-width="5"/><path d="M50 4 A46 46 0 0 0 50 96 Z" fill="currentColor"/><circle cx="68" cy="50" r="4" fill="currentColor"/></svg>
    </a>
    <a href="index.html">Front Page</a>
    <a href="essays.html" class="active">Essays</a>
    <a href="episodes.html">Episodes</a>
    <a href="notes.html">Field Notes</a>
    <a href="archive.html">Archive</a>
    <a href="about.html">About</a>
    <a href="index.html#subscribe">Subscribe</a>
  </div>
</nav>

<main class="wrap-wide">
  <header class="art-head">
    <div class="kicker-row">
      <span class="kicker-tag">Issue № ${p.no} · ${esc(CATLABEL[p.cat] || "")}</span>
    </div>
    <h1 class="hl">${esc(p.titlePlain)}</h1>
    <p class="dek">${esc(p.dek)}</p>
    <div class="art-meta">
      <span>By <b>Taz Punjabi</b></span><span>·</span>
      <span>${esc(p.date)}</span><span>·</span>
      <span>${p.readMin} min read</span>
    </div>
  </header>

  <article class="prose">
${p.body}
  </article>

  <div class="art-foot">
    <div class="av">TD</div>
    <div class="who">
      <div class="n">Taz Punjabi</div>
      <div class="d">Thinkers Dilemma — an introspective into the human existence. New essays publish on Substack and arrive here.</div>
    </div>
  </div>
</main>

<footer class="foot"><div class="wrap"><div class="bottom">
  <span>© MMXXVI Taz Punjabi · Thinkers Dilemma</span>
  <span><a href="essays.html">All essays →</a></span>
</div></div></footer>

<script src="site.js"></script>
<script>(function(){var b=document.getElementById("progress");if(!b)return;function o(){var h=document.documentElement;var m=h.scrollHeight-h.clientHeight;b.style.width=(m>0?(h.scrollTop||document.body.scrollTop)/m*100:0)+"%";}window.addEventListener("scroll",o,{passive:true});o();})();</script>
</body>
</html>
`;
}

function replaceRegion(src, key, replacement) {
  const re = new RegExp("/\\* @gen:" + key + " \\*/[\\s\\S]*?/\\* @end:" + key + " \\*/");
  if (!re.test(src)) throw new Error("marker @gen:" + key + " not found");
  return src.replace(re, "/* @gen:" + key + " */ " + replacement + " /* @end:" + key + " */");
}

async function main() {
  const res = await fetch(FEED, { headers: { "user-agent": "td-build" } });
  if (!res.ok) throw new Error("feed fetch failed: " + res.status);
  const xml = await res.text();
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  if (!blocks.length) throw new Error("no items in feed");

  const feed = blocks.map((b) => {
    const link = strip(getTag(b, "link")) || strip(getTag(b, "guid"));
    const titlePlain = strip(getTag(b, "title"));
    const content = decode(getTag(b, "content:encoded")) || decode(getTag(b, "description"));
    const cats = [...b.matchAll(/<category>([\s\S]*?)<\/category>/g)].map((c) => strip(c[1]));
    const d = fmtDates(strip(getTag(b, "pubDate")));
    const encM = /<enclosure[^>]+url="([^"]+)"/i.exec(b);
    const descDek = makeDek(getTag(b, "description"));
    return {
      slug: slugOf(link), link, titlePlain,
      cat: mapCat(cats, titlePlain),
      date: d.full, dateShort: d.short, year: d.year,
      dek: descDek || makeDek(content),
      readMin: readMin(content),
      image: (encM ? encM[1] : "") || firstImg(content),
      content,
    };
  });

  let src = readFileSync(CONTENT, "utf8");

  // slugs already present (in essays[] / data)
  const known = new Set([...src.matchAll(/\/p\/([a-z0-9-]+)/g)].map((m) => m[1].toLowerCase()));
  const newPosts = feed.filter((p) => p.slug && !known.has(p.slug)); // newest-first
  if (!newPosts.length) { console.log("[build] no new posts — nothing to do."); return; }

  const maxNo = Math.max(0, ...[...src.matchAll(/no: "(\d{1,3})"/g)].map((m) => parseInt(m[1], 10)));
  newPosts.forEach((p, idx) => { p.no = pad3(maxNo + newPosts.length - idx); p.localHref = "essay-" + p.no + ".html"; });

  // 1) generate on-site pages
  for (const p of newPosts) {
    writeFileSync(join(DIST, p.localHref), pageHtml({ ...p, body: cleanBody(p.content) }));
  }

  // 2) demote the current essays[] lead (only one entry may be lead)
  src = src.replace(/(\n\s*\{ no: "\d+", cat: "[^"]*",)\s*catLabel: "[^"]*", lead: true,/, "$1");

  // 3) prepend new entries (newest at top → gets lead:true)
  const entries = newPosts.map((p, idx) =>
    '    { no: "' + p.no + '", cat: "' + p.cat + '"' +
    (idx === 0 ? ', catLabel: "The lead · ' + CATLABEL[p.cat] + '", lead: true' : "") + ',\n' +
    '      titleHtml: "' + jsstr(esc(p.titlePlain)) + '",\n' +
    '      dek: "' + jsstr(p.dek) + '",\n' +
    '      readMin: ' + p.readMin + ', date: "' + p.date + '", dateShort: "' + p.dateShort + '", year: "' + p.year + '", type: "Essay",\n' +
    '      localHref: "' + p.localHref + '", href: "' + jsstr(p.link) + '" }'
  ).join(",\n\n");
  src = src.replace(/essays: \[\n/, "essays: [\n" + entries + ",\n\n");

  // 4) featured lead + excerpt = newest
  const top = newPosts[0];
  src = replaceRegion(src, "lead",
    "lead: {\n" +
    '      kickerTag: "The lead · ' + CATLABEL[top.cat] + '",\n' +
    '      kickerCat: "' + jsstr(CATLABEL[top.cat]) + '",\n' +
    '      titleHtml: "' + jsstr(esc(top.titlePlain)) + '",\n' +
    '      dek: "' + jsstr(top.dek) + '",\n' +
    '      byline: "By <b>Taz Punjabi</b> &nbsp;·&nbsp; ' + top.date + '",\n' +
    '      plateLabel: "Essay", plateNum: "' + top.no + '", plateName: "' + jsstr(top.titlePlain.slice(0, 26)) + '",\n' +
    '      plateSub: "Filed ' + top.dateShort + '",\n' +
    '      href: "' + top.localHref + '"\n    }');

  const paras = leadParagraphs(top.content, 3);
  const excerpt = paras.map((p, idx) =>
    '      "' + jsstr(idx === paras.length - 1
      ? p + ' <a class="jump" href="' + top.localHref + '">Read the full essay</a>'
      : p) + '"'
  ).join(",\n");
  src = replaceRegion(src, "excerpt", "excerpt: [\n" + excerpt + "\n    ]");

  // 5) essays count
  const total = known.size + newPosts.length;
  src = replaceRegion(src, "essays-count",
    'kicker: "Written inquiry", kickerMuted: "' + total + ' essays · 2026",\n' +
    '      titleHtml: "Essays",\n' +
    '      dek: "' + total + ' essays on technology, culture, diaspora experience, and systems thinking — asking the questions that follow us around.",\n' +
    '      sideBig: "' + total + '", sideLabelHtml: "Essays published<br>since May 2026"');

  writeFileSync(CONTENT, src);
  console.log("[build] new posts: " + newPosts.length + " → " + newPosts.map((p) => p.no + " " + p.slug).join(", ") +
    " | featured: " + top.titlePlain);
}

main().catch((e) => { console.error(e); process.exit(1); });
