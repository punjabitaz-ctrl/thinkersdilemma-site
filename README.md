# Thinkers Dilemma — Design System

> A work of inquiry. Society through a critical lens — asking the tough questions, in good faith and at unhurried length.

A unified visual identity for the Thinkers Dilemma content team across **Substack**, **YouTube**, and **TikTok**, with assets, type, color, and content templates anchored to one system.

---

## The brief

| | |
| --- | --- |
| **What it is** | A work of inquiry that looks at society through a critical lens. |
| **Audience** | Intellectual lurkers, rabbit-hole researchers, conspiracy-curious thinkers who want depth, not heat. |
| **Tone** | Serious / academic **+** witty / playful. Sound like a curious editor, never a hot-take poster. |
| **Aesthetic poles** | Warm analog (paper, hand-feel) **·** Minimal Swiss (grids, sans, whitespace) **·** Tech essay (Stratechery — clean, measured, blue-adjacent). We sit at the overlap. |
| **Color stance** | One bold accent (vermilion) on warm cream + warm ink. Never dark-on-dark. |
| **Name** | Thinkers Dilemma — no apostrophe. |

---

## Visual foundations

### Color

- **Signal — vermilion red `#D9351F`.** The only accent. Used for marks, emphasis, kickers, hits. Think investigative-magazine red ink. Sparingly. If everything is loud, nothing is.
- **Paper — warm cream `#F2EBDD`.** Default surface, always. We do not use bright white.
- **Ink — warm near-black `#14110E`.** Default type color. Never pure black — keeps the paper feel.
- **Blue-ink `#1B3A6B`** is reserved for **data viz only** (charts, tables, footnotes-with-numbers). Not a brand color.

### Type

- **Display: Newsreader (italic).** The voice of the brand — editorial, sloped, optical-sized. All headlines, hooks, pull-quotes set in *Newsreader italic*.
- **Body: IBM Plex Sans.** Reading text, UI, captions, descriptions. Tech-essay-adjacent, sober.
- **Mono: IBM Plex Mono.** Tracked, all-caps for kickers, labels, issue numbers, dates, metadata.

> The "Thinkers Dilemma" wordmark is **always** set in Newsreader italic. No exceptions.

### Backgrounds & texture

- **Paper grain** (`.paper-grain`) — a low-opacity multiply-blended dot pattern. On every primary surface; never decorative, never visible enough to call attention to itself.
- **No gradients.** No blurs. No glassmorphism.
- **No imagery placeholders by default** — the system is text-first. When we use imagery, it is high-contrast, B&W, slightly grainy, archival.

### Layout

- Grid-first. Hairline rules and heavy ink rules do the structural work — no boxes, no shadows pretending to be cards.
- Two repeating moves: the **double-rule masthead** (heavy ink top, hair line bottom) and the **issue plate** (an ink slab carrying a giant tabular number).
- Generous whitespace. The page should read like a magazine spread, not a feed.

### Motion

- Analog, not bouncy. `--ease cubic-bezier(.2,.6,.2,1)` at 120–320ms. Fades and 1px translations. Never bounce, never spring.
- Hover = -1px translate + cursor change. Press = no-op or 1px down.

### Radii, borders, shadows

- Corners are **square**, or at most `2px`. Pills are full radius. Nothing in between.
- Borders are 1px ink or hairline (`#C9BD9F`). Use ink borders sparingly — they're loud.
- Shadows are subtle and ink-tinted (not gray-tinted). Used for paper lift, not glow.

---

## Content fundamentals — voice & copy

- **First person we, never I.** "We asked." "We sat with this."
- **Sentence case** for headlines, except for **TRACKED ALL-CAPS in monospace** for labels/kickers (e.g. `ISSUE № 014`, `SURVEILLANCE · ESSAY`).
- **Em dashes and ampersands** are part of the texture. Lowercase **&** is welcome inside short marks.
- **Numbers as artifacts.** Issue numbers, runtimes, word counts are set tabular and given pride of place — they're evidence.
- **Questions over claims.** Headlines lean interrogative. "Who benefits?" "Who pays?" "Who watches the watchers?"
- **No emoji.** No exclamation marks in headlines. No "DON'T MISS THIS." Curiosity, not adrenaline.
- **Sign-offs are dry.** "Read it. Sit with it. Disagree, openly." Not "smash subscribe."

See `preview/17-voice.html` for a yes/no comparison.

---

## Iconography

- Icons are **rare**. When used, they're hairline + ink, 1.5–2px stroke, geometric. Not filled, not stylized.
- The brand mark itself is the central icon — a **bisected circle** (the dilemma) with a small offset dot (the unresolved question). See `assets/logo-mark.svg`.
- For UI icons that aren't authored in-house, use **Lucide** (`https://unpkg.com/lucide-static`) at 1.5px stroke, ink color.
- **No emoji.** No stock illustration. If an icon doesn't earn its place, leave it out.

### Substitutions flagged

- **Newsreader** and **IBM Plex Sans / Mono** are loaded from Google Fonts. They are the chosen brand faces — not stand-ins. If you want a paid display face later (GT Sectra, Söhne), tell me and I'll swap the tokens.

---

## File index

| Path | Purpose |
| --- | --- |
| `colors_and_type.css` | All design tokens — CSS vars for color, type, scale, motion. Import once at root. |
| `assets/logo-mark.svg` | Monogram-only mark (bisected circle + dot). |
| `assets/logo-wordmark.svg` | Mark + "Thinkers Dilemma" wordmark, horizontal. |
| `assets/logo-stacked.svg` | Stacked mark + wordmark + "A work of inquiry" rule. |
| `assets/logo-stamp.svg` | TD monogram inside a double-ring stamp. |
| `preview/*.html` | Design-system specimen cards (see Design System tab). |
| `templates/substack-header.html` | Post header / cover for Substack — 1456×816. |
| `templates/youtube-thumbnail.html` | Thumbnail — 1280×720. |
| `templates/youtube-channel-art.html` | Channel banner — 2560×1440 with safe area. |
| `templates/tiktok-cover.html` | Vertical cover / title card — 1080×1920. |
| `templates/episode-cover.html` | Series/episode cover — 1400×1400, magazine layout. |
| `templates/quote-card.html` | Cross-platform quote card — 1080×1080 square. |
| `SKILL.md` | Skill manifest for downloading into Claude Code. |

---

## How to use

1. Reference `colors_and_type.css` once at the root.
2. Set everything else with the tokens: `var(--ink)`, `var(--paper)`, `var(--signal)`, `var(--serif)`, etc.
3. For new content templates, copy the closest existing template in `templates/` and rewrite the headline. The chrome should stay consistent — the **content changes, the system doesn't**.
4. Never invent a new color, new font, or new corner radius without amending this file.

---

## Caveats

- **Fonts** are Google-Fonts substitutes for what would ideally be paid faces (Söhne, GT Sectra). They're very close — if you upgrade, the swap is two lines in `colors_and_type.css`.
- **Imagery** has not been styled — we're text-first by default. If you want to add a photo treatment (B&W, grain, halftone, etc.) tell me and I'll add it.
- **Color reference** "knoxlabs" / Sugar Sammy → I committed to a warm-cream + vermilion-red read of those cues; the URL wasn't reachable to verify. **Please review the color cards and tell me if the red should shift** (more orange? more brick? more crimson?).
