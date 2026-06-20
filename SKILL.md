---
name: thinkers-dilemma-design
description: Use this skill to generate well-branded interfaces, content templates, and assets for Thinkers Dilemma — a work-of-inquiry content brand publishing on Substack, YouTube, and TikTok. Contains essential design guidelines, colors, type, fonts, brand assets, and ready-made content templates for posts, thumbnails, covers, and quote cards.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

The brand voice is **serious / academic + witty / playful** — sound like a curious editor, never a hot-take poster. Questions over claims. Numbers as artifacts. One accent color (vermilion) on warm cream + warm ink. Never dark-on-dark.

If creating visual artifacts (slides, mocks, throwaway prototypes, social-content templates), copy the relevant template out of `templates/` and rewrite the headline and metadata. Keep the chrome consistent. If working on production code, copy `colors_and_type.css` and the `assets/` logos and reference them.

If the user invokes this skill without any other guidance, ask:
1. Which platform/template they need (Substack, YouTube thumbnail, YouTube channel art, TikTok cover, episode cover, quote card).
2. The headline / hook (a question, ideally — "Who benefits?" "Who pays?" "Who watches the watchers?").
3. The issue number, category, and any metadata (date, runtime, word count).
Then act as an expert designer who outputs HTML artifacts using the existing tokens and templates.

**Do not invent new colors, fonts, or corner radii.** The system is the system.
