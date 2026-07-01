#!/usr/bin/env node
/* =====================================================================
   Generate dist/sitemap.xml for thinkersdilemma.com.

   Deterministic: <lastmod> values come from the essay dates in
   content-substack.js (not the build clock), so re-running with unchanged
   content produces byte-identical output — no spurious diffs. It only
   changes when the content/structure actually changes (e.g. a new essay),
   which is exactly when we want to re-publish it.

   Run after any content update (Substack sync) and on every deploy.
   ===================================================================== */
import { readFileSync, writeFileSync } from "node:fs";

const BASE = "https://thinkersdilemma.com";
const CONTENT = "dist/content-substack.js";
const OUT = "dist/sitemap.xml";

// Load window.TD_CONTENT without a browser.
function loadContent() {
  const src = readFileSync(CONTENT, "utf8");
  const win = {};
  new Function("window", src)(win);
  return win.TD_CONTENT || {};
}

const isoDate = (s) => {
  const d = new Date(s);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
};

function main() {
  const C = loadContent();
  const essays = (C.essays || []).filter((e) => e.localHref);

  // newest essay date drives the "listing" pages (they change when a post lands)
  const dates = essays.map((e) => isoDate(e.date)).filter(Boolean).sort();
  const newest = dates[dates.length - 1] || isoDate(new Date());

  // Fixed public pages. Excludes studio-*, 404, and article.html (demo template).
  const sections = [
    { loc: "/",             prio: "1.0", freq: "weekly",  mod: newest },
    { loc: "/essays.html",  prio: "0.9", freq: "weekly",  mod: newest },
    { loc: "/archive.html", prio: "0.7", freq: "weekly",  mod: newest },
    { loc: "/episodes.html",prio: "0.7", freq: "weekly",  mod: newest },
    { loc: "/notes.html",   prio: "0.6", freq: "weekly",  mod: newest },
    { loc: "/about.html",   prio: "0.5", freq: "monthly", mod: newest },
  ];

  const essayUrls = essays
    .slice()
    .sort((a, b) => (a.no > b.no ? 1 : -1))
    .map((e) => ({ loc: "/" + e.localHref, prio: "0.8", freq: "monthly", mod: isoDate(e.date) || newest }));

  const urls = [...sections, ...essayUrls];

  const body = urls
    .map(
      (u) =>
        "  <url>\n" +
        "    <loc>" + BASE + u.loc + "</loc>\n" +
        "    <lastmod>" + u.mod + "</lastmod>\n" +
        "    <changefreq>" + u.freq + "</changefreq>\n" +
        "    <priority>" + u.prio + "</priority>\n" +
        "  </url>"
    )
    .join("\n");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    "\n</urlset>\n";

  writeFileSync(OUT, xml);
  console.log("[sitemap] wrote " + OUT + " with " + urls.length + " urls (newest " + newest + ")");
}

main();
