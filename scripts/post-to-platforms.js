#!/usr/bin/env node
/* =====================================================================
   THINKERS DILEMMA — Cross-Platform Poster
   Posts the latest Substack essay to Reddit, Facebook, LinkedIn,
   and Medium. Skips any platform whose credentials are absent.
   Deduplicates via .posted-cache.json — safe to re-run on every sync.

   Required GitHub Secrets (add in repo Settings → Secrets):
   ─ REDDIT_CLIENT_ID    Reddit script-app client ID
   ─ REDDIT_SECRET       Reddit script-app secret
   ─ REDDIT_USERNAME     Reddit account username
   ─ REDDIT_PASSWORD     Reddit account password
   ─ REDDIT_SUBREDDIT    Target subreddit (no r/ prefix)
   ─ FACEBOOK_PAGE_TOKEN Long-lived Facebook Page access token
   ─ FACEBOOK_PAGE_ID    Facebook Page numeric ID
   ─ LINKEDIN_TOKEN      LinkedIn OAuth access token
   ─ LINKEDIN_AUTHOR_URN urn:li:person:XXXXX or urn:li:organization:XXXXX
   ─ MEDIUM_TOKEN        Medium integration token
   ─ MEDIUM_PUBLICATION_ID (optional) publish to a specific publication
   ===================================================================== */
"use strict";

const https  = require("https");
const http   = require("http");
const fs     = require("fs");
const path   = require("path");

const CACHE_FILE   = path.join(__dirname, "../.posted-cache.json");
const RSS_URL      = "https://thinkersdilemma.substack.com/feed";
const USER_AGENT   = "ThinkersDialemma/1.0 (by /u/ThinkersDialemma)";

