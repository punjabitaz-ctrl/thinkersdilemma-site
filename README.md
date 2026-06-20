# Thinkers Dilemma — website

The public site for **Thinkers Dilemma**, live at **https://thinkersdilemma.com**.
A static site hosted on **GitHub Pages**, fed by the Substack feed.

## How it works

- **`dist/`** is the published site (GitHub Pages serves this folder only).
- **`.github/workflows/deploy-pages.yml`** deploys `dist/` to Pages on every push to `main`.
- Content lives in **`dist/content-substack.js`** (the baseline data) and the site
  **auto-updates from Substack in the browser** via **`dist/rss-sync.js`**
  (fetches the Substack RSS feed on page load, merges any new posts, caches 15 min).
  No server, no rebuild needed — publish on Substack and new posts appear.
- **`dist/render.js`** renders the data into each page's `[data-render]` slots;
  **`dist/site.js`** handles interaction (theme, filtering, forms).

## Pages (`dist/`)

| File | Purpose |
| --- | --- |
| `index.html` | Front page |
| `essays.html` / `episodes.html` / `notes.html` / `archive.html` / `about.html` | Sections |
| `article.html`, `essay-001…005.html` | On-site essay reading pages |
| `studio-substack.html` | Authoring studio (Google sign-in) — not indexed |
| `studio-distribute.html` | Distribution dashboard — not indexed |
| `content-substack.js` | Site content data (`window.TD_CONTENT`) |
| `render.js` · `site.js` · `rss-sync.js` | Render engine · interactions · live Substack sync |
| `colors_and_type.css` · `site.css` | Design tokens + styles |
| `CNAME` | Custom domain (`thinkersdilemma.com`) — keep this in `dist/` |
| `404.html`, `robots.txt`, `.nojekyll`, `favicon.svg` | Static support files |

## Editing content

- **Normal flow:** publish on Substack → the live site picks it up automatically.
- **Manual/structural edits:** edit `dist/content-substack.js` (or the relevant
  `dist/*.html`) and push to `main`; Pages redeploys in ~30s.

## DNS / domain

DNS is managed in **Cloudflare**. The apex `thinkersdilemma.com` and `www` point at
GitHub Pages (`185.199.108–111.153`), **DNS-only (grey cloud)**. The custom domain is
set in repo **Settings → Pages**; the `dist/CNAME` file keeps it pinned across deploys.
If you ever enable Cloudflare's proxy (orange cloud), set SSL/TLS mode to **Full** to
avoid redirect loops.
