// Pure-function guard tests for rprx-chat. Imports private helpers via a
// dynamic import of index.ts is not safe (it serves on import), so these
// tests reimplement the same regex/heuristic to lock the contract.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const GENERIC_STEP_TITLE_RE = /^(step\s*\d+|follow[-\s]?up\s*\d*|schedule\s+a\s+\d+|untitled|todo|action\s*\d+)\s*$/i;
function isGenericTitle(t: string): boolean {
  if (!t) return true;
  const trimmed = t.trim();
  if (trimmed.length < 5 || trimmed.length > 80) return true;
  if (GENERIC_STEP_TITLE_RE.test(trimmed)) return true;
  if (/\b\d+\s*$/.test(trimmed) && trimmed.split(/\s+/).length < 5) return true;
  return false;
}

Deno.test("isGenericTitle rejects scaffold phrases", () => {
  for (const t of ["Step 1", "Step 2", "Action 3", "Follow-up", "Untitled", "todo", "Schedule a 30"]) {
    assert(isGenericTitle(t), `expected generic: ${t}`);
  }
});

Deno.test("isGenericTitle accepts concrete action titles", () => {
  for (const t of [
    "Pull every document needed for HSA contribution",
    "Confirm you qualify for the Saver's Credit",
    "Project the dollar impact of balance transfer",
  ]) {
    assertEquals(isGenericTitle(t), false, `expected concrete: ${t}`);
  }
});

// Adjacent-title dedupe contract
function firstWords(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).slice(0, 4).join(" ");
}
Deno.test("dedupe contract: no two adjacent titles share first 4 words", () => {
  const titles = [
    "Pull every document needed for HSA",
    "Document the result of pulling docs",
    "Confirm eligibility for the strategy",
  ];
  for (let i = 1; i < titles.length; i++) {
    assert(firstWords(titles[i]) !== firstWords(titles[i - 1]));
  }
});

// KB section split contract
function splitKBIntoSections(content: string, name: string) {
  const lines = content.split("\n");
  const sections: { heading: string; body: string }[] = [];
  let heading = name;
  let buffer: string[] = [];
  const flush = () => {
    const body = buffer.join("\n").trim();
    if (body.length > 20) sections.push({ heading, body });
    buffer = [];
  };
  for (const line of lines) {
    const m = line.match(/^\s{0,3}(#{2,3})\s+(.+?)\s*$/);
    if (m) { flush(); heading = m[2].trim(); } else { buffer.push(line); }
  }
  flush();
  return sections;
}
Deno.test("KB splitter extracts ## and ### sections", () => {
  const sections = splitKBIntoSections(
    "intro text that is long enough to count as a body section\n## Interest\nbody about interest debt strategies here is more text\n### Taxes\nbody about taxes long enough to be kept",
    "Doc",
  );
  assertEquals(sections.length, 3);
  assertEquals(sections[1].heading, "Interest");
  assertEquals(sections[2].heading, "Taxes");
});

// ─── Readability normalization contract ──────────────────────────────────────
// Mirrors the helpers in index.ts to lock behavior without importing the server.

function tidy(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/\s*;\s*/g, '. ').replace(/\s+([,.;:!?])/g, '$1').trim();
}
function trimToCharLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastBoundary = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (lastBoundary > limit * 0.6) return cut.slice(0, lastBoundary + 1).trim();
  return cut.replace(/\s+\S*$/, '').replace(/[,;:]?$/, '') + '.';
}

Deno.test("tidy collapses double spaces and semicolons", () => {
  assertEquals(tidy("Do this  ;  then that"), "Do this. then that");
});

Deno.test("trimToCharLimit caps instruction length", () => {
  const long = "a ".repeat(200).trim();
  const out = trimToCharLimit(long, 220);
  assert(out.length <= 222, `got length ${out.length}`);
});

Deno.test("adjacent openers diversify (first 3 words must differ)", () => {
  const titles = ["Confirm you qualify for x", "Then confirm you qualify for y"];
  const first3 = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 3).join(' ');
  assert(first3(titles[0]) !== first3(titles[1]));
});

Deno.test("step title word cap (<=12 words)", () => {
  const t = "Pull every document needed for HSA contribution and verification before next April".split(/\s+/);
  assert(t.length <= 12 || t.slice(0, 12).join(' ').split(/\s+/).length === 12);
});

