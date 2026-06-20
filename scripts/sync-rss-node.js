#!/usr/bin/env node
/* =====================================================================
   THINKERS DILEMMA — RSS → content-substack.js  (Node.js build script)
   Run by GitHub Actions on a schedule to keep the content file in sync
   with the live Substack feed.  New essays are prepended to the essays
   array; existing entries are never modified or removed.

   Usage:  node scripts/sync-rss-node.js
   ===================================================================== */
"use strict";

const https = require("https");
const fs    = require("fs");
const path  = require("path");

const RSS_URL      = "https://thinkersdilemma.substack.com/feed";
const CONTENT_FILE = path.join(__dirname, "../dist/content-substack.js");

/* ---- HTTP helper --------------------------------------------------- */
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
      let data = "";
      res.on("data", c => data += c);
      res.on("end",  () => resolve(data));
    }).on("error", reject);
  });
}

/* ---- RSS XML parser ------------------------------------------------ */
function parseRSS(xml) {
  const items = [];
  const itemRx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRx.exec(xml)) !== null) {
    const raw = m[1];
    const get = tag => {
      const r = raw.match(new RegExp("<" + tag + "(?:[^>]*)>([\\s\\S]*?)<\\/" + tag + ">"));
      return r ? r[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim() : "";
    };
    // content:encoded is namespaced — try a raw substring approach
    const ceMatch = raw.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
    const content = ceMatch ? ceMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim() : get("description");
    const cats = [...raw.matchAll(/<category[^>]*>([^<]+)<\/category>/g)].map(x => x[1]);
    items.push({ title: get("title"), link: get("link") || get("guid"), pubDate: get("pubDate"), description: get("description"), content, cats });
  }
  return items;
}

/* ---- Text helpers -------------------------------------------------- */
function strip(html) {
  return String(html || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "").trim();
}
function truncate(str, max) {
  if (str.length <= max) return str;
  const cut = str.lastIndexOf(".", max);
  return str.slice(0, cut > 60 ? cut + 1 : max) + (cut <= 60 ? "…" : "");
}
function formatDate(str) {
  const d = new Date(str);
  if (isNaN(d)) return { full: "", short: "", year: "" };
  const M = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const p = n => (n < 10 ? "0" : "") + n;
  return {
    full:  `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
    short: `${p(d.getMonth() + 1)} · ${p(d.getDate())} · ${String(d.getFullYear()).slice(2)}`,
    year:  String(d.getFullYear())
  };
}
function mapCat(cats, text) {
  const s = (cats.join(" ") + " " + text).toLowerCase();
  if (/diaspora|migration|immigr|identity/.test(s)) return "diaspora";
  if (/housing|economy|polic|financ|money/.test(s))  return "economy";
  if (/tech|ai\b|algorithm|data|digital/.test(s))     return "technology";
  return "power";
}
function pad(n) { return (n < 10 ? "00" : n < 100 ? "0" : "") + n; }
function jsStr(s) { return s.replace(/\\/g,"\\\\").replace(/"/g,'\\"'); }

/* ---- Build essay object literal ----------------------------------- */
function toEntry(item, no) {
  const dt  = formatDate(item.pubDate || "");
  const cat = mapCat(item.cats || [], item.title);
  const cap = cat.charAt(0).toUpperCase() + cat.slice(1);
  const body = item.content || item.description || "";
  const title = jsStr(strip(item.title));
  const dekStr = jsStr(truncate(strip(body), 240));
  const no3 = pad(no);

  return (
`
    { no: "${no3}", cat: "${cat}", catLabel: "${cap}",
      titleHtml: "${title}",
      dek: "${dekStr}",
      meta: "By Taz Punjabi · ${dt.full}",
      readMin: ${Math.max(3, Math.round(strip(body).split(/\s+/).length / 200))},
      date: "${dt.full}", dateShort: "${dt.short}", year: "${dt.year}", type: "Essay",
      href: "${jsStr(item.link || "")}" },`
  );
}

/* ---- Main ---------------------------------------------------------- */
async function main() {
  const src = fs.readFileSync(CONTENT_FILE, "utf8");

  // Extract existing Substack hrefs from the file
  const existingHrefs = new Set(
    [...src.matchAll(/href:\s*"(https:\/\/thinkersdilemma\.substack\.com[^"]+)"/g)]
      .map(m => m[1])
  );

  // Find highest issue number
  const maxNo = [...src.matchAll(/no:\s*"(\d+)"/g)]
    .reduce((m, x) => Math.max(m, parseInt(x[1], 10)), 0);

  // Fetch feed
  console.log("Fetching", RSS_URL);
  const xml   = await fetch(RSS_URL);
  const items = parseRSS(xml);
  console.log(`Feed has ${items.length} items`);

  const newItems = items.filter(it => it.link && !existingHrefs.has(it.link));
  if (!newItems.length) {
    console.log("No new essays — content-substack.js unchanged.");
    if (process.env.GITHUB_OUTPUT)
      require("fs").appendFileSync(process.env.GITHUB_OUTPUT, "new_content=false\n");
    return;
  }
  console.log(`${newItems.length} new essay(s) found`);

  // Build JS entries — RSS is newest-first; highest number = newest
  const entries = newItems
    .map((item, i) => toEntry(item, maxNo + newItems.length - i))
    .join("");

  // Insert just after `essays: [` marker
  const updated = src.replace(/(\/\* ---- ESSAYS[\s\S]*?\*\/\s*\n\s*essays:\s*\[)/, "$1" + entries);
  if (updated === src) {
    // Fallback: plain text replace
    const updated2 = src.replace("essays: [", "essays: [" + entries);
    fs.writeFileSync(CONTENT_FILE, updated2, "utf8");
  } else {
    fs.writeFileSync(CONTENT_FILE, updated, "utf8");
  }
  console.log(`Done. Added ${newItems.length} essay(s) to content-substack.js`);
  if (process.env.GITHUB_OUTPUT)
    require("fs").appendFileSync(process.env.GITHUB_OUTPUT, "new_content=true\n");
}

main().catch(err => { console.error(err.message); process.exit(1); });
