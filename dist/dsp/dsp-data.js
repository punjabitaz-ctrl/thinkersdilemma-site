/* =====================================================================
   DIGITAL SOVEREIGNTY AUDIT — data + scoring engine
   Single source of truth for the rubric, grade bands and leaderboard.
   Rubric v1.1 is FROZEN for the cycle: do not edit weights, criteria or
   bands here without publishing a revision and re-scoring every state.
   ===================================================================== */
(function (root) {
  "use strict";

  var DSP = {
    rubricVersion: "v1.1",
    asOf: "Entry 12",
    totalStates: 50,

    /* Launch: Week 1 publishes Nov 5, 2026. Entries 1-12 (already audited) run
       as Weeks 1-12; Entry N publishes in Week N. Weeks are 7 days apart. */
    launch: "2026-11-05",
    verifiedOn: "2026-10-07",
    tagline: "50 states graded in 50 weeks",

    pillars: [
      {
        key: "ownership", decl: "Your data is yours. It is not merely about you.", name: "Ownership", weight: 25, heavy: true,
        question: "Is data yours, or merely about you?",
        blurb: "Does the state grant residents an affirmative interest in their own data, or a set of requests they may politely submit?",
        reality: "A right to know that returns a spreadsheet of what you already knew you gave them scores low. The test is whether a resident learns something new, specifically who else now has it.",
        criteria: [
          { label: "Statute frames data as a resident's property, asset or interest, not merely a subject of protection", pts: 20 },
          { label: "Right to know: resident can compel disclosure of what is held", pts: 15 },
          { label: "Disclosure includes sources (where it came from)", pts: 10 },
          { label: "Disclosure includes recipients (who it was given to, by name)", pts: 15 },
          { label: "Right to correct inaccurate records", pts: 10 },
          { label: "Covers inferred and derived data, not just data the resident supplied", pts: 15 },
          { label: "Covers sensitive categories explicitly (biometric, health, geolocation, immigration status, religion, sexuality)", pts: 15 }
        ]
      },
      {
        key: "consent", decl: "Permission is something given. It is not something you failed to refuse.", name: "Consent", weight: 15,
        question: "Was permission given, or merely not successfully refused?",
        blurb: "Does consent mean permission freely given, or the absence of a successfully navigated objection?",
        reality: "Pay-or-consent schemes, where declining tracking costs money, are recorded as a failure of the anti-discrimination criterion regardless of how the statute characterizes them. A right you must purchase is a product.",
        criteria: [
          { label: "Opt-in required for sensitive data (not opt-out)", pts: 25 },
          { label: "Universal opt-out mechanism recognized (browser signal / Global Privacy Control honored by law)", pts: 20 },
          { label: "Dark patterns explicitly prohibited in consent flows", pts: 15 },
          { label: "Anti-discrimination: service cannot be degraded or priced punitively for refusing", pts: 15 },
          { label: "Consent revocable as easily as it was given", pts: 10 },
          { label: "Minors given heightened protection (opt-in, no targeted ads)", pts: 15 }
        ]
      },
      {
        key: "portability", decl: "You can leave, and you can take the record with you.", name: "Portability", weight: 15,
        question: "Can you leave and take the record with you?",
        blurb: "Can a resident actually leave, or only receive a PDF?",
        reality: "Format is the whole game. A portability right satisfied by a PDF is a right to look, not to leave.",
        criteria: [
          { label: "Right to obtain data in a structured, machine-readable format", pts: 30 },
          { label: "Right to direct transmission to another controller", pts: 20 },
          { label: "No fee for exercise (or fee capped at trivial)", pts: 15 },
          { label: "Response deadline of 45 days or less", pts: 15 },
          { label: "Covers inferred and derived data, not just raw inputs", pts: 20 }
        ]
      },
      {
        key: "erasure", decl: "When you say delete, it dies.", name: "Erasure", weight: 15,
        question: "When you say delete, does it die?",
        blurb: "When a resident demands deletion, does the data actually die, everywhere?",
        reality: "Deletion that stops at the first company is theatre. The data left that building years ago. Propagation and broker coverage are weighted accordingly.",
        criteria: [
          { label: "Right to delete personal data on request", pts: 20 },
          { label: "Obligation to propagate deletion downstream to processors, affiliates and third parties who received it", pts: 30 },
          { label: "Data broker deletion: single-request mechanism covering all registered brokers (a DELETE Act style regime)", pts: 25 },
          { label: "Data minimization and retention limits independent of request (data dies on a schedule, not only on demand)", pts: 15 },
          { label: "Deletion verified or auditable, not merely asserted", pts: 10 }
        ]
      },
      {
        key: "accountability", decl: "A right you cannot enforce is a suggestion.", name: "Accountability", weight: 30, heavy: true,
        question: "When violated, what actually happens?",
        blurb: "When this is violated: who can sue, what does it cost, and has anyone actually paid?",
        reality: "This is the pillar where states go to die. Most comprehensive state privacy laws provide no general private right of action, meaning the right belongs to the attorney general, not to you. The last criterion is empirical and non-negotiable: has anyone actually paid? A law never enforced scores zero there, however elegant its text.",
        criteria: [
          { label: "Private right of action: general, not limited to breach", pts: 30 },
          { label: "No mandatory cure period (or cure period sunset or expired)", pts: 10 },
          { label: "Statutory damages defined per violation (resident need not prove financial loss)", pts: 15 },
          { label: "Dedicated enforcement body with independent budget and staff", pts: 15 },
          { label: "Penalty ceiling meaningful relative to violator revenue", pts: 10 },
          { label: "Enforcement has actually occurred: public actions brought, penalties collected", pts: 20 }
        ]
      }
    ],

    exemptions: [
      { label: "Employee / HR data excluded (workers unprotected)", pts: 8 },
      { label: "B2B data excluded", pts: 4 },
      { label: "Broad entity-level exemptions (GLBA / HIPAA-regulated entities exempt entirely, not just for regulated data)", pts: 8 },
      { label: "Nonprofits exempt", pts: 3 },
      { label: "Government / law enforcement exempt from the statute", pts: 6 },
      { label: "Revenue or volume threshold so high that most data-handling businesses fall outside it", pts: 6 },
      { label: "“Sale” defined narrowly enough to permit trade for non-monetary consideration", pts: 5 }
    ],
    exemptionCap: 40,
    realityCapGrade: "D",
    realityCapScore: 54,

    bands: [
      { min: 85, max: 100, grade: "A", short: "Sovereignty", long: "Rights exist, exit exists, and violation has a price. No U.S. state currently occupies this band." },
      { min: 70, max: 84,  grade: "B", short: "Substantive protection, structural gaps", long: "Real protection with structural gaps." },
      { min: 55, max: 69,  grade: "C", short: "Rights on paper, discretionary enforcement", long: "Rights exist on paper; enforcement is discretionary." },
      { min: 40, max: 54,  grade: "D", short: "A statute, not a shield", long: "A compliance ritual." },
      { min: 20, max: 39,  grade: "E", short: "Sectoral scraps", long: "No general regime." },
      { min: 0,  max: 19,  grade: "F", short: "The Void", long: "Residents have essentially no recourse." }
    ],

    /* Audited states, Entries 1-12 (Rubric v1.1). Order here is audit order.
       verified = date the entry was last checked against primary law.
       updates  = dated log of post-audit changes. A score changes only when an
       enacted, in-force change moves a rubric criterion. */
    states: [
      { entry: 1,  week: 1,  state: "New York",       score: 16, grade: "F", comp: false, verified: "2026-10-07", finding: "Real enforcement, none of it yours.",
        updates: [
          { date: "2026-07-28", text: "AG finalized SAFE for Kids Act rules (published July 29). Compliance due January 25, 2027; AG enforcement only.", effect: "No score change. Re-check January 25, 2027." }
        ] },
      { entry: 2,  week: 2,  state: "California",     score: 67, grade: "C", comp: true,  verified: "2026-10-07", finding: "The only single-request broker deletion in America (DROP). Residents can sue only after a breach.",
        updates: [
          { date: "2026-08-01", text: "Data brokers began processing DROP deletion requests, then every 45 days.", effect: "No score change. No change found to the private right of action." }
        ] },
      { entry: 3,  week: 3,  state: "Texas",          score: 48, grade: "D", comp: true,  verified: "2026-10-07", finding: "About $2.78B in privacy settlements, and no resident can sue.",
        updates: [] },
      { entry: 4,  week: 4,  state: "Florida",        score: 13, grade: "F", comp: true,  verified: "2026-10-07", finding: "A Digital Bill of Rights with a threshold set so high it covers almost no one.",
        scoreWas: 21, pillars: { ownership: 35, consent: 40, portability: 38, erasure: 30, accountability: 32 }, penalty: 22,
        updates: [
          { date: "2026-06-29", text: "The Roku case under the Digital Bill of Rights concluded: $25M in compliance engineering, no monetary fine, no finding of wrongdoing.", effect: "Re-scored under Rubric v1.1. The criterion rewards penalties collected and none were, so it stays at 6/20. No change from the settlement." },
          { date: "2026-10-07", text: "Arithmetic reconciliation: the published pillar scores (35, 40, 38, 30, 32) weight to 34.55; less the 22-point penalty that is 13, not 21.", effect: "Score corrected from 21 (E) to 13 (F). Pillars and penalty unchanged." }
        ] },
      { entry: 5,  week: 5,  state: "Pennsylvania",   score: 19, grade: "F", comp: false, verified: "2026-10-07", finding: "Residents have standing through consumer-protection law, not privacy law.",
        updates: [
          { date: "2026-06-24", text: "HB 78, a comprehensive privacy bill, cleared the Senate Communications & Technology Committee unanimously (June 24, 2026) and was sent to the full Senate. No floor vote found as of October 7.", effect: "No score change. Pending bills score zero. If enacted, Pennsylvania is re-audited as a comprehensive-law state." }
        ] },
      { entry: 6,  week: 6,  state: "Illinois",       score: 31, grade: "E", comp: false, verified: "2026-10-07", finding: "The strongest private remedy in the country, for biometrics only.",
        updates: [
          { date: "2026-04-01", text: "Seventh Circuit, Clay v. Union Pacific: the 2024 BIPA amendment applies to pending cases. One recovery per person for repeated collection by the same method.", effect: "No score change. The audit already scored damages as narrowed." }
        ] },
      { entry: 7,  week: 7,  state: "Ohio",           score: 11, grade: "F", comp: false, verified: "2026-10-07", finding: "Its national first protects businesses from lawsuits, not residents from harm.",
        updates: [] },
      { entry: 8,  week: 8,  state: "Georgia",        score: null, grade: null, comp: false, status: "reaudit", verified: "2026-10-07",
        finding: "Under correction. The audit scored Georgia as having enacted a privacy law. The signed act is a rural-hospital tax credit bill.",
        scoreWas: 20,
        updates: [
          { date: "2026-10-07", text: "Correction. SB 111 began as the Georgia Consumer Privacy Protection Act, but a House committee substitute on March 25, 2026 replaced it. The act the Governor signed on May 11, 2026 amends Code Section 31-8-9.1 (rural hospital tax credits) and contains no privacy provisions. The audit's premise, that Georgia enacted a comprehensive privacy law, was wrong.", effect: "Score withdrawn (was 20, E). Georgia is re-audited as a state with no comprehensive law and republished in Week 8." }
        ] },
      { entry: 9,  week: 9,  state: "North Carolina", score: 14, grade: "F", comp: false, verified: "2026-10-07", finding: "An aggressive attorney general and not one consumer data right.",
        updates: [] },
      { entry: 10, week: 10, state: "Michigan",       score: 12, grade: "F", comp: false, verified: "2026-10-07", finding: "The first exact forecast of the series (error zero).",
        updates: [] },
      { entry: 11, week: 11, state: "New Jersey",     score: 46, grade: "D", comp: true,  verified: "2026-10-07", finding: "Rights like California's, a courthouse door like nobody's.",
        updates: [
          { date: "2026-06-02", text: "The Division of Consumer Affairs' proposed regulations expired without adoption. The statute's rulemaking authority is unchanged.", effect: "No score change. The audit credits the authority, not a finished rule." },
          { date: "2026-06-30", text: "A5328 was signed. It bars any person from selling sensitive data regardless of how many consumers' data they hold, with no consent exception, and creates a data broker registry (opening spring 2027). Reported penalty: $50,000 per record. Reports say the administration will not enforce the sale ban until legislative fixes pass.", effect: "No score change. The audit already credited opt-in for sensitive data, and the enforcement criterion rewards actions brought. Logged, not scored, until an enforcement posture is on record." }
        ] },
      { entry: 12, week: 12, state: "Virginia",       score: 33, grade: "E", comp: true,  verified: "2026-10-07", finding: "The most-copied privacy law in America, and no publicly announced enforcement action found in the Attorney General's releases as of October 7, 2026.",
        pillars: { ownership: 48, consent: 40, portability: 50, erasure: 48, accountability: 28 }, penalty: 8,
        updates: [
          { date: "2026-07-01", text: "SB 388 took effect: a ban on the sale of precise geolocation data, enforced by the Attorney General through the VCDPA.", effect: "No score change." },
          { date: "2026-10-07", text: "Wording changed from \u201czero enforcement actions\u201d to \u201cno publicly announced enforcement action found,\u201d backed by a dated check. On October 7, 2026 the Attorney General\u2019s news-release listing and a site search for the Consumer Data Protection Act returned no VCDPA enforcement release.", effect: "No score change." }
        ] }
    ],

    next: { entry: 13, state: "Washington", note: "The first audited state where a resident can personally sue over a data violation, if only for health data." },
    /* All fifty states, alphabetical. Audit status is derived from DSP.states; a state
       absent from DSP.states is queued. Queue order beyond Entry 13 is not yet fixed. */
    roster: ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"],
    watch: ["Louisiana", "Alabama", "Oklahoma", "Vermont"],
    watchNote: "Louisiana and Oklahoma take effect January 1, 2027, Alabama May 1, 2027, Vermont January 1, 2028. The original forecasts assumed none of them had a comprehensive law.",
    preemption: {
      bill: "SECURE Data Act (H.R. 8413)",
      text: "Introduced April 22, 2026. Would preempt state privacy laws that \u201crelate to\u201d its provisions, with no private right of action. Early stage. Federal bills are not scored; the rubric grades states."
    }
  };

  /* ---------- schedule helpers ------------------------------------ */
  function parseDay(iso) { var p = iso.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  DSP.weekDate = function (week) { var d = parseDay(DSP.launch); d.setUTCDate(d.getUTCDate() + 7 * (week - 1)); return d; };
  DSP.fmtDate = function (d) {
    if (typeof d === "string") d = parseDay(d);
    return ["January","February","March","April","May","June","July","August","September","October","November","December"][d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear();
  };
  /* Where are we in the 50 weeks? now = Date (defaults to today). */
  DSP.phase = function (now) {
    var t = (now || new Date()).getTime();
    var launch = parseDay(DSP.launch).getTime();
    if (t < launch) return { phase: "pre", days: Math.ceil((launch - t) / 864e5) };
    var week = Math.min(DSP.totalStates, Math.floor((t - launch) / (7 * 864e5)) + 1);
    return { phase: week >= DSP.totalStates ? "final" : "live", week: week };
  };

  /* ---------- scoring engine (pure) ------------------------------- */
  DSP.slug = function (name) { return String(name).toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""); };

  DSP.gradeFor = function (score) {
    var s = Math.max(0, Math.min(100, Math.round(score)));
    for (var i = 0; i < DSP.bands.length; i++) {
      if (s >= DSP.bands[i].min && s <= DSP.bands[i].max) return DSP.bands[i];
    }
    return DSP.bands[DSP.bands.length - 1];
  };

  /* pillarScores: { ownership: 0-100, ... }
     penalty: total exemption points (only pass >0 if a comprehensive statute exists)
     realityCap: boolean, caps the score at the top of the D band */
  DSP.score = function (pillarScores, penalty, realityCap) {
    var weighted = 0;
    DSP.pillars.forEach(function (p) {
      var v = Math.max(0, Math.min(100, Number(pillarScores[p.key]) || 0));
      weighted += v * p.weight / 100;
    });
    var pen = Math.max(0, Math.min(DSP.exemptionCap, Number(penalty) || 0));
    var raw = weighted - pen;
    var score = Math.max(0, Math.min(100, Math.round(raw)));
    var capped = false;
    if (realityCap && score > DSP.realityCapScore) { score = DSP.realityCapScore; capped = true; }
    return { weighted: weighted, penalty: pen, raw: raw, score: score, band: DSP.gradeFor(score), capped: capped };
  };

  /* Published pillar-level scores that have been verified against the audits. */
  DSP.examples = [
    { state: "Illinois", entry: 6, comp: false, pillars: { ownership: 14, consent: 30, portability: 0, erasure: 18, accountability: 68 }, penalty: 0, published: 31,
      note: "A 68 on the heaviest pillar is worth about 20 points. Near-zero Ownership and a literal zero in Portability drag the composite to 31. Depth cannot substitute for breadth." },
    { state: "Ohio", entry: 7, comp: false, pillars: { ownership: 4, consent: 10, portability: 0, erasure: 5, accountability: 26 }, penalty: 0, published: 11,
      note: "No comprehensive statute, so the exemption penalty is N/A. The absence is already priced into the pillars." },
    { state: "Michigan", entry: 10, comp: false, pillars: { ownership: 5, consent: 8, portability: 0, erasure: 5, accountability: 28 }, penalty: 0, published: 12,
      note: "Forecast 12, audited 12. When the territory does not move, the instrument is calibrated." }
  ];

  root.DSP = DSP;
  if (typeof module !== "undefined" && module.exports) module.exports = DSP;
})(typeof window !== "undefined" ? window : globalThis);
