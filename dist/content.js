/* =====================================================================
   THINKERS DILEMMA — CONTENT
   ---------------------------------------------------------------------
   This file is the SINGLE SOURCE OF TRUTH for everything on the website.
   Every page reads from it. Edit it here (by hand, or with Studio at
   studio.html) and re-upload this one file to publish across the site.

   • Fields ending in "Html" accept simple HTML — use <em>…</em> to set a
     word in italic vermilion (the house accent).
   • Categories are one of: surveillance · economy · media · power · method
   ===================================================================== */

window.TD_CONTENT = {

  /* ---- SITE & ISSUE (appears on every page) ----------------------- */
  site: {
    brand: "Thinkers Dilemma",
    tagline: "A work of inquiry",
    established: "MMXXVI",
    questions: "Who benefits? · Who pays? · Who decides?",

    issueNo: "014",
    issueLabel: "The Watchers",
    dateLine: "Friday · May 30 · 2026",          // utility-bar date
    volume: "Vol. I · No. 014",                   // masthead dateline left
    datelineCenter: "Society, through a critical lens — <b>in good faith</b>",
    readers: 21402,                               // count-up figure
    liveLabel: "New episode Friday",

    social: [
      { label: "Substack", href: "#" },
      { label: "YouTube",  href: "#" },
      { label: "TikTok",   href: "#" }
    ],

    // Transmission ticker (the scrolling strip under the utility bar)
    ticker: [
      { text: "Issue № 014 — The Watchers", star: true },
      { text: "Now broadcasting · Part i of vi", hot: true },
      { text: "Who benefits?" },
      { text: "Who pays?", star: true },
      { text: "Who decides?" },
      { text: "New episode lands Friday", hot: true },
      { text: "Established MMXXVI", star: true },
      { text: "A work of inquiry — in good faith" }
    ],

    footer: {
      blurb: "Society through a critical lens — asking the tough questions, in good faith and at unhurried length. Published on Substack, YouTube, and TikTok.",
      columns: [
        { title: "Read", links: [
          { label: "Latest essay", href: "essays.html" },
          { label: "Archive", href: "archive.html" },
          { label: "Series", href: "essays.html" },
          { label: "Method", href: "about.html" }
        ]},
        { title: "Watch & listen", links: [
          { label: "YouTube", href: "episodes.html" },
          { label: "TikTok", href: "notes.html" },
          { label: "Podcast", href: "#" },
          { label: "Field notes", href: "notes.html" }
        ]},
        { title: "The desk", links: [
          { label: "About", href: "about.html" },
          { label: "Contact", href: "about.html#contact" },
          { label: "Corrections", href: "#" },
          { label: "Ethics", href: "#" }
        ]}
      ],
      copyright: "© MMXXVI Thinkers Dilemma"
    }
  },

  /* ---- HOMEPAGE ---------------------------------------------------- */
  home: {
    lead: {
      kickerTag: "The lead · Surveillance",
      kickerCat: "Six-part inquiry",
      titleHtml: "Who watches<br>the <em>watchers?</em>",
      dek: "Ambient surveillance was sold to us as convenience. We followed the money, the metadata, and the quiet hands that shaped consent into compliance — and found the bill comes due later than you think.",
      byline: "By <b>The Editor</b> &nbsp;·&nbsp; 9 min read &nbsp;·&nbsp; 3,412 words",
      plateLabel: "Issue",
      plateNum: "014",
      plateName: "The Watchers",
      plateSub: "Part i of vi<br>Filed 05 · 30 · 2026",
      href: "article.html"
    },

    // The three-column running excerpt under the lead
    excerpt: [
      "There is an old question in moral philosophy — <em>cui bono?</em> — who benefits? It is the first question an investigator asks and the last one a marketing department wants answered. We have spent six weeks asking it of the devices in our pockets, the cameras on our doorbells, and the dashboards that quietly score our reliability.",
      "The answer is rarely the person being asked. Convenience, it turns out, is a transfer of power dressed in the language of a favor. Every frictionless checkout, every helpful suggestion, every \"we noticed you were nearby\" is a small ledger entry in a book we are not permitted to read.",
      "What follows is not a manifesto. It is an inquiry — six episodes, three essays, and a standing invitation to disagree. We are less interested in alarm than in attention. The watchers are not hiding. They are, if anything, remarkably forthcoming. The trouble is that we stopped reading. <span class=\"jump\">Continued in the full essay</span>"
    ],

    quote: {
      textHtml: "If the question is <span class=\"hi\">who benefits</span>, the answer is almost never the one being asked.",
      src: "The Watchers,",
      meta: "Issue № 014"
    },

    subscribe: {
      headingHtml: "Read it. Sit with it.<br><em>Disagree, openly.</em>",
      body: "One essay on Tuesday, one episode on Friday, field notes in between. No hot takes, no outrage cycle — just the standing questions, asked again in good faith."
    }
  },

  /* ---- ESSAYS (master editorial record) ---------------------------
     Drives: essays.html · the homepage "Also in this issue" + archive
     preview · the full archive.html · article "keep reading".
     The FIRST item is the lead. Newest first.
     type / year feed the Archive page grouping.
  ------------------------------------------------------------------ */
  essays: [
    { no: "014", cat: "surveillance", catLabel: "The lead · Surveillance", lead: true,
      titleHtml: "Who watches the <em>watchers?</em>",
      dek: "Ambient surveillance was sold to us as convenience. We followed the money, the metadata, and the quiet hands that shaped consent into compliance — and found the bill comes due later than you think. Part i of a six-part inquiry.",
      meta: "By The Editor · May 30, 2026 · 9 min read · 3,412 words",
      readMin: 9, date: "May 30, 2026", dateShort: "05 · 30 · 26", year: "2026", type: "Episode" },

    { no: "013", cat: "economy",
      titleHtml: "The productivity that never arrived.",
      dek: "We were promised four-hour weeks. We got always-on. A short history of a long broken promise, and the arithmetic nobody wanted to show their work on.",
      tags: ["Labor", "Automation"], readMin: 6, date: "May 23, 2026", dateShort: "05 · 23 · 26", year: "2026", type: "Essay" },

    { no: "012", cat: "media",
      titleHtml: "Who owns the feed owns the mood.",
      dek: "Algorithmic curation is editorial judgment with the byline removed. On the quiet politics of the scroll, and who gets to decide what counts as the day's news.",
      tags: ["Platforms", "Attention"], readMin: 8, date: "May 16, 2026", dateShort: "05 · 16 · 26", year: "2026", type: "Essay" },

    { no: "011", cat: "power",
      titleHtml: "The committee that meets in your phone.",
      dek: "Default settings are policy. Nobody voted for them, and everybody lives under them. A field guide to the governance that happens in the settings menu.",
      tags: ["Defaults", "Consent"], readMin: 5, date: "May 09, 2026", dateShort: "05 · 09 · 26", year: "2026", type: "Essay" },

    { no: "010", cat: "method",
      titleHtml: "On the manufacture of urgency.",
      dek: "Why everything feels like an emergency, and who profits from the adrenaline. A note on our own method: slow reading, and a refusal to mistake heat for light.",
      tags: ["Outrage", "Tempo"], readMin: 7, date: "May 02, 2026", dateShort: "05 · 02 · 26", year: "2026", type: "Episode" },

    { no: "009", cat: "economy",
      titleHtml: "The price of a frictionless life.",
      dek: "Convenience, it turns out, is a transfer of power dressed in the language of a favor. We trace one frictionless checkout through four companies and two jurisdictions.",
      tags: ["Data", "Markets"], readMin: 10, date: "Apr 25, 2026", dateShort: "04 · 25 · 26", year: "2026", type: "Essay" },

    { no: "008", cat: "surveillance",
      titleHtml: "The doorbell that remembers.",
      dek: "Your neighbor's camera is also a municipal asset, a marketing dataset, and a witness that never sleeps. On the slow deputization of the front porch.",
      tags: ["Cameras", "Policing"], readMin: 6, date: "Apr 18, 2026", dateShort: "04 · 18 · 26", year: "2026", type: "Essay" },

    { no: "007", cat: "power",
      titleHtml: "Who decides what counts as a glitch?",
      dek: "When an automated system makes a costly mistake, \"glitch\" is the word that absorbs the blame so that no one has to. On error as a governance strategy.",
      tags: ["Accountability", "Systems"], readMin: 7, date: "Apr 11, 2026", dateShort: "12 · 13 · 25", year: "2025", type: "Essay" },

    { no: "006", cat: "media",
      titleHtml: "The recommendation is the message.",
      dek: "We used to choose what to read; now something chooses for us and calls it discovery. What happens to culture when taste is delegated to a model.",
      tags: ["Culture", "Taste"], readMin: 9, date: "Apr 04, 2026", dateShort: "11 · 22 · 25", year: "2025", type: "Essay" },

    { no: "005", cat: "economy",
      titleHtml: "Renting the things we used to own.",
      dek: "Software ate the product, and then the product ate ownership. A reckoning with the subscription as the dominant grammar of modern commerce.",
      tags: ["Subscriptions", "Property"], readMin: 6, date: "Mar 28, 2026", dateShort: "11 · 01 · 25", year: "2025", type: "Essay" },

    { no: "004", cat: "method",
      titleHtml: "We read the terms. All of them.",
      dek: "Forty-one terms-of-service documents, one very long month. What we found was not a conspiracy, but something more durable: consent manufactured through exhaustion.",
      tags: ["Fine print", "Consent"], readMin: 11, date: "Mar 21, 2026", dateShort: "10 · 18 · 25", year: "2025", type: "Episode" },

    { no: "003", cat: "surveillance",
      titleHtml: "The score you cannot see.",
      dek: "Somewhere, a number stands in for your reliability — assembled from signals you never consented to and cannot inspect. On the dashboards that quietly grade us.",
      tags: ["Scoring", "Opacity"], readMin: 8, date: "Mar 14, 2026", dateShort: "10 · 04 · 25", year: "2025", type: "Essay" },

    { no: "002", cat: "power",
      titleHtml: "Cui bono — a working definition.",
      dek: "The first essay of the project, in which we set out our one durable question and promise to keep asking it. Who benefits? It is rarely the one being asked.",
      tags: ["First principles", "Manifesto"], readMin: 5, date: "Mar 07, 2026", dateShort: "09 · 20 · 25", year: "2025", type: "Essay" },

    { no: "001", cat: "method",
      titleHtml: "Why we started, and in what faith.",
      dek: "A founding note on good faith, slow reading, and the refusal to mistake heat for light. Where the inquiry begins.",
      tags: ["Founding", "Method"], readMin: 4, date: "Feb 28, 2026", dateShort: "09 · 06 · 25", year: "2025", type: "Note" }
  ],

  /* ---- EPISODES (YouTube) ----------------------------------------- */
  episodes: [
    { no: "014", title: "The Watchers", questionHtml: "Who watches the <em>watchers?</em>", runtime: "09:42", cat: "surveillance", submeta: "Surveillance · Part i of vi · 84k views", featured: true },
    { no: "013", title: "Promised Time", questionHtml: "The <em>four-hour</em> week that wasn't.", runtime: "12:18", cat: "economy", submeta: "Economy · 112k views · Last week" },
    { no: "012", title: "The Mood Machine", questionHtml: "Who owns <em>the feed?</em>", runtime: "10:51", cat: "media", submeta: "Media · 156k views · Two weeks ago" },
    { no: "011", title: "The Committee", questionHtml: "A default is a <em>decision.</em>", runtime: "08:30", cat: "power", submeta: "Power · 98k views · Three weeks ago" },
    { no: "010", title: "Manufactured Urgency", questionHtml: "Why is everything an <em>emergency?</em>", runtime: "11:04", cat: "method", submeta: "Method · 134k views · Last month" },
    { no: "009", title: "The Frictionless Life", questionHtml: "What does <em>frictionless</em> cost?", runtime: "13:47", cat: "economy", submeta: "Economy · 201k views · Apr 25" },
    { no: "008", title: "The Porch Witness", questionHtml: "The doorbell that <em>remembers.</em>", runtime: "07:55", cat: "surveillance", submeta: "Surveillance · 88k views · Apr 18" },
    { no: "007", title: "Just a Glitch", questionHtml: "Who decides what's a <em>glitch?</em>", runtime: "09:12", cat: "power", submeta: "Power · 76k views · Apr 11" },
    { no: "006", title: "The Recommendation", questionHtml: "Who chose <em>this</em> for you?", runtime: "12:33", cat: "media", submeta: "Media · 142k views · Apr 04" },
    { no: "005", title: "Renting Everything", questionHtml: "Do you <em>own</em> anything?", runtime: "10:08", cat: "economy", submeta: "Economy · 119k views · Mar 28" },
    { no: "004", title: "The Fine Print", questionHtml: "We read <em>every</em> term.", runtime: "14:21", cat: "method", submeta: "Method · 167k views · Mar 21" },
    { no: "003", title: "The Hidden Score", questionHtml: "The score you <em>cannot</em> see.", runtime: "08:47", cat: "surveillance", submeta: "Surveillance · 93k views · Mar 14" },
    { no: "002", title: "Cui Bono", questionHtml: "Who <em>benefits?</em>", runtime: "06:39", cat: "power", submeta: "Power · 71k views · Mar 07" }
  ],

  /* ---- FIELD NOTES (TikTok) --------------------------------------- */
  notes: [
    { no: "31", questionHtml: "A default is a <em>decision.</em>", cat: "power", meta: "0:38 · 84k views" },
    { no: "30", questionHtml: "Convenience is a <em>transfer.</em>", cat: "economy", meta: "0:44 · 121k views" },
    { no: "29", questionHtml: "Read the <em>terms.</em> Slowly.", cat: "method", meta: "0:29 · 67k views" },
    { no: "28", questionHtml: "Who wrote the <em>algorithm's</em> values?", cat: "media", meta: "0:51 · 203k views" },
    { no: "27", questionHtml: "The camera is also a <em>witness.</em>", cat: "surveillance", meta: "0:41 · 96k views" },
    { no: "26", questionHtml: "\"Glitch\" absorbs the <em>blame.</em>", cat: "power", meta: "0:36 · 58k views" },
    { no: "25", questionHtml: "You're <em>renting</em> what you owned.", cat: "economy", meta: "0:47 · 142k views" },
    { no: "24", questionHtml: "Heat is not <em>light.</em>", cat: "method", meta: "0:33 · 88k views" },
    { no: "23", questionHtml: "There's a <em>score</em> you can't see.", cat: "surveillance", meta: "0:52 · 174k views" },
    { no: "22", questionHtml: "Discovery is <em>delegation.</em>", cat: "media", meta: "0:39 · 79k views" },
    { no: "21", questionHtml: "Always ask: <em>who benefits?</em>", cat: "power", meta: "0:28 · 256k views" },
    { no: "20", questionHtml: "The bill comes due <em>later.</em>", cat: "economy", meta: "0:45 · 113k views" },
    { no: "19", questionHtml: "Metadata is the <em>message.</em>", cat: "surveillance", meta: "0:31 · 91k views" },
    { no: "18", questionHtml: "We're slow <em>on purpose.</em>", cat: "method", meta: "0:42 · 64k views" },
    { no: "17", questionHtml: "The feed has an <em>editor.</em>", cat: "media", meta: "0:37 · 102k views" }
  ],

  /* ---- INTERIOR PAGE INTROS --------------------------------------- */
  pages: {
    essays: {
      kicker: "The written inquiry", kickerMuted: "Long-form, unhurried",
      titleHtml: "Essays",
      dek: "One essay a week, filed in good faith and at length. We ask the same three questions — who benefits, who pays, who decides — of a different system each time.",
      sideBig: "42", sideLabelHtml: "Essays published<br>since MMXXVI"
    },
    episodes: {
      kicker: "On screen · YouTube", kickerMuted: "New episode every Friday",
      titleHtml: "Episodes",
      dek: "The inquiry, on screen. Each episode takes one question and follows it as far as it goes — no thumbnails screaming, no countdown timers. Just the argument, made slowly.",
      sideBig: "14", sideLabelHtml: "Episodes · 2.1M<br>minutes watched"
    },
    notes: {
      kicker: "Short dispatches · TikTok", kickerMuted: "One idea, under a minute",
      titleHtml: "Field <em>Notes</em>",
      dek: "The inquiry, compressed. A single observation, read aloud, in under sixty seconds. Field notes are where an essay starts — or where one lands once we've sat with it.",
      sideBig: "31", sideLabelHtml: "Notes filed · 4.6M<br>views to date"
    },
    archive: {
      kicker: "The complete record", kickerMuted: "Every inquiry, indexed",
      titleHtml: "The <em>Archive</em>",
      dek: "Every essay, episode, and note we've filed, in one place and in reverse order. Nothing is unpublished, nothing is quietly deleted — corrections are noted, not erased.",
      sideBig: "14", sideLabelHtml: "Issues · 2 years<br>of inquiry"
    }
  }
};