/* ---- I/O helpers -------------------------------------------------- */
function loadCache()  { try { return JSON.parse(fs.readFileSync(CACHE_FILE,"utf8")); } catch(e) { return {}; } }
function saveCache(c) { fs.writeFileSync(CACHE_FILE, JSON.stringify(c,null,2), "utf8"); }
function strip(html)  { return String(html||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ").trim(); }
function trunc(s,n)   { if(s.length<=n)return s; const c=s.lastIndexOf(".",n); return s.slice(0,c>60?c+1:n)+(c<=60?"…":""); }
function gha(key,val) { if(process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,`${key}=${val}\n`); }
function summary(md)  { if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md+"\n"); }

/* ---- HTTP helpers ------------------------------------------------- */
function request(opts, body) {
  return new Promise((resolve, reject) => {
    const mod = opts.protocol === "http:" ? http : https;
    const req = mod.request(opts, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(d)); } catch(e) { resolve({ _raw: d, _status: res.statusCode }); }
        } else {
          reject(new Error(`HTTP ${res.statusCode} ${opts.hostname}${opts.path}: ${d.slice(0,200)}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}
function jsonPost(host, path, data, headers) {
  const body = JSON.stringify(data);
  return request({ hostname:host, path, method:"POST",
    headers:{ "Content-Type":"application/json", "Content-Length":Buffer.byteLength(body), ...headers }}, body);
}
function formPost(host, path, data, headers) {
  const body = new URLSearchParams(data).toString();
  return request({ hostname:host, path, method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded", "Content-Length":Buffer.byteLength(body), ...headers }}, body);
}
function get(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => resolve(d));
    }).on("error", reject);
  });
}

/* ---- RSS ---------------------------------------------------------- */
function parseLatest(xml) {
  const m = xml.match(/<item>([\s\S]*?)<\/item>/);
  if (!m) return null;
  const raw = m[1];
  const tag = t => { const r = raw.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return r ? r[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/,"$1").trim() : ""; };
  const ce  = raw.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
  return { title: strip(tag("title")), link: tag("link")||tag("guid"), pubDate: tag("pubDate"),
    description: strip(tag("description")), content: ce ? ce[1] : tag("description") };
}

/* ---- Reddit ------------------------------------------------------- */
async function postReddit(item) {
  const { REDDIT_CLIENT_ID:cid, REDDIT_SECRET:sec, REDDIT_USERNAME:user, REDDIT_PASSWORD:pass, REDDIT_SUBREDDIT:sub } = process.env;
  if (!cid||!sec||!user||!pass) return { skipped: true, reason: "Reddit credentials not set" };
  const subreddit = sub || "ThinkersDialemma";
  const auth = Buffer.from(`${cid}:${sec}`).toString("base64");
  const tok = await formPost("www.reddit.com", "/api/v1/access_token",
    { grant_type:"password", username:user, password:pass },
    { Authorization:`Basic ${auth}`, "User-Agent":USER_AGENT });
  if (!tok.access_token) throw new Error("Reddit token error: " + JSON.stringify(tok));
  const res = await formPost("oauth.reddit.com", "/api/submit",
    { sr:subreddit, kind:"link", title:item.title, url:item.link, resubmit:false, nsfw:false },
    { Authorization:`Bearer ${tok.access_token}`, "User-Agent":USER_AGENT });
  // Reddit wraps the response in jquery — find the URL
  const flat = JSON.stringify(res);
  const urlMatch = flat.match(/"url":\s*"(https:\/\/www\.reddit\.com\/r\/[^"]+)"/);
  return { success:true, url: urlMatch ? urlMatch[1] : `https://reddit.com/r/${subreddit}` };
}

/* ---- Facebook ----------------------------------------------------- */
async function postFacebook(item) {
  const { FACEBOOK_PAGE_TOKEN:tok, FACEBOOK_PAGE_ID:pid } = process.env;
  if (!tok||!pid) return { skipped:true, reason:"Facebook credentials not set" };
  const message = `${item.title}\n\n${trunc(item.description,220)}\n\nRead it free → ${item.link}`;
  const res = await jsonPost("graph.facebook.com", `/v19.0/${pid}/feed`,
    { message, link:item.link, access_token:tok }, {});
  return { success:true, postId:res.id, url:`https://facebook.com/${res.id}` };
}

/* ---- LinkedIn ----------------------------------------------------- */
async function postLinkedIn(item) {
  const { LINKEDIN_TOKEN:tok, LINKEDIN_AUTHOR_URN:author } = process.env;
  if (!tok||!author) return { skipped:true, reason:"LinkedIn credentials not set" };
  const text = `${item.title}\n\n${trunc(item.description,250)}\n\n→ ${item.link}\n\n#ThinkersDialemma #Diaspora #Technology #SystemsThinking`;
  const body = {
    author, lifecycleState:"PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "ARTICLE",
        media: [{ status:"READY", originalUrl:item.link,
          title:{ text:item.title }, description:{ text:trunc(item.description,200) } }]
      }
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility":"PUBLIC" }
  };
  const res = await jsonPost("api.linkedin.com", "/v2/ugcPosts", body,
    { Authorization:`Bearer ${tok}`, "X-Restli-Protocol-Version":"2.0.0" });
  return { success:true, postId:res.id||"", url:`https://www.linkedin.com/feed/update/${res.id||""}` };
}

/* ---- Medium ------------------------------------------------------- */
async function postMedium(item) {
  const { MEDIUM_TOKEN:tok, MEDIUM_PUBLICATION_ID:pubId } = process.env;
  if (!tok) return { skipped:true, reason:"Medium token not set" };
  // Resolve user ID
  const me = await request({ hostname:"api.medium.com", path:"/v1/me", method:"GET",
    headers:{ Authorization:`Bearer ${tok}`, Accept:"application/json" }});
  const userId = me.data && me.data.id;
  if (!userId) throw new Error("Could not resolve Medium user ID");
  const endpoint = pubId ? `/v1/publications/${pubId}/posts` : `/v1/users/${userId}/posts`;
  const bodyText = strip(item.content||item.description);
  const content = `# ${item.title}\n\n${bodyText}\n\n---\n*Originally published on [Thinkers Dilemma](${item.link})*`;
  const res = await jsonPost("api.medium.com", endpoint,
    { title:item.title, contentFormat:"markdown", content,
      canonicalUrl:item.link, publishStatus:"public",
      tags:["technology","culture","diaspora","systems-thinking","thinkers-dilemma"] },
    { Authorization:`Bearer ${tok}`, Accept:"application/json" });
  return { success:true, url: res.data && res.data.url };
}

/* ---- Main --------------------------------------------------------- */
async function main() {
  console.log("Fetching RSS feed…");
  const xml  = await get(RSS_URL);
  const item = parseLatest(xml);
  if (!item || !item.link) { console.log("No items in feed."); gha("posted","false"); return; }
  console.log("Latest:", item.title);

  const cache = loadCache();
  if (cache[item.link]) {
    console.log("Already posted — skipping.");
    gha("posted","false"); return;
  }

  const platforms = [
    ["Reddit",   () => postReddit(item)],
    ["Facebook", () => postFacebook(item)],
    ["LinkedIn", () => postLinkedIn(item)],
    ["Medium",   () => postMedium(item)],
  ];

  const results = {};
  let anySuccess = false, anyError = false;

  for (const [name, fn] of platforms) {
    process.stdout.write(`  → ${name}… `);
    try {
      results[name] = await fn();
      if (results[name].skipped) { console.log(`skipped (${results[name].reason})`); }
      else { console.log(`✓ ${results[name].url||"posted"}`); anySuccess = true; }
    } catch(e) {
      results[name] = { error: e.message };
      console.error(`✗ ${e.message}`); anyError = true;
    }
  }

  // Persist cache
  if (anySuccess || Object.values(results).some(r => r.skipped)) {
    cache[item.link] = { postedAt: new Date().toISOString(), title: item.title, results };
    saveCache(cache);
  }

  // GitHub Actions outputs
  gha("posted", anySuccess ? "true" : "false");
  gha("essay_title", item.title.replace(/\n/g," "));
  gha("essay_url", item.link);

  // Step summary table
  const rows = Object.entries(results).map(([p,r]) =>
    `| ${p} | ${r.skipped?"⚠ Skipped":r.error?"❌ Error":"✅ Posted"} | ${r.url||r.reason||r.error||""} |`
  ).join("\n");
  summary(`## 📡 Distribution — ${item.title}\n\n| Platform | Status | Detail |\n|---|---|---|\n${rows}`);

  if (anyError) { console.error("\nOne or more platforms failed."); process.exit(1); }
}

main().catch(e => { console.error(e.message); process.exit(1); });