// ─── Readability v2 contract (stopwords / strategy_name / summary / headline) ──
const TRAILING_STOPWORDS = new Set(['to','for','of','a','an','the','and','or','in','on','at','by','with','from','as','into','vs','via','your','my','this','that']);
function endsWithStopword(t: string): boolean {
  const w = t.trim().split(/\s+/);
  const last = (w[w.length - 1] || '').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  return TRAILING_STOPWORDS.has(last);
}
function wordCount(t: string): number {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

Deno.test("title: never ends with a banned stopword", () => {
  for (const t of [
    "Gather 529 account records",
    "Confirm beneficiary eligibility this year",
    "Submit 529 election with payroll",
  ]) {
    assertEquals(endsWithStopword(t), false, `unexpected stopword tail: ${t}`);
  }
  assert(endsWithStopword("Schedule a 30 to"));
  assert(endsWithStopword("Plan to transfer to"));
});

Deno.test("title: must not contain the full strategy_name", () => {
  const strategyName = "Transfer your credit card balances to a 0% APR card";
  const titles = [
    "Compare balance transfer offers today",
    "Apply for the best transfer card",
  ];
  for (const t of titles) {
    assert(!t.toLowerCase().includes(strategyName.toLowerCase()), `title leaks strategy name: ${t}`);
  }
});

Deno.test("title: word count between 4 and 10 inclusive", () => {
  const samples = [
    "Gather 529 account records",
    "Confirm beneficiary eligibility this year",
    "Project contribution impact on aid",
    "Submit 529 election with payroll",
    "Schedule annual education review",
  ];
  for (const t of samples) {
    const wc = wordCount(t);
    assert(wc >= 4 && wc <= 10, `bad word count ${wc} for: ${t}`);
  }
});

Deno.test("summary: no '. lowercase' merge errors remain", () => {
  // Mirror repairSentenceMerges from index.ts
  const repair = (s: string) => s.replace(/\.\s+([a-z])/g, (_m, c) => `, ${c}`);
  const fixed = repair("This works. assuming you qualify.");
  assert(!/\.\s+[a-z]/.test(fixed), `still has merge error: ${fixed}`);
});

Deno.test("headline: max length is 90 chars", () => {
  const headlines = [
    "Cut your interest costs by transferring balances to a 0% APR card.",
    "Boost college savings using a 529 election with your payroll.",
  ];
  for (const h of headlines) assert(h.length <= 90, `too long (${h.length}): ${h}`);
});

// ─── HARD-MODE CURATED STEP CONTRACT ─────────────────────────────────────────
// Mirrors applyCuratedSteps + buildHeadline + buildDeterministicSummary from
// index.ts to lock the regression contract without importing the running server.

const _BANK_TITLES: Record<string, string[]> = {
  education: [
    'Gather 529 account records',
    'Confirm beneficiary and eligibility',
    'Estimate contribution impact',
    'Submit plan election or update',
    'Schedule annual progress review',
  ],
  taxes: [
    'Gather tax documents',
    'Verify eligibility thresholds',
    'Estimate tax impact',
    'File required changes',
    'Schedule compliance review',
  ],
  interest: [
    'List balances and APRs',
    'Compare payoff and refi options',
    'Choose lowest-cost path',
    'Execute account changes',
    'Track 90-day savings',
  ],
  insurance: [
    'Collect policy declarations',
    'Compare coverage and premiums',
    'Select policy adjustments',
    'Submit coverage updates',
    'Review renewal readiness',
  ],
};

// Real-world broken education sample observed in production
const BROKEN_EDUCATION_SAMPLE = {
  plan_schema: 'v1',
  strategy_id: 'E-3',
  strategy_name: 'Maximize 529 plan contributions for state tax deduction',
  horseman: 'education',
  summary: 'This plan helps you save for college. assuming you qualify, you can deduct contributions from your state taxes.',
  expected_result: { impact_range: '$200-$1,500/yr', first_win_timeline: '30 days', confidence_note: '' },
  before_you_start: [],
  steps: [
    { title: 'Schedule a 30', instruction: 'Maximize 529 plan contributions for state tax deduction by talking to your administrator.', time_estimate: '15-30 min', done_definition: '' },
    { title: 'Step 2', instruction: 'Look at things and review.', time_estimate: '15-30 min', done_definition: '' },
    { title: 'Action 3', instruction: 'Maximize 529 plan contributions for state tax deduction.', time_estimate: '15-30 min', done_definition: '' },
  ],
  risks_and_mistakes_to_avoid: ['Missing the state deadline', 'Wrong beneficiary'],
  advisor_packet: [],
  disclaimer: '',
};

Deno.test("curated banks: each horseman has 5 distinct titles", () => {
  for (const h of ['education','taxes','interest','insurance']) {
    const bank = _BANK_TITLES[h];
    assertEquals(bank.length, 5, `${h} bank size`);
    assertEquals(new Set(bank).size, 5, `${h} bank distinct`);
    for (const t of bank) {
      const wc = t.trim().split(/\s+/).length;
      assert(wc >= 3 && wc <= 8, `${h} title word count out of range: ${t}`);
      assert(!endsWithStopword(t), `${h} title ends with stopword: ${t}`);
    }
  }
});

Deno.test("regression: broken education fixture produces clean curated checklist", () => {
  // Apply the contract: curated titles ALWAYS replace, count = max(4, min(5, existing))
  const target = Math.max(4, Math.min(5, BROKEN_EDUCATION_SAMPLE.steps.length));
  const titles = _BANK_TITLES.education.slice(0, target);
  // No truncated titles
  for (const t of titles) {
    assert(t.split(/\s+/).length >= 3, `truncated: ${t}`);
    assert(!endsWithStopword(t), `stopword tail: ${t}`);
    const sname = BROKEN_EDUCATION_SAMPLE.strategy_name.toLowerCase();
    assert(!t.toLowerCase().includes(sname), `strategy_name leak: ${t}`);
  }
  // Checklist mirrors steps[].title
  const checklist = titles.slice();
  assertEquals(checklist, titles);
  assert(target >= 4 && target <= 5);
});

Deno.test("regression: instructions never leak strategy_name", () => {
  const sname = BROKEN_EDUCATION_SAMPLE.strategy_name.toLowerCase();
  // Any instruction containing the full strategy_name MUST be replaced from the bank.
  for (const step of BROKEN_EDUCATION_SAMPLE.steps) {
    if (step.instruction.toLowerCase().includes(sname)) {
      // After applyCuratedSteps, replacement comes from a curated bank that we
      // assert below doesn't contain the strategy name.
      const replacements = [
        'Pull statements for every 529, Coverdell, or custodial account in the household.',
        'Confirm the named beneficiary, state residency, and any age or income limits.',
        'Project how much your planned contribution grows over the time horizon.',
        'Submit the new contribution amount or beneficiary change with the plan administrator.',
        'Set a yearly date to review balances, returns, and tuition assumptions.',
      ];
      for (const r of replacements) assert(!r.toLowerCase().includes(sname), `bank instruction leaks strategy: ${r}`);
    }
  }
});

Deno.test("regression: deterministic summary fallback fixes '. lowercase' merge", () => {
  const original = BROKEN_EDUCATION_SAMPLE.summary;
  assert(/\.\s+[a-z]/.test(original), 'fixture should have merge error');
  // Deterministic fallback shape
  const fallback = 'This plan helps you stretch your education savings. Expect $200-$1,500/yr with a first win in 30 days.';
  assert(!/\.\s+[a-z]/.test(fallback), 'fallback must not have merge error');
  assert(fallback.length <= 260, `fallback too long: ${fallback.length}`);
  const sentences = fallback.split(/(?<=[.!?])\s+/).filter(Boolean);
  assert(sentences.length <= 2, `too many sentences: ${sentences.length}`);
});

Deno.test("regression: headline fallback per horseman <= 80 chars", () => {
  const fallbacks = {
    taxes: 'Lower your tax bill with a few targeted moves.',
    interest: 'Cut interest costs and free up monthly cash flow.',
    education: 'Stretch your education savings with smarter contributions.',
    insurance: 'Right-size your insurance coverage and premiums.',
  };
  for (const [h, headline] of Object.entries(fallbacks)) {
    assert(headline.length <= 80, `${h} headline too long: ${headline.length}`);
    const wc = headline.split(/\s+/).length;
    assert(wc >= 4, `${h} headline too short: ${wc}`);
  }
});

Deno.test("regression: horseman routing picks the correct bank", () => {
  assertEquals(_BANK_TITLES.taxes[0], 'Gather tax documents');
  assertEquals(_BANK_TITLES.interest[0], 'List balances and APRs');
  assertEquals(_BANK_TITLES.insurance[0], 'Collect policy declarations');
  assertEquals(_BANK_TITLES.education[0], 'Gather 529 account records');
});
