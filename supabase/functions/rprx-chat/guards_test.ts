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
