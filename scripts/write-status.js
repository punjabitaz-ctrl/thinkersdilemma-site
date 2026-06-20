#!/usr/bin/env node
/* =====================================================================
   THINKERS DILEMMA — Status Writer
   Reads .posted-cache.json (written by post-to-platforms.js) and
   produces dist/status.json — a public file the Distribution Hub
   reads to show per-platform sync status.
   ===================================================================== */
"use strict";

const fs   = require("fs");
const path = require("path");

const CACHE_FILE  = path.join(__dirname, "../.posted-cache.json");
const STATUS_FILE = path.join(__dirname, "../dist/status.json");

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); }
  catch(e) { return {}; }
}

const cache   = loadCache();
const entries = Object.entries(cache)
  .sort((a, b) => new Date(b[1].postedAt) - new Date(a[1].postedAt));

const latest  = entries[0] ? entries[0][1] : null;

// Build per-platform rollup from the most recent entry
const platforms = {};
["Reddit", "Facebook", "LinkedIn", "Medium"].forEach(p => {
  const r = latest && latest.results && latest.results[p];
  platforms[p] = r
    ? { lastPosted: latest.postedAt,
        lastUrl:    r.url    || null,
        lastStatus: r.skipped ? "skipped" : r.error ? "error" : "success",
        detail:     r.url || r.reason || r.error || "" }
    : { lastPosted: null, lastUrl: null, lastStatus: "never", detail: "Not yet posted" };
});

const status = {
  lastChecked:   new Date().toISOString(),
  lastPosted:    latest ? latest.postedAt    : null,
  lastEssayTitle: latest ? latest.title      : null,
  lastEssayUrl:  entries[0] ? entries[0][0] : null,
  totalPosted:   entries.length,
  platforms,
  history: entries.slice(0, 10).map(([url, d]) => ({
    url, title: d.title || "", postedAt: d.postedAt,
    results: Object.fromEntries(
      Object.entries(d.results || {}).map(([p, r]) => [p, {
        status: r.skipped ? "skipped" : r.error ? "error" : "success",
        url: r.url || null
      }])
    )
  }))
};

fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2), "utf8");
console.log(`Status written → dist/status.json  (${entries.length} posts in history)`);

// GitHub Actions step summary
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = Object.entries(platforms).map(([p, s]) =>
    `| ${p} | ${s.lastStatus==="success"?"✅":s.lastStatus==="skipped"?"⚠️":s.lastStatus==="error"?"❌":"—"} ${s.lastStatus} | ${s.lastPosted ? new Date(s.lastPosted).toUTCString() : "Never"} | ${s.lastUrl ? `[view](${s.lastUrl})` : s.detail} |`
  ).join("\n");
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `## 📊 Platform Status\n\n| Platform | Status | Last Posted | Link |\n|---|---|---|---|\n${rows}\n`);
}
