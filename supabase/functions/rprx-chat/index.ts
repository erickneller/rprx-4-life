import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema
const requestSchema = z.object({
  conversation_id: z.string().uuid().optional().nullable(),
  user_message: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(8000, 'Message must be less than 8000 characters'),
  mode: z.enum(['auto', 'manual']).optional().nullable(),
  page: z.number().int().min(1).max(10).optional().nullable(),
});

// =====================================================
// TYPES
// =====================================================

interface DBStrategy {
  id: string;
  strategy_id: string;
  title: string;
  strategy_details: string;
  example: string | null;
  potential_savings_benefits: string | null;
  horseman_type: string;
  difficulty: string;
  estimated_impact_min: number | null;
  estimated_impact_max: number | null;
  estimated_impact_display: string | null;
  tax_return_line_or_area: string | null;
  goal_tags: string[] | null;
  implementation_steps: unknown;
  is_active: boolean;
  sort_order: number;
}

interface ScoredStrategy {
  strategy: DBStrategy;
  score: number;
}

interface UserContext {
  primaryHorseman: string | null;
  secondaryHorseman: string | null;
  thirdHorseman: string | null;
  financialGoals: string[];
  profileTypes: string[];
  cashFlowStatus: string | null;
  completedStrategyIds: string[];
  activeStrategyIds: string[];
  mode: 'auto' | 'manual';
}

// =====================================================
// STRATEGY FETCHING FROM DATABASE
// =====================================================

export type StrategySource = 'v2' | 'legacy' | 'none';

async function fetchStrategies(serviceClient: any): Promise<{ strategies: DBStrategy[]; source: StrategySource; error?: string }> {
  const { data, error } = await serviceClient
    .from('strategy_catalog_v2')
    .select('id, strategy_id, title, strategy_details, example, potential_savings_benefits, horseman_type, difficulty, estimated_impact_min, estimated_impact_max, estimated_impact_display, tax_return_line_or_area, goal_tags, implementation_steps, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!error && data && data.length > 0) {
    console.log(`Strategy source: strategy_catalog_v2 (${data.length} rows)`);
    return { strategies: data, source: 'v2' };
  }

  const allowLegacy = Deno.env.get('ALLOW_LEGACY_FALLBACK') === 'true';
  if (!allowLegacy) {
    const msg = 'strategy_catalog_v2 unavailable/empty and ALLOW_LEGACY_FALLBACK !== "true"';
    console.error(msg, error);
    return { strategies: [], source: 'none', error: msg };
  }

  console.warn('strategy_catalog_v2 unavailable/empty, using legacy strategy_definitions fallback');
  const { data: legacy, error: legacyError } = await serviceClient
    .from('strategy_definitions')
    .select('id, horseman_type, name, description, difficulty, estimated_impact, tax_return_line_or_area, financial_goals, steps, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (legacyError || !legacy) {
    console.error('Error fetching fallback strategies:', legacyError || error);
    return { strategies: [], source: 'none', error: (legacyError || error)?.message };
  }

  console.log(`Strategy source: strategy_definitions legacy (${legacy.length} rows)`);
  return {
    source: 'legacy',
    strategies: legacy.map((s: any) => ({
    id: s.id,
    strategy_id: s.id,
    title: s.name,
    strategy_details: s.description,
    example: null,
    potential_savings_benefits: null,
    horseman_type: s.horseman_type,
    difficulty: s.difficulty,
    estimated_impact_min: null,
    estimated_impact_max: null,
    estimated_impact_display: s.estimated_impact,
    tax_return_line_or_area: s.tax_return_line_or_area,
    goal_tags: Array.isArray(s.financial_goals) ? s.financial_goals : [],
    implementation_steps: s.steps,
    is_active: s.is_active,
    sort_order: s.sort_order ?? 0,
  })),
  };
}

// =====================================================
// SMART STRATEGY RANKING ALGORITHM
// =====================================================

function scoreStrategy(strategy: DBStrategy, context: UserContext): number {
  // Hard excludes
  if (context.completedStrategyIds.includes(strategy.id)) return -1;

  let score = 0;

  // 1) Horseman fit (max 35)
  if (context.primaryHorseman && strategy.horseman_type === context.primaryHorseman) score += 35;
  else if (context.secondaryHorseman && strategy.horseman_type === context.secondaryHorseman) score += 20;
  else if (context.thirdHorseman && strategy.horseman_type === context.thirdHorseman) score += 10;

  // 2) Goal fit (max 20)
  if (context.financialGoals.length > 0 && strategy.goal_tags && strategy.goal_tags.length > 0) {
    const overlap = strategy.goal_tags.filter(g => context.financialGoals.includes(g)).length;
    const ratio = overlap / Math.max(1, Math.min(context.financialGoals.length, strategy.goal_tags.length));
    if (ratio >= 0.7) score += 20;
    else if (ratio > 0) score += 10;
  }

  // 3) Urgency fit (max 20)
  // Prefer immediate-relief strategies when cash flow is tight/deficit
  if (context.cashFlowStatus === 'deficit') {
    if (strategy.difficulty === 'easy') score += 20;
    else if (strategy.difficulty === 'moderate') score += 12;
    else score += 4;
  } else if (context.cashFlowStatus === 'tight') {
    if (strategy.difficulty === 'easy') score += 16;
    else if (strategy.difficulty === 'moderate') score += 12;
    else score += 7;
  } else {
    score += 10;
  }

  // 4) Feasibility fit (max 15)
  if (context.mode === 'auto') {
    if (strategy.difficulty === 'easy') score += 15;
    else if (strategy.difficulty === 'moderate') score += 9;
    else score += 4;
  } else {
    if (strategy.difficulty === 'advanced') score += 10;
    else score += 12;
  }

  // 5) Impact fit (max 10)
  const impact = (strategy.estimated_impact_display || '').toLowerCase();
  if (impact.includes('50,000') || impact.includes('100,000') || impact.includes('high')) score += 10;
  else if (impact.includes('10,000') || impact.includes('5,000')) score += 8;
  else if (impact.trim()) score += 6;
  else score += 4;

  // Penalties
  if (context.activeStrategyIds.includes(strategy.id)) score -= 20;

  return Math.max(score, 0);
}

function rankStrategies(strategies: DBStrategy[], context: UserContext): ScoredStrategy[] {
  return strategies
    .map(strategy => ({ strategy, score: scoreStrategy(strategy, context) }))
    .filter(s => s.score >= 0)
    .sort((a, b) => b.score - a.score);
}

type Horseman = 'interest' | 'taxes' | 'insurance' | 'education';

const HORSEMEN: Horseman[] = ['interest', 'taxes', 'insurance', 'education'];
const CROSS_HORSEMAN_OVERRIDE_THRESHOLD = 25;

function normalizeHorseman(value: unknown): Horseman | null {
  const raw = String(Array.isArray(value) ? value[0] : value || '').toLowerCase().trim();
  if (raw === 'tax' || raw === 'taxation') return 'taxes';
  if (raw === 'debt') return 'interest';
  return HORSEMEN.includes(raw as Horseman) ? raw as Horseman : null;
}

function detectPromptHorseman(message: string): { horseman: Horseman | null; reason: string } {
  const lower = message.toLowerCase();
  const scores: Record<Horseman, number> = { interest: 0, taxes: 0, insurance: 0, education: 0 };

  const add = (horseman: Horseman, points: number, patterns: RegExp[]) => {
    for (const pattern of patterns) {
      if (pattern.test(lower)) scores[horseman] += points;
    }
  };

  add('taxes', 4, [/\b(tax|taxes|taxation|irs|1040|w-?4|withholding|deduction|deductible|refund)\b/, /\breduce\s+tax(es)?\b/, /\btax\s+(credit|return|prep|planning)\b/]);
  add('interest', 4, [/\b(interest|debt|debts|apr|credit\s+card|balance\s+transfer|payoff|loan|loans|refinance|consolidat(e|ion))\b/, /\bmonthly\s+cash\s+flow\b/, /\bincrease\s+cash\s+flow\b/]);
  add('insurance', 4, [/\b(insurance|premium|premiums|coverage|policy|policies|deductible|life\s+insurance|disability|long[-\s]?term\s+care)\b/]);
  add('education', 4, [/\b(education|college|tuition|529|coverdell|student\s+aid|financial\s+aid|scholarship|fafsa)\b/, /\bsave\s+for\s+education\b/]);

  // Avoid letting generic words override explicit tax/education/insurance intent.
  if (/\btax\s+credit\b/.test(lower)) scores.interest = Math.max(0, scores.interest - 2);
  if (/\bstudent\s+loan(s)?\b/.test(lower)) scores.interest += 2;

  const ranked = HORSEMEN.map(h => ({ horseman: h, score: scores[h] })).sort((a, b) => b.score - a.score);
  if (ranked[0].score <= 0 || ranked[0].score === ranked[1].score) {
    return { horseman: null, reason: `none:${JSON.stringify(scores)}` };
  }
  return { horseman: ranked[0].horseman, reason: `keywords:${JSON.stringify(scores)}` };
}

function inferStrategyContentHorseman(strategy: DBStrategy): { horseman: Horseman | null; reason: string } {
  const signalText = `${strategy.title} ${strategy.strategy_details || ''}`;
  const detected = detectPromptHorseman(signalText);
  if (!detected.horseman) return detected;

  const lower = signalText.toLowerCase();
  // Education strategies often include tax-credit language; keep them education when the education signal is explicit.
  if (/\b(education|college|tuition|529|coverdell|financial\s+aid|student)\b/.test(lower)) {
    return { horseman: 'education', reason: `education_override:${detected.reason}` };
  }
  return detected;
}

function filterCatalogIntegrity(strategies: DBStrategy[]): DBStrategy[] {
  return strategies.filter(strategy => {
    const rowHorseman = normalizeHorseman(strategy.horseman_type);
    const inferred = inferStrategyContentHorseman(strategy);
    if (rowHorseman && inferred.horseman && inferred.horseman !== rowHorseman) {
      console.error(`Strategy catalog integrity mismatch excluded | strategy_id=${strategy.strategy_id} | row_horseman=${strategy.horseman_type} | inferred_horseman=${inferred.horseman} | reason=${inferred.reason} | title=${strategy.title}`);
      return false;
    }
    return true;
  });
}

function assertPlanMatchesStrategy(plan: StructuredPlan, strategy: DBStrategy): string[] {
  const errors: string[] = [];
  if (plan.strategy_id !== strategy.strategy_id) errors.push(`strategy_id:${plan.strategy_id}->${strategy.strategy_id}`);
  if (plan.strategy_name !== strategy.title) errors.push(`strategy_name:${plan.strategy_name}->${strategy.title}`);
  if (normalizeHorseman(plan.horseman) !== normalizeHorseman(strategy.horseman_type)) errors.push(`horseman:${plan.horseman}->${strategy.horseman_type}`);
  return errors;
}

// =====================================================
// STRATEGY FORMATTING
// =====================================================

/** Strip markdown bold, redundant section labels, and filler phrases. */
function cleanStrategyText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/\*\*/g, '')
    .replace(/^#+\s+/gm, '')
    .replace(/^\s*(Strategy Topic|Strategy Details|Example|Potential Savings\/Benefits|Potential Savings|Benefits)\s*:\s*/gim, '')
    .replace(/^\s*(certainly|sure|of course|absolutely|great question|happy to help)[,!\s][^\n]*\n+/gi, '')
    .trim();
}

/** Normalize implementation_steps to array of plain step strings. */
function normalizeSteps(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((step: any) => {
      if (typeof step === 'string') return step;
      if (step && typeof step === 'object') {
        return step.text || step.step || step.instruction || step.title || JSON.stringify(step);
      }
      return String(step);
    })
    .map(s => cleanStrategyText(s))
    .filter(s => s.length > 0);
}

// =====================================================
// STRUCTURED PLAN BUILDER (strict schema v1)
// =====================================================

interface StructuredPlanStep {
  title: string;
  instruction: string;
  time_estimate: string;
  done_definition: string;
}

interface StructuredPlan {
  plan_schema: 'v1';
  strategy_id: string;
  strategy_name: string;
  horseman: string;
  summary: string;
  expected_result: {
    impact_range: string;
    first_win_timeline: string;
    confidence_note: string;
  };
  before_you_start: string[];
  steps: StructuredPlanStep[];
  risks_and_mistakes_to_avoid: string[];
  advisor_packet: string[];
  disclaimer: string;
}

const HORSEMAN_PRESETS: Record<string, {
  before: string[];
  risks: string[];
  packet: string[];
  firstWin: string;
  confidence: string;
}> = {
  taxes: {
    before: [
      'Most recent federal tax return (Form 1040 + all schedules)',
      'Last 2 pay stubs and current W-4 on file with employer',
      'List of all retirement / HSA / FSA accounts with balances',
      'Filing status and dependents confirmed for current year',
    ],
    risks: [
      'Acting on rules from a prior tax year — IRS limits change annually',
      'Skipping the qualified-plan paperwork and losing the deduction',
      'Forgetting to update withholding after the change',
      'Treating educational guidance as filed tax advice',
    ],
    packet: [
      'Most recent Form 1040 + state return',
      'Year-to-date pay stub showing gross wages and withholding',
      'List of any side-income / 1099 sources with totals',
      'Account statements for IRA, 401(k), HSA, 529',
      'Specific question(s) you want answered in writing',
    ],
    firstWin: '7-21 days',
    confidence: 'Estimates assume current-year IRS limits and an accurate filing status; actual savings depend on your full return.',
  },
  interest: {
    before: [
      'Current statements for every revolving and installment debt',
      'APR, minimum payment, and balance for each account',
      'Latest credit report (free at AnnualCreditReport.com)',
      'Monthly cash-flow snapshot (income vs. fixed expenses)',
    ],
    risks: [
      'Closing paid-off cards and dropping your credit score',
      'Stretching unsecured debt into a secured loan against your home',
      'Restarting the clock by refinancing without a payoff plan',
      'Missing a teaser-rate expiration on a balance transfer',
    ],
    packet: [
      'List of all debts with balance, APR, and min payment',
      'Current credit score and last credit report',
      'Monthly take-home pay and required fixed expenses',
      'Target payoff date or monthly payment cap',
    ],
    firstWin: '7-14 days',
    confidence: 'Interest savings shown assume you keep paying at least the current monthly amount and stop adding new balances.',
  },
  insurance: {
    before: [
      'Declarations pages for every active policy (auto, home, life, health, disability)',
      'Current premium amounts and renewal dates',
      'List of named insureds, beneficiaries, and coverage limits',
      'Recent claims history (last 3-5 years)',
    ],
    risks: [
      'Lowering coverage to a level that leaves a major gap',
      'Cancelling old coverage before new coverage is in force',
      'Replacing permanent life policies without a 1035 exchange review',
      'Choosing the cheapest premium and ignoring claims-paying ratings',
    ],
    packet: [
      'Declarations pages for each policy',
      'Most recent premium statements / renewal notices',
      'Current beneficiary designations',
      'Health questionnaire answers (for life/disability quotes)',
    ],
    firstWin: '14-30 days',
    confidence: 'Premium and coverage outcomes depend on underwriting; quotes can vary materially carrier to carrier.',
  },
  education: {
    before: [
      'Current 529 / education savings balances and contribution history',
      'Estimated number of years until first tuition payment',
      'State of residence (for state tax deduction eligibility)',
      'Beneficiary information and Social Security number(s)',
    ],
    risks: [
      'Over-funding a 529 with no flexible exit plan',
      'Missing the state tax deduction by using an out-of-state plan',
      'Withdrawing for non-qualified expenses and triggering tax + 10% penalty',
      'Naming the wrong account owner and disrupting financial-aid calculations',
    ],
    packet: [
      'Current 529 statements and contribution history',
      'List of beneficiaries with ages and SSNs',
      'State of residence and any state-plan enrollment forms',
      'Target college funding goal in today\'s dollars',
    ],
    firstWin: '14-30 days',
    confidence: 'Projected balances depend on contribution consistency and market returns; tax treatment depends on qualified use.',
  },
};

// Generic / truncated step-title detector
const GENERIC_STEP_TITLE_RE = /^(step\s*\d+|follow[-\s]?up\s*\d*|schedule\s+a\s+\d+|untitled|todo|action\s*\d+)\s*$/i;

function isGenericTitle(t: string): boolean {
  if (!t) return true;
  const trimmed = t.trim();
  if (trimmed.length < 5 || trimmed.length > 80) return true;
  if (GENERIC_STEP_TITLE_RE.test(trimmed)) return true;
  // Truncated fragments like "Schedule a 30" (ends in a bare number with no noun)
  if (/\b\d+\s*$/.test(trimmed) && trimmed.split(/\s+/).length < 5) return true;
  return false;
}

/** Verb-led action title from a sentence (max ~70 chars). */
function deriveActionTitle(text: string, fallback: string): string {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim().replace(/^\d+\.\s*/, '');
  if (!cleaned) return fallback;
  // Take the first clause up to first sentence terminator or 70 chars
  let title = cleaned.split(/(?<=[.!?])\s+/)[0];
  if (title.length > 70) {
    // cut at last word boundary <=70
    const cut = title.slice(0, 70);
    title = cut.replace(/\s+\S*$/, '').trim();
  }
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (isGenericTitle(title)) return fallback;
  return title;
}

/**
 * Extract concrete anchors (forms, accounts, dollar thresholds, time horizons)
 * from a strategy's free-text fields so generated steps reference real specifics.
 */
interface StrategyAnchors {
  forms: string[];
  accounts: string[];
  thresholds: string[];
  horizons: string[];
  taxLines: string[];
}

function extractAnchors(s: DBStrategy): StrategyAnchors {
  const corpus = [
    s.title,
    s.strategy_details,
    s.example,
    s.potential_savings_benefits,
    s.tax_return_line_or_area,
    Array.isArray(s.implementation_steps) ? JSON.stringify(s.implementation_steps) : '',
  ].filter(Boolean).join(' \n ');

  const uniq = (arr: string[]) => Array.from(new Set(arr.map(x => x.trim()).filter(x => x.length > 0))).slice(0, 4);

  const forms = uniq([
    ...(corpus.match(/\bForm\s+\d+[A-Z]?(?:-[A-Z]+)?\b/gi) || []),
    ...(corpus.match(/\bSchedule\s+[A-Z]\b/gi) || []),
    ...(corpus.match(/\bW-?[24]\b/gi) || []),
    ...(corpus.match(/\b1099(?:-[A-Z]+)?\b/gi) || []),
    ...(corpus.match(/\b1040(?:-[A-Z]+)?\b/gi) || []),
    ...(corpus.match(/\bFAFSA\b/gi) || []),
  ]);

  const accounts = uniq([
    ...(corpus.match(/\b(?:Roth\s+)?(?:IRA|401\(k\)|403\(b\)|457\(b\)|HSA|FSA|HRA|529|UTMA|UGMA|SEP\s*IRA|SIMPLE\s*IRA|Solo\s*401\(k\)|Coverdell|ABLE)\b/gi) || []),
  ]);

  const thresholds = uniq([
    ...(corpus.match(/\$[\d,]+(?:\.\d+)?\s*(?:\/\s*(?:year|month|yr|mo))?/gi) || []),
    ...(corpus.match(/\b\d{1,2}(?:\.\d+)?\s*%\b/g) || []),
  ]);

  const horizons = uniq([
    ...(corpus.match(/\b\d{1,3}\s*(?:days?|weeks?|months?|years?)\b/gi) || []),
  ]);

  const taxLines = uniq([
    ...(s.tax_return_line_or_area ? [s.tax_return_line_or_area] : []),
    ...(corpus.match(/\bIRC\s*§?\s*\d+[A-Za-z]?(?:\([a-z0-9]+\))?/gi) || []),
    ...(corpus.match(/\bSection\s+\d+[A-Za-z]?\b/gi) || []),
  ]);

  return { forms, accounts, thresholds, horizons, taxLines };
}

/** Pick a step title from a list of variants, biased by step index so the same plan reads varied. */
function pickVariant<T>(variants: T[], idx: number, salt: string): T {
  if (variants.length === 0) throw new Error('pickVariant: empty');
  // Deterministic but spread across the array using strategy id + index.
  let h = idx;
  for (let i = 0; i < salt.length; i++) h = (h * 31 + salt.charCodeAt(i)) >>> 0;
  return variants[h % variants.length];
}

/** Heuristic time estimate from instruction text. */
function pickTimeEstimate(text: string, idx: number): string {
  const low = (text || '').toLowerCase();
  if (/\b(meet|review|consult|schedule|book|advisor|cpa)\b/.test(low)) return '30-60 min';
  if (low.length > 180 || /(compare|calculate|project|model|simulate)/.test(low)) return '20-45 min';
  if (idx === 0) return '15-20 min';
  return '15-30 min';
}

/** Ensure no two adjacent step titles share their first 4 words. */
function dedupeAdjacentTitles(steps: StructuredPlanStep[]): StructuredPlanStep[] {
  const firstWords = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 4).join(' ');
  const out: StructuredPlanStep[] = [];
  let lastKey = '';
  for (const step of steps) {
    let title = step.title;
    let key = firstWords(title);
    if (key === lastKey && key.length > 0) {
      // Rewrite by appending a differentiator
      title = `Document the result of "${title.replace(/\.$/, '').slice(0, 50)}"`;
      key = firstWords(title);
    }
    out.push({ ...step, title });
    lastKey = key;
  }
  return out;
}

/**
 * Build horseman-specific concrete steps for a strategy when DB has none.
 * Steps are derived from the strategy's title + extracted anchors so they are SPECIFIC
 * and so two different strategies in the same horseman do not read identically.
 */
function buildHorsemanSpecificSteps(
  s: DBStrategy,
  horseman: string,
): StructuredPlanStep[] {
  const titleLow = s.title.replace(/\.$/, '').trim();
  const anchors = extractAnchors(s);
  const advisorByHorseman: Record<string, string> = {
    taxes: 'CPA or Enrolled Agent',
    interest: 'credit counselor or financial advisor',
    insurance: 'licensed insurance broker',
    education: '529/financial-aid advisor',
  };
  const advisor = advisorByHorseman[horseman] || 'qualified financial professional';

  const formRef = anchors.forms[0] || (horseman === 'taxes' ? 'Form 1040' : '');
  const accountRef = anchors.accounts[0] || '';
  const thresholdRef = anchors.thresholds[0] || '';
  const horizonRef = anchors.horizons[0] || '';
  const taxLineRef = anchors.taxLines[0] || '';

  const ctx = (parts: Array<string | undefined | false>) => parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

  // Variant pools per slot. Each variant references real anchors when present.
  const gatherVariants: StructuredPlanStep[] = [
    {
      title: ctx(['Pull every document needed for', titleLow]),
      instruction: ctx([`Collect`, formRef && `${formRef},`, accountRef && `${accountRef} statements,`, `and any account records relevant to "${titleLow}".`]),
      time_estimate: '15-30 min',
      done_definition: 'All documents are saved in a single folder you can hand to an advisor.',
    },
    {
      title: ctx(['Build the baseline snapshot for', titleLow]),
      instruction: ctx([`Write down today's numbers — current balance, premium, payment, or contribution — that "${titleLow}" will change.`, thresholdRef && `Capture the ${thresholdRef} reference figure.`]),
      time_estimate: '15-20 min',
      done_definition: 'You have a one-page baseline you can compare to the after-state.',
    },
    {
      title: ctx(['Inventory accounts in scope for', titleLow]),
      instruction: ctx([`List every`, accountRef || 'account', `that this strategy will touch and note who the owner / beneficiary is on each.`]),
      time_estimate: '15-30 min',
      done_definition: 'You have a written inventory of in-scope accounts with owner and balance.',
    },
  ];

  const eligibilityVariants: StructuredPlanStep[] = [
    {
      title: ctx(['Confirm you qualify for', titleLow]),
      instruction: ctx([`Verify income, filing status, and account-type rules that gate "${titleLow}".`, taxLineRef && `Cross-reference ${taxLineRef}.`]),
      time_estimate: '15-20 min',
      done_definition: 'You can state in writing that you meet every eligibility rule for this year.',
    },
    {
      title: ctx(['Verify the rules behind', titleLow]),
      instruction: ctx([`Read the current-year limits, deadlines, and contribution rules tied to "${titleLow}".`, formRef && `Reference ${formRef}.`]),
      time_estimate: '20-45 min',
      done_definition: 'You have a one-paragraph summary of the rules and where they came from.',
    },
  ];

  const projectVariants: StructuredPlanStep[] = [
    {
      title: ctx(['Project the dollar impact of', titleLow]),
      instruction: ctx([`Estimate the savings, deduction, or cash flow change "${titleLow}" should produce.`, thresholdRef && `Use ${thresholdRef} as your starting figure.`, horizonRef && `Project across ${horizonRef}.`]),
      time_estimate: '20-45 min',
      done_definition: 'You have a written before/after comparison with a dollar delta.',
    },
    {
      title: ctx(['Run the numbers before acting on', titleLow]),
      instruction: ctx([`Calculate the projected impact of "${titleLow}" — fees, taxes, and net benefit — and compare against doing nothing.`]),
      time_estimate: '20-45 min',
      done_definition: 'You have a side-by-side calculation you can defend to an advisor.',
    },
  ];

  const executeVariants: StructuredPlanStep[] = [
    {
      title: ctx(['Execute', titleLow]),
      instruction: ctx([`Submit the application, transfer, election, or filing needed to put "${titleLow}" into effect.`, formRef && `Use ${formRef}.`]),
      time_estimate: '30-60 min',
      done_definition: 'The change is confirmed in writing with a reference number or signed copy.',
    },
    {
      title: ctx(['Put', titleLow, 'into effect']),
      instruction: ctx([`Open or update`, accountRef || 'the relevant account,', `and complete every form required so "${titleLow}" actually starts.`]),
      time_estimate: '30-60 min',
      done_definition: 'Account opening or change is confirmed and the effective date is recorded.',
    },
  ];

  const reviewVariants: StructuredPlanStep[] = [
    {
      title: ctx(['Schedule a follow-up with a', advisor]),
      instruction: ctx([`Book a 30-minute review with a ${advisor} to confirm "${titleLow}" is correctly applied.`]),
      time_estimate: '15-20 min',
      done_definition: 'The review is on the calendar with all supporting documents attached.',
    },
    {
      title: ctx(['Verify', titleLow, 'is producing the expected result']),
      instruction: ctx([`Set a calendar reminder`, horizonRef ? `in ${horizonRef}` : 'in 90 days', `to re-check that the change is delivering the projected savings.`]),
      time_estimate: '15-20 min',
      done_definition: 'A check-in date is on the calendar with the expected metric to verify.',
    },
  ];

  // Salt with the strategy_id so the same strategy always renders deterministically,
  // but different strategies in the same horseman pull different variants.
  const salt = `${horseman}:${s.strategy_id}`;
  const ordered: StructuredPlanStep[] = [
    pickVariant(gatherVariants, 0, salt),
    pickVariant(eligibilityVariants, 1, salt),
    pickVariant(projectVariants, 2, salt),
    pickVariant(executeVariants, 3, salt),
    pickVariant(reviewVariants, 4, salt),
  ];

  // Apply heuristic time estimates over each step instruction (overrides the static defaults).
  const tuned = ordered.map((step, i) => ({
    ...step,
    time_estimate: pickTimeEstimate(step.instruction, i),
  }));

  return dedupeAdjacentTitles(tuned);
}

function buildStructuredPlan(
  s: DBStrategy,
  profile: any,
  primaryHorseman: string | null,
): StructuredPlan {
  // CANONICAL BINDING: horseman MUST come from the selected strategy row,
  // never from the model or the user's primary horseman.
  const horseman = (s.horseman_type || primaryHorseman || 'taxes').toLowerCase();
  const preset = HORSEMAN_PRESETS[horseman] || HORSEMAN_PRESETS.taxes;

  const cleanedDetails = cleanStrategyText(s.strategy_details);
  const cleanedExample = cleanStrategyText(s.example);
  const cleanedSavings = cleanStrategyText(s.potential_savings_benefits);

  const impactRange = s.estimated_impact_display
    ? cleanStrategyText(s.estimated_impact_display)
    : (s.estimated_impact_min != null && s.estimated_impact_max != null
        ? `$${Number(s.estimated_impact_min).toLocaleString()} - $${Number(s.estimated_impact_max).toLocaleString()} / year`
        : (cleanedSavings || 'Varies by profile'));

  // Summary: strategy-specific, 2-4 sentences, no filler.
  const summaryParts: string[] = [];
  const headline = cleanedDetails.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ').trim();
  if (headline) summaryParts.push(headline);
  if (cleanedExample) summaryParts.push(`Example: ${cleanedExample.split(/(?<=[.!?])\s+/)[0]}`);
  if (cleanedSavings && summaryParts.length < 3) summaryParts.push(`Why it matters: ${cleanedSavings.split(/(?<=[.!?])\s+/)[0]}`);
  const summary = summaryParts.join(' ').slice(0, 700) || `Apply the ${s.title} strategy to reduce the impact of the ${horseman} horseman on your finances.`;

  // STEPS: prefer DB-provided steps; otherwise build horseman-specific, action-led steps.
  const rawSteps = normalizeSteps(s.implementation_steps);
  let structuredSteps: StructuredPlanStep[];

  if (rawSteps.length >= 2) {
    const trimmed = rawSteps.slice(0, 7);
    const lastIdx = trimmed.length - 1;
    structuredSteps = trimmed.map((stepText, i) => {
      const text = cleanStrategyText(stepText);
      const fallback = `Complete step ${i + 1} of "${s.title.replace(/\.$/, '')}"`;
      const title = deriveActionTitle(text, fallback);
      return {
        title,
        instruction: text,
        time_estimate: pickTimeEstimate(text, i),
        done_definition: i === lastIdx
          ? 'Change is confirmed in writing and stored with your records.'
          : 'Action is completed and the result is captured in your plan notes.',
      };
    });
  } else {
    structuredSteps = buildHorsemanSpecificSteps(s, horseman);
  }

  // FINAL REPAIR PASS: scrub any remaining generic / truncated titles.
  const horsemanFallbacks = buildHorsemanSpecificSteps(s, horseman);
  structuredSteps = structuredSteps.map((step, i) => {
    if (isGenericTitle(step.title)) {
      const replacement = horsemanFallbacks[i] || horsemanFallbacks[horsemanFallbacks.length - 1];
      return { ...replacement, instruction: step.instruction || replacement.instruction };
    }
    return step;
  });

  // Ensure at least 2 steps (schema rule), pad with horseman-specific extras.
  while (structuredSteps.length < 2) {
    structuredSteps.push(horsemanFallbacks[structuredSteps.length] || horsemanFallbacks[0]);
  }

  // Dedupe adjacent step titles so the plan does not read repetitive.
  structuredSteps = dedupeAdjacentTitles(structuredSteps);

  return {
    plan_schema: 'v1',
    strategy_id: s.strategy_id,        // CANONICAL
    strategy_name: s.title,            // CANONICAL
    horseman,                          // CANONICAL
    summary,
    expected_result: {
      impact_range: impactRange,
      first_win_timeline: preset.firstWin,
      confidence_note: preset.confidence,
    },
    before_you_start: preset.before,
    steps: structuredSteps,
    risks_and_mistakes_to_avoid: preset.risks,
    advisor_packet: preset.packet,
    disclaimer: 'Educational information only. Consult a qualified professional before implementation.',
  };
}

/** Embed structured plan as a hidden JSON code block the frontend can parse. */
function embedPlanJson(plan: StructuredPlan): string {
  return `\n\n\`\`\`json\n${JSON.stringify(plan, null, 2)}\n\`\`\``;
}

function formatStrategiesCondensed(strategies: DBStrategy[]): string {
  if (strategies.length === 0) return "No strategies matched.";
  return strategies.map(s =>
    `### ${s.strategy_id}: ${s.title}
- Horseman: ${s.horseman_type}
- Summary: ${s.strategy_details}
- Impact: ${s.estimated_impact_display || 'Varies'}
- Difficulty: ${s.difficulty}
- Best For: ${(s.goal_tags || []).join(', ') || 'General'}`
  ).join('\n\n');
}

function formatStrategyFull(s: DBStrategy): string {
  const steps = Array.isArray(s.implementation_steps) ? s.implementation_steps : [];
  const stepsStr = steps.length > 0
    ? steps.map((step: any, i: number) => `  ${i + 1}. ${typeof step === 'string' ? step : step?.text || step?.step || JSON.stringify(step)}`).join('\n')
    : '  (No detailed steps available)';
  
  return `### ${s.strategy_id}: ${s.title}
- **Horseman:** ${s.horseman_type}
- **Summary:** ${s.strategy_details}
- **Potential Savings / Benefits:** ${s.potential_savings_benefits || 'Varies by profile'}
- **Estimated Impact:** ${s.estimated_impact_display || 'Varies'}
- **Difficulty:** ${s.difficulty}
- **Tax Reference:** ${s.tax_return_line_or_area || 'N/A'}
- **Financial Goals:** ${(s.goal_tags || []).join(', ') || 'General'}
- **Implementation Steps:**
${stepsStr}`;
}

// =====================================================
// PROMPT TEMPLATE FETCHING
// =====================================================

const FALLBACK_SYSTEM_PROMPT = `You are an expert RPRx financial strategy assistant.

## YOUR WORKFLOW
1. Greet the user and explain you help reduce the impact of the Four Horsemen (Interest, Taxes, Insurance, Education) on their finances.
2. Ask intake questions one at a time to understand their situation.
3. Recommend the most relevant strategies from those provided to you.
4. Present strategies in a clear numbered list format.
5. Offer detailed implementation plans for strategies they select.
6. Always include disclaimers and refer to rprx4life.com for professional guidance.

## STRATEGY OUTPUT FORMAT
When presenting strategies, use numbered list format.

## GUARDRAILS
- Do not provide tax/legal advice - only educational information
- Do not promise results or guaranteed savings

## DISCLAIMER
This is educational information only. Always consult a qualified professional. Visit rprx4life.com for personalized guidance.`;

async function fetchPromptTemplate(serviceClient: any, templateId: string): Promise<string | null> {
  try {
    const { data, error } = await serviceClient
      .from('prompt_templates')
      .select('content')
      .eq('id', templateId)
      .maybeSingle();
    if (error || !data) return null;
    return data.content;
  } catch {
    return null;
  }
}

// =====================================================
// KNOWLEDGE BASE FETCHING (scoped retrieval)
// =====================================================

interface KBRow { name: string; content: string }
interface KBSection { source: string; heading: string; body: string }

async function fetchKnowledgeBaseRows(serviceClient: any): Promise<KBRow[]> {
  try {
    const { data, error } = await serviceClient
      .from('knowledge_base')
      .select('name, content')
      .eq('is_active', true)
      .not('content', 'eq', '');
    if (error || !data) return [];
    return data as KBRow[];
  } catch {
    return [];
  }
}

/** Split a KB document into ## / ### sections with their headings preserved. */
function splitKBIntoSections(row: KBRow): KBSection[] {
  const lines = (row.content || '').split('\n');
  const sections: KBSection[] = [];
  let heading = row.name;
  let buffer: string[] = [];
  const flush = () => {
    const body = buffer.join('\n').trim();
    if (body.length > 20) sections.push({ source: row.name, heading, body });
    buffer = [];
  };
  for (const line of lines) {
    const m = line.match(/^\s{0,3}(#{2,3})\s+(.+?)\s*$/);
    if (m) {
      flush();
      heading = m[2].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  if (sections.length === 0 && (row.content || '').trim().length > 0) {
    sections.push({ source: row.name, heading: row.name, body: row.content.trim() });
  }
  return sections;
}

/** Token overlap score between section text and a query token bag. */
function scoreSectionRelevance(section: KBSection, queryTokens: Set<string>): number {
  if (queryTokens.size === 0) return 0;
  const haystack = `${section.heading} ${section.body}`.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (!token) continue;
    if (haystack.includes(token)) score += token.length >= 6 ? 2 : 1;
  }
  // Heading bonus
  const headingLow = section.heading.toLowerCase();
  for (const token of queryTokens) {
    if (token && headingLow.includes(token)) score += 2;
  }
  return score;
}

function tokenizeForKB(input: string): string[] {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !KB_STOPWORDS.has(t));
}

const KB_STOPWORDS = new Set([
  'the','and','for','with','your','you','this','that','from','into','have','will','are','was',
  'can','any','all','use','has','our','out','not','but','one','two','more','than','their','they',
  'how','who','why','what','when','where','who','also','about','over','under','then','these','those',
  'each','some','many','most','other','onto','only','every','same','strategy','plan',
]);

/** Build a scoped knowledge-base context block for the selected strategy and horseman. */
function buildScopedKnowledgeContext(
  rows: KBRow[],
  ctx: { horseman: string | null; strategy: DBStrategy | null },
  opts: { topN?: number; charBudget?: number } = {},
): string {
  if (!rows || rows.length === 0) return '';
  const topN = opts.topN ?? 3;
  const charBudget = opts.charBudget ?? 4000;

  const queryParts: string[] = [];
  if (ctx.horseman) queryParts.push(ctx.horseman);
  if (ctx.strategy) {
    queryParts.push(ctx.strategy.title || '');
    queryParts.push(ctx.strategy.tax_return_line_or_area || '');
    if (Array.isArray(ctx.strategy.goal_tags)) queryParts.push(ctx.strategy.goal_tags.join(' '));
  }
  const queryTokens = new Set(tokenizeForKB(queryParts.join(' ')));

  const allSections: KBSection[] = rows.flatMap(splitKBIntoSections);
  if (allSections.length === 0) return '';

  // If no query tokens, fall back to first section of each source (legacy-ish behaviour but capped).
  let scored: { section: KBSection; score: number }[];
  if (queryTokens.size === 0) {
    scored = allSections.slice(0, topN).map(s => ({ section: s, score: 0 }));
  } else {
    scored = allSections
      .map(section => ({ section, score: scoreSectionRelevance(section, queryTokens) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  if (scored.length === 0) return '';

  const blocks: string[] = [];
  let used = 0;
  for (const { section } of scored) {
    const text = section.body.length > 1500 ? section.body.slice(0, 1500) + '…' : section.body;
    const block = `### ${section.source} — ${section.heading}\n${text}`;
    if (used + block.length > charBudget && blocks.length > 0) break;
    blocks.push(block);
    used += block.length;
  }

  return '\n## KNOWLEDGE BASE (scoped)\n' + blocks.join('\n\n');
}

// =====================================================
// INTAKE PHASE DETECTION
// =====================================================

function isIntakePhase(messages: Array<{role: string, content: string}>): boolean {
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (firstUserMsg) {
    const content = firstUserMsg.content;
    if (
      content.includes('## My Assessment Results') ||
      content.includes('## My Profile') ||
      content.includes('top 3 financial strategies') ||
      content.includes('step-by-step implementation plans')
    ) {
      return false;
    }
  }
  if (messages.length < 6) return true;
  const conversationText = messages.map(m => m.content).join(' ').toLowerCase();
  const hasProfileType = /business owner|retiree|salesperson|wage earner|investor|farmer|non-profit|grandparent/i.test(conversationText);
  const hasIncomeInfo = /\$[\d,]+|\d+k|100k|200k|250k|500k|1m|\bincome\b/i.test(conversationText);
  const hasGoals = /cash flow|reduce tax|education|retirement|insurance cost|save money|lower taxes/i.test(conversationText);
  return !(hasProfileType && hasIncomeInfo && hasGoals);
}

// =====================================================
// PROFILE CONTEXT BUILDER
// =====================================================

const profileTypeLabels: Record<string, string> = {
  'business_owner': 'Business Owner',
  'retiree': 'Retiree / Grandparent',
  'salesperson': 'Salesperson',
  'wage_earner': 'Wage Earner',
  'investor': 'Investor',
  'farmer': 'Farmer',
  'nonprofit': 'Non-Profit'
};

const goalLabels: Record<string, string> = {
  'increase_cash_flow': 'Increase Cash Flow',
  'reduce_taxes': 'Reduce Taxes',
  'save_for_education': 'Save for Education',
  'improve_retirement': 'Improve Retirement',
  'reduce_insurance_costs': 'Reduce Insurance Costs',
  'large_purchase': 'Large Purchase or Investment'
};

const filingStatusLabels: Record<string, string> = {
  'single': 'Single',
  'married_jointly': 'Married Filing Jointly',
  'married_separately': 'Married Filing Separately',
  'head_of_household': 'Head of Household',
  'qualifying_surviving_spouse': 'Qualifying Surviving Spouse'
};

function buildProfileContext(profile: any): { context: string; missingFields: string[]; cashFlowStatus: string | null; profileTypes: string[]; financialGoals: string[] } {
  const missingFields: string[] = [];
  let cashFlowStatus: string | null = null;
  let profileTypes: string[] = [];
  let financialGoals: string[] = [];

  if (!profile) {
    return { context: '', missingFields: ['All profile data'], cashFlowStatus: null, profileTypes: [], financialGoals: [] };
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const knownDataSections: string[] = [];

  // Profile type
  if (profile.profile_type) {
    const types = Array.isArray(profile.profile_type) ? profile.profile_type : [profile.profile_type];
    profileTypes = types;
    const labels = types.map((t: string) => profileTypeLabels[t] || t);
    knownDataSections.push(`- **Profile Type:** ${labels.join(', ')}`);
  } else {
    missingFields.push('Profile type');
  }

  // Filing status
  if (profile.filing_status) {
    knownDataSections.push(`- **Filing Status:** ${filingStatusLabels[profile.filing_status] || profile.filing_status}`);
  } else {
    missingFields.push('Filing status');
  }

  // Children info
  if (profile.num_children !== null && profile.num_children > 0) {
    const ages = profile.children_ages?.length > 0 ? ` (ages: ${profile.children_ages.join(', ')})` : '';
    knownDataSections.push(`- **Children:** ${profile.num_children}${ages}`);
  } else if (profile.num_children === 0) {
    knownDataSections.push(`- **Children:** None`);
  } else {
    missingFields.push('Number and ages of children');
  }

  // Financial goals
  if (profile.financial_goals?.length > 0) {
    financialGoals = profile.financial_goals;
    const goalNames = profile.financial_goals.map((g: string) => goalLabels[g] || g).join(', ');
    knownDataSections.push(`- **Financial Goals:** ${goalNames}`);
  } else {
    missingFields.push('Primary financial goals');
  }

  // Cash flow data
  if (profile.monthly_income) {
    const income = Number(profile.monthly_income) || 0;
    const debtPayments = Number(profile.monthly_debt_payments) || 0;
    const housing = Number(profile.monthly_housing) || 0;
    const insurance = Number(profile.monthly_insurance) || 0;
    const living = Number(profile.monthly_living_expenses) || 0;
    const totalExpenses = debtPayments + housing + insurance + living;
    const surplus = income - totalExpenses;
    const ratio = totalExpenses > 0 ? income / totalExpenses : 1;

    if (ratio > 1.2) cashFlowStatus = 'surplus';
    else if (ratio < 1) cashFlowStatus = 'deficit';
    else cashFlowStatus = 'tight';

    const statusLabel = ratio > 1.2 ? 'Healthy Surplus' : ratio < 1 ? 'Cash Flow Pressure (Deficit)' : 'Tight Balance';
    knownDataSections.push(`- **Monthly Income:** ${formatCurrency(income)}`);
    knownDataSections.push(`- **Monthly Expenses:** ${formatCurrency(totalExpenses)}`);
    knownDataSections.push(`  - Debt Payments: ${formatCurrency(debtPayments)}`);
    knownDataSections.push(`  - Housing: ${formatCurrency(housing)}`);
    knownDataSections.push(`  - Insurance: ${formatCurrency(insurance)}`);
    knownDataSections.push(`  - Living Expenses: ${formatCurrency(living)}`);
    knownDataSections.push(`- **Monthly ${surplus >= 0 ? 'Surplus' : 'Deficit'}:** ${formatCurrency(Math.abs(surplus))}`);
    knownDataSections.push(`- **Cash Flow Status:** ${statusLabel}`);
  } else {
    missingFields.push('Income and expense information');
  }

  // Retirement data
  if (profile.years_until_retirement != null) {
    knownDataSections.push(`- **Years Until Retirement:** ${profile.years_until_retirement}`);
  }
  if (profile.desired_retirement_income != null) {
    knownDataSections.push(`- **Desired Retirement Income:** ${formatCurrency(Number(profile.desired_retirement_income))}`);
  }
  if (profile.retirement_balance_total != null) {
    knownDataSections.push(`- **Current Retirement Balance:** ${formatCurrency(Number(profile.retirement_balance_total))}`);
  }
  if (profile.retirement_contribution_monthly != null) {
    knownDataSections.push(`- **Monthly Retirement Contribution:** ${formatCurrency(Number(profile.retirement_contribution_monthly))}`);
  }

  // Insurance coverage
  const insuranceCoverage: string[] = [];
  if (profile.health_insurance) insuranceCoverage.push('Health');
  if (profile.life_insurance) insuranceCoverage.push('Life');
  if (profile.disability_insurance) insuranceCoverage.push('Disability');
  if (profile.long_term_care_insurance) insuranceCoverage.push('Long-Term Care');
  if (insuranceCoverage.length > 0) {
    knownDataSections.push(`- **Insurance Coverage:** ${insuranceCoverage.join(', ')}`);
  }
  const missingInsurance: string[] = [];
  if (!profile.health_insurance) missingInsurance.push('Health');
  if (!profile.life_insurance) missingInsurance.push('Life');
  if (!profile.disability_insurance) missingInsurance.push('Disability');
  if (!profile.long_term_care_insurance) missingInsurance.push('Long-Term Care');
  if (missingInsurance.length > 0) {
    knownDataSections.push(`- **Missing Insurance:** ${missingInsurance.join(', ')}`);
  }

  // RPRx Score & Grade
  if (profile.rprx_score_total != null) {
    knownDataSections.push(`- **RPRx Score:** ${Number(profile.rprx_score_total).toFixed(0)}/100`);
  }
  if (profile.rprx_grade) {
    const gradeLabels: Record<string, string> = { at_risk: 'At Risk', emerging: 'Emerging', progressing: 'Progressing', optimized: 'Optimized' };
    knownDataSections.push(`- **RPRx Grade:** ${gradeLabels[profile.rprx_grade] || profile.rprx_grade}`);
  }

  // Money Leak Estimate
  const leakLow = Number(profile.estimated_annual_leak_low) || 0;
  const leakHigh = Number(profile.estimated_annual_leak_high) || 0;
  if (leakLow > 0 || leakHigh > 0) {
    knownDataSections.push(`- **Estimated Annual Money Leak:** ${formatCurrency(leakLow)} – ${formatCurrency(leakHigh)}`);
    const recovered = Number(profile.estimated_annual_leak_recovered) || 0;
    if (recovered > 0) {
      knownDataSections.push(`- **Money Leak Already Recovered:** ${formatCurrency(recovered)}`);
    }
  }

  // Build context string
  let context = '';
  if (knownDataSections.length > 0) {
    context = `
## USER PROFILE (Pre-filled - Do NOT ask about these topics)
${profile.full_name ? `- **Name:** ${profile.full_name}` : ''}
${knownDataSections.join('\n')}

**IMPORTANT:** This information is already known from the user's profile. Do NOT ask questions about these topics.

`;
  }

  if (missingFields.length > 0) {
    context += `
## STILL NEEDED (Ask about these)
${missingFields.map(f => `- ${f}`).join('\n')}

`;
  }

  return { context, missingFields, cashFlowStatus, profileTypes, financialGoals };
}

// =====================================================
// FREE-TIER TEMPLATE RESPONSE ENGINE
// =====================================================

type ChatIntent = 'greeting' | 'recommend' | 'horseman_filter' | 'detail' | 'profile' | 'auto' | 'fallback';

function detectIntent(message: string, history: Array<{role: string; content: string}>): ChatIntent {
  const lower = message.toLowerCase().trim();

  // Auto-mode markers
  if (lower.includes('## my assessment results') || lower.includes('## my profile') ||
      lower.includes('top 3 financial strategies') || lower.includes('step-by-step implementation plan')) {
    return 'auto';
  }

  // "Show more" — inherit prior intent/filter from last assistant message
  if (/^(show\s+more|more|next( page)?|see more|continue)\b/.test(lower) && lower.length < 30) {
    const lastAssistant = [...history].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
      const ac = lastAssistant.content.toLowerCase();
      if (ac.includes('strategies for tax') || ac.includes('strategies for interest') ||
          ac.includes('strategies for debt') || ac.includes('strategies for insurance') ||
          ac.includes('strategies for education')) {
        return 'horseman_filter';
      }
    }
    return 'recommend';
  }

  // Greetings
  if (/^(hi|hello|hey|help|start|good morning|good afternoon)\b/i.test(lower) && lower.length < 40) {
    return 'greeting';
  }

  // Detail request — "tell me more", "how do I", "steps for", strategy IDs
  if (/\b(how do i|how to|tell me more|steps|implement|details?|explain|plan for)\b/.test(lower) ||
      /\b[TIE](?:N)?-\d+\b/i.test(lower)) {
    return 'detail';
  }

  // Horseman-specific filter
  if (/\b(tax|taxes|taxation)\b/.test(lower) && !/\b(interest|insurance|education)\b/.test(lower)) return 'horseman_filter';
  if (/\b(interest|debt)\b/.test(lower) && !/\b(tax|insurance|education)\b/.test(lower)) return 'horseman_filter';
  if (/\binsurance\b/.test(lower) && !/\b(tax|interest|education)\b/.test(lower)) return 'horseman_filter';
  if (/\beducation\b/.test(lower) && !/\b(tax|interest|insurance)\b/.test(lower)) return 'horseman_filter';

  // Profile inquiry
  if (/\b(my situation|my score|my profile|my finances|my data)\b/.test(lower)) return 'profile';

  // Recommendation request
  if (/\b(recommend|suggest|strategy|strategies|what should|best|options?)\b/.test(lower)) return 'recommend';

  return 'fallback';
}

const HORSEMAN_DISPLAY: Record<string, string> = {
  interest: 'Interest & Debt',
  taxes: 'Tax Efficiency',
  insurance: 'Insurance & Protection',
  education: 'Education Funding',
};

function generateTemplateResponse(
  intent: ChatIntent,
  ranked: ScoredStrategy[],
  profile: any,
  primaryHorseman: string | null,
  mode: 'auto' | 'manual',
  userMessage: string,
  pageNum: number = 1,
): string {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const profileName = profile?.full_name ? `, ${profile.full_name}` : '';
  const horsemanLabel = HORSEMAN_DISPLAY[primaryHorseman || 'interest'] || 'Financial Strategy';
  const disclaimer = '\n\n---\n*This is educational information only. Always consult a qualified professional before implementing any strategy. Visit [rprx4life.com](https://rprx4life.com) for guidance.*';

  // Helper: format a single strategy as a numbered section
  const formatStrategyBlock = (s: DBStrategy, idx: number) => {
    const cleanedSteps = normalizeSteps(s.implementation_steps);
    const stepsStr = cleanedSteps.length > 0
      ? cleanedSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')
      : '';
    return `## ${idx}. ${s.title} (${s.strategy_id})
**Horseman:** ${HORSEMAN_DISPLAY[s.horseman_type] || s.horseman_type} | **Impact:** ${cleanStrategyText(s.estimated_impact_display) || 'Varies'} | **Difficulty:** ${s.difficulty}

${cleanStrategyText(s.strategy_details)}${stepsStr ? `\n\n**Implementation Steps:**\n${stepsStr}` : ''}`;
  };

  // ----- AUTO mode: single best strategy with full steps -----
  if (intent === 'auto' || mode === 'auto') {
    const top = ranked[0];
    if (!top) {
      return embedPlanJson({
        plan_schema: 'v1',
        strategy_id: 'no_matching_strategy',
        strategy_name: 'No matching strategy found',
        horseman: primaryHorseman || 'interest',
        summary: 'No active strategy matched the current request and profile context. Complete or update your assessment, then try again.',
        expected_result: { impact_range: 'N/A', first_win_timeline: 'N/A', confidence_note: 'No strategy was selected.' },
        before_you_start: ['Review your assessment and profile details.'],
        steps: [
          { title: 'Review your assessment context', instruction: 'Confirm your primary financial pressure and profile details are current.', time_estimate: '15-20 min', done_definition: 'Assessment and profile context are up to date.' },
          { title: 'Request a new strategy', instruction: 'Ask for a strategy after your context is updated.', time_estimate: '15-20 min', done_definition: 'A new strategy request has been submitted.' },
        ],
        risks_and_mistakes_to_avoid: ['Do not act on a strategy that does not match your situation.'],
        advisor_packet: ['Current profile and assessment summary.'],
        disclaimer: 'Educational information only. Consult a qualified professional before implementation.',
      }).trim();
    }
    const structured = buildStructuredPlan(top.strategy, profile, primaryHorseman);
    const assertionErrors = assertPlanMatchesStrategy(structured, top.strategy);
    if (assertionErrors.length > 0) {
      console.error(`Canonical plan assertion failed | selected_strategy_id=${top.strategy.strategy_id} | errors=${JSON.stringify(assertionErrors)}`);
      throw new Error('Canonical strategy plan mismatch');
    }
    return embedPlanJson(structured).trim();
  }

  // ----- GREETING -----
  if (intent === 'greeting') {
    const top = ranked[0];
    const topTeaser = top ? `\n\nBased on your profile, your top recommended strategy is **${top.strategy.title}**. Would you like to see the details?` : '';
    return `# Welcome to RPRx Strategy Assistant${profileName}! 👋

I can help you explore strategies across the Four Horsemen of household finance — **Interest, Taxes, Insurance, and Education**.

Here's what I can do:
- 📋 **Recommend** personalized strategies based on your profile
- 🔍 **Explain** any strategy in detail with implementation steps
- 💡 **Filter** by a specific horseman (e.g., "show me tax strategies")
- 📊 **Summarize** your financial profile${topTeaser}${disclaimer}`;
  }

  // ----- RECOMMEND: top 5 (paginated) -----
  if (intent === 'recommend') {
    const startIdx = (pageNum - 1) * 5;
    const endIdx = startIdx + 5;
    const pageItems = ranked.slice(startIdx, endIdx);
    if (pageItems.length === 0) {
      return pageNum === 1
        ? `I don't have matching strategies for your profile yet. Please complete the assessment first.${disclaimer}`
        : `No more strategies to show — you've reached the end of the list.${disclaimer}`;
    }
    const hasMore = endIdx < ranked.length;
    const startNum = startIdx + 1;

    const profileLine = pageNum === 1 && profile?.profile_type
      ? `Based on your profile as a **${(Array.isArray(profile.profile_type) ? profile.profile_type : [profile.profile_type]).map((t: string) => profileTypeLabels[t] || t).join(', ')}** with a primary focus on **${horsemanLabel}**:\n\n`
      : '';

    const moreHint = hasMore
      ? `\n\n_Showing ${startNum}–${startIdx + pageItems.length} of ${ranked.length}. **Type "show more" to see additional strategies.**_`
      : `\n\n_Showing ${startNum}–${startIdx + pageItems.length} of ${ranked.length}. End of list._`;

    return `# Your Top Recommended Strategies${pageNum > 1 ? ` (Page ${pageNum})` : ''}

${profileLine}${pageItems.map((s, i) => formatStrategyBlock(s.strategy, startNum + i)).join('\n\n')}${moreHint}

Would you like a detailed implementation plan for any of these strategies? Just ask about one by name or ID.${disclaimer}`;
  }

  // ----- HORSEMAN FILTER (top 5, paginated) -----
  if (intent === 'horseman_filter') {
    const msgLower = userMessage.toLowerCase();
    let filterHorseman = primaryHorseman || 'interest';
    if (/\b(tax|taxes|taxation)\b/.test(msgLower)) filterHorseman = 'taxes';
    else if (/\b(interest|debt)\b/.test(msgLower)) filterHorseman = 'interest';
    else if (/\binsurance\b/.test(msgLower)) filterHorseman = 'insurance';
    else if (/\beducation\b/.test(msgLower)) filterHorseman = 'education';

    const filteredAll = ranked.filter(s => s.strategy.horseman_type === filterHorseman);
    const startIdx = (pageNum - 1) * 5;
    const endIdx = startIdx + 5;
    const pageItems = filteredAll.slice(startIdx, endIdx);

    if (filteredAll.length === 0) {
      const anyFiltered = ranked.slice(0, 5);
      return `# Strategies for ${HORSEMAN_DISPLAY[filterHorseman] || filterHorseman}

I don't have specific ${filterHorseman} strategies matching your profile yet, but here are your top overall recommendations:

${anyFiltered.map((s, i) => formatStrategyBlock(s.strategy, i + 1)).join('\n\n')}${disclaimer}`;
    }
    if (pageItems.length === 0) {
      return `No more ${HORSEMAN_DISPLAY[filterHorseman] || filterHorseman} strategies to show — you've reached the end of the list.${disclaimer}`;
    }
    const hasMore = endIdx < filteredAll.length;
    const startNum = startIdx + 1;
    const moreHint = hasMore
      ? `\n\n_Showing ${startNum}–${startIdx + pageItems.length} of ${filteredAll.length}. **Type "show more" to see additional strategies.**_`
      : `\n\n_Showing ${startNum}–${startIdx + pageItems.length} of ${filteredAll.length}. End of list._`;

    return `# Strategies for ${HORSEMAN_DISPLAY[filterHorseman] || filterHorseman}${pageNum > 1 ? ` (Page ${pageNum})` : ''}

${pageItems.map((s, i) => formatStrategyBlock(s.strategy, startNum + i)).join('\n\n')}${moreHint}

Would you like implementation details for any of these?${disclaimer}`;
  }

  // ----- DETAIL: strategy deep-dive -----
  if (intent === 'detail') {
    // Try to match a strategy ID from the user message
    const idMatch = userMessage.match(/\b([TIE](?:N)?-\d+)\b/i);
    let target = ranked[0]; // default to top
    if (idMatch) {
      const found = ranked.find(s => s.strategy.strategy_id.toLowerCase() === idMatch[1].toLowerCase());
      if (found) target = found;
    } else {
      // Try matching by strategy name substring
      const msgLower = userMessage.toLowerCase();
      const nameMatch = ranked.find(s => msgLower.includes(s.strategy.title.toLowerCase().substring(0, 20)));
      if (nameMatch) target = nameMatch;
    }
    if (!target) return `I couldn't find a matching strategy. Try asking me to "recommend strategies" first.${disclaimer}`;

    const structuredDetail = buildStructuredPlan(target.strategy, profile, primaryHorseman);
    return `# Implementation Plan: ${target.strategy.title}

${formatStrategyBlock(target.strategy, 1)}

${target.strategy.tax_return_line_or_area ? `**Tax Return Reference:** ${target.strategy.tax_return_line_or_area}\n` : ''}
Would you like to save this as your active implementation plan?${disclaimer}${embedPlanJson(structuredDetail)}`;
  }

  // ----- PROFILE summary -----
  if (intent === 'profile') {
    if (!profile) return `I don't have your profile data yet. Please complete the Profile Wizard first.${disclaimer}`;

    const sections: string[] = [];
    if (profile.full_name) sections.push(`**Name:** ${profile.full_name}`);
    if (profile.profile_type) {
      const types = Array.isArray(profile.profile_type) ? profile.profile_type : [profile.profile_type];
      sections.push(`**Profile Type:** ${types.map((t: string) => profileTypeLabels[t] || t).join(', ')}`);
    }
    if (profile.filing_status) sections.push(`**Filing Status:** ${filingStatusLabels[profile.filing_status] || profile.filing_status}`);
    if (profile.monthly_income) sections.push(`**Monthly Income:** ${formatCurrency(Number(profile.monthly_income))}`);
    if (profile.rprx_score_total != null) sections.push(`**RPRx Score:** ${Number(profile.rprx_score_total).toFixed(0)}/100`);
    if (profile.rprx_grade) {
      const gradeLabels: Record<string, string> = { at_risk: 'At Risk', emerging: 'Emerging', progressing: 'Progressing', optimized: 'Optimized' };
      sections.push(`**RPRx Grade:** ${gradeLabels[profile.rprx_grade] || profile.rprx_grade}`);
    }
    const leakLow = Number(profile.estimated_annual_leak_low) || 0;
    const leakHigh = Number(profile.estimated_annual_leak_high) || 0;
    if (leakLow > 0 || leakHigh > 0) {
      sections.push(`**Estimated Annual Money Leak:** ${formatCurrency(leakLow)} – ${formatCurrency(leakHigh)}`);
    }

    const top = ranked[0];
    return `# Your Financial Profile Summary

${sections.map(s => `- ${s}`).join('\n')}

${primaryHorseman ? `**Primary Horseman:** ${HORSEMAN_DISPLAY[primaryHorseman]}` : ''}

${top ? `**Top Recommended Strategy:** ${top.strategy.title} (${top.strategy.strategy_id})` : ''}

Would you like to explore your recommended strategies?${disclaimer}`;
  }

  // ----- FALLBACK -----
  const top = ranked[0];
  const topHint = top ? `\n\nYour top recommended strategy is **${top.strategy.title}**. Would you like to see the details or get other recommendations?` : '';
  return `I can help you with:\n- **Strategy recommendations** based on your profile\n- **Detailed implementation plans** for any strategy\n- **Horseman-specific** strategies (taxes, interest, insurance, education)\n- **Your profile summary** and RPRx score${topHint}${disclaimer}`;
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startedAt = Date.now();
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User-scoped client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Service-role client for reading strategies & prompt templates
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    // Parse and validate request
    let validatedInput;
    try {
      const rawBody = await req.json();
      validatedInput = requestSchema.parse(rawBody);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: 'Invalid input', details: err.errors[0]?.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { conversation_id, user_message, mode: requestMode, page: requestPage } = validatedInput;
    let conversationId = conversation_id;

    // Create conversation if needed
    if (!conversationId) {
      const title = user_message.length > 50 ? user_message.substring(0, 47) + '...' : user_message;
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: userId, title })
        .select()
        .single();
      if (convError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      conversationId = newConv.id;
    }

    // Parallel: save message, fetch history, fetch profile, fetch strategies, fetch completed strategies, fetch prompt templates
    const [saveResult, historyResult, profileResult, strategiesResult, completedResult, activeResult, systemPromptResult, autoPromptResult, manualPromptResult, assessmentResult, knowledgeBaseRows] = await Promise.all([
      supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: user_message.trim(),
      }),
      supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('profiles')
        .select('full_name, monthly_income, monthly_debt_payments, monthly_housing, monthly_insurance, monthly_living_expenses, profile_type, num_children, children_ages, financial_goals, filing_status, years_until_retirement, desired_retirement_income, retirement_balance_total, retirement_contribution_monthly, health_insurance, life_insurance, disability_insurance, long_term_care_insurance, rprx_score_total, rprx_grade, estimated_annual_leak_low, estimated_annual_leak_high, estimated_annual_leak_recovered')
        .eq('id', userId)
        .maybeSingle(),
      fetchStrategies(serviceClient),
      supabase
        .from('saved_plans')
        .select('strategy_id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      supabase
        .from('user_active_strategies')
        .select('strategy_id, status')
        .eq('user_id', userId),
      fetchPromptTemplate(serviceClient, 'system_prompt'),
      fetchPromptTemplate(serviceClient, 'auto_mode_instructions'),
      fetchPromptTemplate(serviceClient, 'manual_mode_instructions'),
      supabase
        .from('user_assessments')
        .select('primary_horseman, interest_score, taxes_score, insurance_score, education_score')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1),
      fetchKnowledgeBaseRows(serviceClient),
    ]);

    if (saveResult.error) {
      console.error('Failed to save message:', JSON.stringify(saveResult.error), 'conversationId:', conversationId, 'userId:', userId);
      return new Response(
        JSON.stringify({ error: 'Failed to save message', details: saveResult.error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (historyResult.error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch conversation history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messages = [...(historyResult.data || [])].reverse();
    messages.push({ role: 'user', content: user_message.trim() });

    const allStrategies = filterCatalogIntegrity(strategiesResult.strategies);
    const strategySource: StrategySource = strategiesResult.source;
    if (strategySource === 'none') {
      return new Response(
        JSON.stringify({ error: 'Strategy catalog unavailable', details: strategiesResult.error || 'No strategies returned' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const completedFromPlans = (completedResult.data || [])
      .map((p: any) => p.strategy_id)
      .filter(Boolean);
    const completedFromActive = (activeResult.data || [])
      .filter((r: any) => r.status === 'completed')
      .map((r: any) => r.strategy_id)
      .filter(Boolean);
    const activeStrategyIds = (activeResult.data || [])
      .filter((r: any) => r.status === 'active')
      .map((r: any) => r.strategy_id)
      .filter(Boolean);
    const completedStrategyIds = Array.from(new Set([...completedFromPlans, ...completedFromActive]));

    // Build profile context
    const profile = profileResult.data;
    const { context: profileContext, cashFlowStatus, profileTypes, financialGoals } = buildProfileContext(profile);

    // Determine subscription tier from DB
    const { data: userTier } = await serviceClient.rpc('get_subscription_tier', { _user_id: userId });
    const isFreeUser = (userTier || 'free') === 'free';
    console.log('User subscription tier:', userTier || 'free');

    // Detect "show more" / pagination continuation — inherit horseman filter from prior assistant message
    const trimmedLower = user_message.toLowerCase().trim();
    const isShowMore = /^(show\s+more|more|next( page)?|see more|continue)\b/.test(trimmedLower) && trimmedLower.length < 30;
    let inheritedHorseman: string | null = null;
    let inheritedPage = 1;
    if (isShowMore) {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistant) {
        const ac = lastAssistant.content.toLowerCase();
        if (ac.includes('strategies for tax')) inheritedHorseman = 'taxes';
        else if (ac.includes('strategies for interest') || ac.includes('strategies for debt')) inheritedHorseman = 'interest';
        else if (ac.includes('strategies for insurance')) inheritedHorseman = 'insurance';
        else if (ac.includes('strategies for education')) inheritedHorseman = 'education';
        // Parse current page from prior "Showing X–Y of Z" footer
        const pageMatch = lastAssistant.content.match(/Showing\s+\d+[–-](\d+)\s+of\s+\d+/i);
        if (pageMatch) {
          const lastShown = parseInt(pageMatch[1], 10);
          inheritedPage = Math.floor(lastShown / 5) + 1;
        }
      }
    }

    // Detect explicit horseman-filter intent in the user message
    // (e.g. "show me tax strategies", "list insurance options", "education strategies")
    const msgLowerForFilter = user_message.toLowerCase();
    let requestedHorsemanFilter: string | null = inheritedHorseman;
    if (!requestedHorsemanFilter) {
      if (/\b(tax|taxes|taxation)\b/.test(msgLowerForFilter) && !/\b(interest|debt|insurance|education)\b/.test(msgLowerForFilter)) {
        requestedHorsemanFilter = 'taxes';
      } else if (/\binsurance\b/.test(msgLowerForFilter) && !/\b(tax|interest|debt|education)\b/.test(msgLowerForFilter)) {
        requestedHorsemanFilter = 'insurance';
      } else if (/\beducation\b/.test(msgLowerForFilter) && !/\b(tax|interest|debt|insurance)\b/.test(msgLowerForFilter)) {
        requestedHorsemanFilter = 'education';
      } else if (/\b(interest|debt)\b/.test(msgLowerForFilter) && !/\b(tax|insurance|education)\b/.test(msgLowerForFilter)) {
        requestedHorsemanFilter = 'interest';
      }
      const looksLikeStrategyList = /\b(show|list|see|view|give|browse|explore|what|which)\b.*\bstrateg/i.test(user_message)
        || /\bstrategies?\b/i.test(user_message);
      if (requestedHorsemanFilter && !looksLikeStrategyList) {
        requestedHorsemanFilter = null;
      }
    }

    // Determine mode — free users always get auto mode, EXCEPT when the user
    // explicitly asks for a horseman-filtered strategy list or paginates with "show more".
    const isAutoMode =
      !requestedHorsemanFilter && !isShowMore &&
      (isFreeUser || requestMode === 'auto' ||
        user_message.includes('## My Assessment Results') ||
        user_message.includes('## My Profile'));

    const effectiveMode: 'auto' | 'manual' = (requestedHorsemanFilter || isShowMore)
      ? 'manual'
      : (isAutoMode ? 'auto' : (requestMode || 'manual'));
    const page = requestPage || inheritedPage || 1;
    const strategiesPerPage = 5;
    if (requestedHorsemanFilter) {
      console.log(`Horseman filter: ${requestedHorsemanFilter} (inherited=${!!inheritedHorseman}) → mode=manual, page=${page}`);
    }

    // Detect primary horseman from assessment DB result, then fall back to message parsing
    let primaryHorseman: string | null = null;
    const latestAssessment = assessmentResult?.data?.[0];
    if (latestAssessment?.primary_horseman) {
      primaryHorseman = latestAssessment.primary_horseman;
    }
    if (!primaryHorseman) {
      const horsemanMatch = user_message.match(/Primary financial pressure:\s*([\w\s]+)/i);
      if (horsemanMatch) {
        primaryHorseman = horsemanMatch[1].trim().toLowerCase().split(' ')[0];
        if (primaryHorseman === 'debt') primaryHorseman = 'interest';
      }
      for (const h of ['interest', 'taxes', 'insurance', 'education']) {
        if (user_message.toLowerCase().includes(`primary financial pressure: ${h}`)) {
          primaryHorseman = h;
          break;
        }
      }
    }

    const horsemanRanking = latestAssessment
      ? [
          { key: 'interest', score: Number((latestAssessment as any).interest_score || 0) },
          { key: 'taxes', score: Number((latestAssessment as any).taxes_score || 0) },
          { key: 'insurance', score: Number((latestAssessment as any).insurance_score || 0) },
          { key: 'education', score: Number((latestAssessment as any).education_score || 0) },
        ].sort((a, b) => b.score - a.score)
      : [];

    const promptHorseman = detectPromptHorseman(user_message);
    const routingPrimaryHorseman = promptHorseman.horseman || normalizeHorseman(primaryHorseman) || null;
    const assessmentPrimaryHorseman = normalizeHorseman(primaryHorseman);

    const userContext: UserContext = {
      primaryHorseman: routingPrimaryHorseman,
      secondaryHorseman: promptHorseman.horseman && assessmentPrimaryHorseman && promptHorseman.horseman !== assessmentPrimaryHorseman
        ? assessmentPrimaryHorseman
        : (horsemanRanking[1]?.key || null),
      thirdHorseman: horsemanRanking[2]?.key || null,
      financialGoals,
      profileTypes,
      cashFlowStatus,
      completedStrategyIds,
      activeStrategyIds,
      mode: effectiveMode,
    };

    // Apply horseman pre-filter (when user explicitly requested a horseman) BEFORE ranking
    const strategiesForRanking = requestedHorsemanFilter
      ? allStrategies.filter(s => s.horseman_type === requestedHorsemanFilter)
      : allStrategies;

    // Rank strategies freshly on every request using current prompt + assessment context.
    const rankedStrategiesRaw = rankStrategies(strategiesForRanking, userContext);
    const intentHorseman = requestedHorsemanFilter || promptHorseman.horseman;
    let selectedStrategyForRequest = rankedStrategiesRaw[0] || null;
    let horsemanOverrideLogged = false;
    if (intentHorseman && rankedStrategiesRaw.length > 0) {
      const bestIntentMatch = rankedStrategiesRaw.find(s => s.strategy.horseman_type === intentHorseman) || null;
      const bestOverall = rankedStrategiesRaw[0];
      if (bestIntentMatch && bestOverall.strategy.horseman_type !== intentHorseman) {
        const delta = bestOverall.score - bestIntentMatch.score;
        if (delta >= CROSS_HORSEMAN_OVERRIDE_THRESHOLD) {
          horsemanOverrideLogged = true;
          console.warn(`Intent horseman override allowed | primary_horseman=${intentHorseman} | selected_horseman=${bestOverall.strategy.horseman_type} | selected_strategy_id=${bestOverall.strategy.strategy_id} | score=${bestOverall.score} | intent_best_strategy_id=${bestIntentMatch.strategy.strategy_id} | intent_best_score=${bestIntentMatch.score} | delta=${delta}`);
        } else {
          selectedStrategyForRequest = bestIntentMatch;
          console.log(`Intent horseman guard selected in-horseman strategy | primary_horseman=${intentHorseman} | selected_horseman=${bestIntentMatch.strategy.horseman_type} | selected_strategy_id=${bestIntentMatch.strategy.strategy_id} | score=${bestIntentMatch.score} | rejected_strategy_id=${bestOverall.strategy.strategy_id} | rejected_horseman=${bestOverall.strategy.horseman_type} | delta=${delta}`);
        }
      }
    }
    const rankedStrategies = selectedStrategyForRequest
      ? [selectedStrategyForRequest, ...rankedStrategiesRaw.filter(s => s.strategy.id !== selectedStrategyForRequest!.strategy.id)]
      : rankedStrategiesRaw;
    console.log(`Ranked ${rankedStrategies.length} strategies, mode: ${effectiveMode}, page: ${page}, filter: ${requestedHorsemanFilter || 'none'}, primary_horseman: ${intentHorseman || routingPrimaryHorseman || 'none'}, selected_horseman: ${rankedStrategies[0]?.strategy.horseman_type || 'none'}, selected_strategy_id: ${rankedStrategies[0]?.strategy.strategy_id || 'none'}, score: ${rankedStrategies[0]?.score ?? 'none'}, prompt_horseman_reason: ${promptHorseman.reason}, override_allowed: ${horsemanOverrideLogged}`);
    const selectedStrategyMetadata = {
      primary_horseman: intentHorseman || routingPrimaryHorseman || null,
      selected_horseman: rankedStrategies[0]?.strategy.horseman_type || null,
      selected_strategy_id: rankedStrategies[0]?.strategy.strategy_id || null,
      selected_strategy_name: rankedStrategies[0]?.strategy.title || null,
      score: rankedStrategies[0]?.score ?? null,
    };

    // Build SCOPED knowledge base context now that the selected strategy + horseman are known.
    const knowledgeBaseContext = buildScopedKnowledgeContext(
      knowledgeBaseRows,
      {
        horseman: rankedStrategies[0]?.strategy.horseman_type || intentHorseman || routingPrimaryHorseman || null,
        strategy: rankedStrategies[0]?.strategy || null,
      },
    );
    console.log(`KB scoped retrieval | sources_loaded=${knowledgeBaseRows.length} | context_chars=${knowledgeBaseContext.length}`);
    // Get prompt templates (with fallbacks)
    const baseSystemPrompt = systemPromptResult || FALLBACK_SYSTEM_PROMPT;
    const autoInstructions = autoPromptResult || '';
    const manualInstructions = manualPromptResult || '';

    // Determine if in intake phase
    const inIntake = isIntakePhase(messages);
    let dynamicSystemPrompt: string;

    if (inIntake && effectiveMode !== 'auto') {
      // Intake phase: No strategy context needed
      dynamicSystemPrompt = baseSystemPrompt + profileContext + knowledgeBaseContext;
      console.log('Intake phase - skipping strategy context');
    } else if (effectiveMode === 'auto') {
      // Auto mode: provide the single best strategy with full details
      const topStrategy = rankedStrategies[0];
      const strategyContext = topStrategy
        ? `## THE BEST STRATEGY FOR THIS USER\n${formatStrategyFull(topStrategy.strategy)}\n\nFit Score: ${topStrategy.score}/100`
        : '## No matching strategies found. Provide general financial guidance.';

      dynamicSystemPrompt = `${baseSystemPrompt}
${profileContext}
${strategyContext}
${knowledgeBaseContext}

## MODE: AUTO (Single Best Strategy)
${autoInstructions}`;
      console.log('Auto mode - top strategy:', topStrategy?.strategy.strategy_id, '| horseman:', topStrategy?.strategy.horseman_type, '| title:', topStrategy?.strategy.title, '| score:', topStrategy?.score);
    } else {
      // Manual mode: paginated strategy list
      const startIdx = (page - 1) * strategiesPerPage;
      const endIdx = startIdx + strategiesPerPage;
      const pageStrategies = rankedStrategies.slice(startIdx, endIdx);
      const totalAvailable = rankedStrategies.length;
      const hasMore = endIdx < totalAvailable;

      const strategiesContext = pageStrategies.length > 0
        ? `## STRATEGIES (Page ${page}, showing ${startIdx + 1}-${Math.min(endIdx, totalAvailable)} of ${totalAvailable})\n${formatStrategiesCondensed(pageStrategies.map(s => s.strategy))}`
        : '## No more strategies available.';

      dynamicSystemPrompt = `${baseSystemPrompt}
${profileContext}
${strategiesContext}
${knowledgeBaseContext}

${hasMore ? `There are ${totalAvailable - endIdx} more strategies available. If the user wants more, they can request the next page.` : 'This is the last page of strategies.'}

## MODE: MANUAL (Paginated Strategy Finder)
${manualInstructions}`;
      console.log(`Manual mode - page ${page}, showing ${pageStrategies.length} strategies`);
    }

    let assistantMessage: string;
    let runtimeBranch: 'template-forced' | 'template-free' | 'template-no-openai-key' | 'paid-openai-strict-json' | 'paid-openai' = 'template-free';
    const forceTemplateEngine = Deno.env.get('RPRX_FORCE_TEMPLATE_ENGINE') === 'true';
    const strictJsonV1 = Deno.env.get('STRICT_JSON_V1') === 'true';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    // A/B model variant: 'a' (default) | 'b'. Map to actual model ids.
    const modelVariantRaw = (Deno.env.get('RPRX_PAID_MODEL_VARIANT') || 'a').toLowerCase();
    const modelVariant = modelVariantRaw === 'b' ? 'b' : 'a';
    const PAID_MODEL_BY_VARIANT: Record<string, string> = { a: 'gpt-4o-mini', b: 'gpt-4o-mini' };
    const paidModel = PAID_MODEL_BY_VARIANT[modelVariant];

    // Branch selection (explicit & mutually exclusive)
    if (forceTemplateEngine) {
      runtimeBranch = 'template-forced';
    } else if (isFreeUser) {
      runtimeBranch = 'template-free';
    } else if (!openaiApiKey) {
      runtimeBranch = 'template-no-openai-key';
    } else {
      runtimeBranch = strictJsonV1 ? 'paid-openai-strict-json' : 'paid-openai';
    }
    const branchLog = runtimeBranch === 'template-no-openai-key'
      ? 'fallback'
      : (runtimeBranch.startsWith('template') ? 'template' : 'paid_openai');
    console.log(`branch=${branchLog} | runtime_branch=${runtimeBranch} | model_variant=${modelVariant} | model=${paidModel} | force_template_engine=${forceTemplateEngine} | strict_json_v1=${strictJsonV1} | strategy_source=${strategySource} | tier=${userTier || 'free'} | mode=${effectiveMode} | primary_horseman=${selectedStrategyMetadata.primary_horseman || 'none'} | selected_horseman=${selectedStrategyMetadata.selected_horseman || 'none'} | selected_strategy_id=${selectedStrategyMetadata.selected_strategy_id || 'none'} | score=${selectedStrategyMetadata.score ?? 'none'}`);

    if (runtimeBranch.startsWith('template')) {
      // =====================================================
      // TEMPLATE ENGINE: deterministic internal strategy engine
      // =====================================================
      const intent = detectIntent(user_message, messages);
      assistantMessage = generateTemplateResponse(intent, rankedStrategies, profile, primaryHorseman, effectiveMode, user_message, page);
    } else {
      // =====================================================
      // PAID TIER: OpenAI-powered conversational AI
      // =====================================================
      let systemPrompt = dynamicSystemPrompt;
      if (runtimeBranch === 'paid-openai-strict-json') {
        const selectedStrategy = effectiveMode === 'auto' ? rankedStrategies[0]?.strategy : rankedStrategies[0]?.strategy;
        const lockedId = selectedStrategy?.strategy_id || '';
        const lockedName = selectedStrategy?.title || '';
        const lockedHorseman = selectedStrategy?.horseman_type || primaryHorseman || 'interest';
        systemPrompt += `

## STRICT OUTPUT CONTRACT (JSON v1) — MANDATORY
You MUST respond with a SINGLE fenced \`\`\`json code block and NOTHING ELSE. No prose, no headings, no markdown outside the JSON fence.

## LOCKED STRATEGY (DO NOT CHANGE)
- strategy_id: "${lockedId}"
- strategy_name: "${lockedName}"
- horseman: ["${lockedHorseman}"]

You MUST use those EXACT values for strategy_id, strategy_name, and horseman. Do not invent or substitute.
All content (summary, steps, before_you_start, risks_and_mistakes_to_avoid, advisor_packet) MUST be specific to the "${lockedHorseman}" horseman and to this strategy. Do NOT inject tax-document defaults for non-tax strategies. Do NOT inject debt-payoff defaults for non-interest strategies.

Schema:
{
  "plan_schema": "v1",
  "strategy_id": "${lockedId}",
  "strategy_name": "${lockedName}",
  "horseman": ["${lockedHorseman}"],
  "summary": "string (2-4 sentences specific to this strategy)",
  "steps": [
    {
      "title": "Concise action phrase, 4-70 chars, NEVER 'Step 1' or generic",
      "instruction": "Concrete task tied to this specific strategy (1-3 sentences)",
      "time_estimate": "one of: 15-20 min | 15-30 min | 20-45 min | 30-60 min",
      "done_definition": "Measurable completion statement (what proves this step is done)"
    }
  ],
  "before_you_start": ["string aligned to ${lockedHorseman} horseman"],
  "risks_and_mistakes_to_avoid": ["string aligned to ${lockedHorseman} horseman"],
  "advisor_packet": ["string aligned to ${lockedHorseman} horseman"],
  "complexity": 1,
  "savings": "string (e.g. $500-$2,000/year)",
  "tax_reference": "string (only when relevant, e.g. IRC §401(k))",
  "disclaimer": "string"
}

Rules:
- "steps" MUST contain at least 2 items. Each step MUST be an OBJECT with title, instruction, time_estimate, done_definition.
- Step titles MUST be specific (e.g. "List all credit card balances", NOT "Step 1" or "Schedule a 30").
- "before_you_start", "risks_and_mistakes_to_avoid", "advisor_packet" are REQUIRED arrays of 2-5 strings each, all aligned to "${lockedHorseman}".
- "complexity", "savings", "tax_reference" are OPTIONAL — omit if not applicable.
- Output exactly one \`\`\`json ... \`\`\` block. No text before or after the fence.`;
      }

      const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      console.log(`Calling OpenAI with ${openaiMessages.length} messages (strict_json=${runtimeBranch === 'paid-openai-strict-json'})`);

      const maxRetries = 3;
      let lastError: string | null = null;
      let openaiData: any = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Retry attempt ${attempt + 1}, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        const openaiBody: Record<string, unknown> = {
          model: paidModel,
          messages: openaiMessages,
          temperature: runtimeBranch === 'paid-openai-strict-json' ? 0.2 : 0.7,
          max_tokens: 2500,
        };
        if (runtimeBranch === 'paid-openai-strict-json') {
          openaiBody.response_format = { type: 'json_object' };
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(openaiBody),
        });

        if (openaiResponse.ok) {
          openaiData = await openaiResponse.json();
          break;
        }

        const errorText = await openaiResponse.text();
        console.error(`OpenAI API error (attempt ${attempt + 1}):`, openaiResponse.status, errorText);

        if (openaiResponse.status === 429) {
          lastError = 'The AI is currently busy. Please wait a moment and try again.';
          const retryAfter = openaiResponse.headers.get('retry-after');
          if (retryAfter) {
            await new Promise(resolve => setTimeout(resolve, Math.min(parseInt(retryAfter) * 1000, 15000)));
          }
          continue;
        }

        lastError = 'Failed to get AI response';
        break;
      }

      if (!openaiData) {
        return new Response(
          JSON.stringify({ error: lastError || 'Failed to get AI response' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      assistantMessage = openaiData.choices[0]?.message?.content;
      if (!assistantMessage) {
        return new Response(
          JSON.stringify({ error: 'No response from AI' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // When using response_format=json_object, OpenAI returns raw JSON (no fence).
      // Validate + deterministically repair before wrapping.
      if (runtimeBranch === 'paid-openai-strict-json') {
        const selected = rankedStrategies[0]?.strategy;
        const candidateIds = new Set(rankedStrategies.slice(0, 20).map(r => r.strategy.strategy_id));
        const validationErrors: string[] = [];
        const appliedFixes: string[] = [];
        let consistencyFixed = false;

        const TIME_ALLOWED = ['15-20 min', '15-30 min', '20-45 min', '30-60 min'];
        const GENERIC_TITLE_RE = /^(step\s*\d+|follow[-\s]?up\s*\d*|schedule\s+a\s+\d+|untitled|todo)\s*$/i;

        let parsed: any = null;
        try {
          parsed = JSON.parse(assistantMessage.trim());
        } catch (_e) {
          validationErrors.push('json_parse_failed');
        }

        if (parsed && typeof parsed === 'object' && selected) {
          // 1. Strategy consistency guard
          if (parsed.strategy_id !== selected.strategy_id) {
            validationErrors.push(`strategy_id_mismatch:${parsed.strategy_id}->${selected.strategy_id}`);
            parsed.strategy_id = selected.strategy_id;
            consistencyFixed = true;
          } else if (!candidateIds.has(parsed.strategy_id)) {
            validationErrors.push('strategy_id_not_in_candidates');
            parsed.strategy_id = selected.strategy_id;
            consistencyFixed = true;
          }
          if (parsed.strategy_name !== selected.title) {
            parsed.strategy_name = selected.title;
            consistencyFixed = true;
            appliedFixes.push('strategy_name_overwritten');
          }
          const expectedHorseman = selected.horseman_type;
          const horsemanArr = Array.isArray(parsed.horseman) ? parsed.horseman : [parsed.horseman].filter(Boolean);
          if (horsemanArr.length === 0 || horsemanArr[0] !== expectedHorseman) {
            parsed.horseman = [expectedHorseman];
            consistencyFixed = true;
            appliedFixes.push('horseman_overwritten');
          }

          // 2. Step normalization
          if (!Array.isArray(parsed.steps)) {
            parsed.steps = [];
            validationErrors.push('steps_not_array');
          }
          parsed.steps = parsed.steps.map((s: any, idx: number) => {
            // Coerce string steps to objects
            if (typeof s === 'string') {
              appliedFixes.push(`step_${idx}_coerced_from_string`);
              s = { title: s.slice(0, 70), instruction: s, time_estimate: '15-30 min', done_definition: 'Step completed' };
            }
            if (!s || typeof s !== 'object') {
              s = { title: `${selected.title} action ${idx + 1}`, instruction: '', time_estimate: '15-30 min', done_definition: 'Step completed' };
              appliedFixes.push(`step_${idx}_replaced_invalid`);
            }
            const rawTitle = String(s.title || '').trim();
            const isGeneric = !rawTitle || rawTitle.length < 4 || GENERIC_TITLE_RE.test(rawTitle) || /^step\s*\d+$/i.test(rawTitle);
            if (isGeneric) {
              const fallback = String(s.instruction || '').trim().split(/[.!?]/)[0].slice(0, 70).trim();
              s.title = fallback && fallback.length >= 4
                ? fallback
                : `${selected.title}: action ${idx + 1}`;
              appliedFixes.push(`step_${idx}_title_repaired`);
            } else if (rawTitle.length > 70) {
              s.title = rawTitle.slice(0, 67).replace(/[\s,;:.-]+$/, '') + '…';
              appliedFixes.push(`step_${idx}_title_truncated`);
            } else {
              s.title = rawTitle;
            }
            if (!s.instruction || typeof s.instruction !== 'string' || s.instruction.trim().length < 10) {
              s.instruction = `Complete the action: ${s.title}. Apply this to the "${selected.title}" strategy.`;
              appliedFixes.push(`step_${idx}_instruction_repaired`);
            }
            if (!TIME_ALLOWED.includes(s.time_estimate)) {
              s.time_estimate = '15-30 min';
              appliedFixes.push(`step_${idx}_time_normalized`);
            }
            if (!s.done_definition || typeof s.done_definition !== 'string' || s.done_definition.trim().length < 5) {
              s.done_definition = `You have completed: ${s.title}.`;
              appliedFixes.push(`step_${idx}_done_definition_added`);
            }
            return s;
          });

          // Ensure >= 2 steps
          while (parsed.steps.length < 2) {
            const idx = parsed.steps.length;
            parsed.steps.push({
              title: `${selected.title}: follow-up action ${idx + 1}`,
              instruction: `Review your progress on the "${selected.title}" strategy and capture next actions.`,
              time_estimate: '15-30 min',
              done_definition: 'Next action documented.',
            });
            appliedFixes.push(`step_${idx}_padded`);
            validationErrors.push('steps_below_minimum');
          }

          // 3. Horseman-aware required arrays
          const ensureArray = (key: string, defaultsByHorseman: Record<string, string[]>) => {
            if (!Array.isArray(parsed[key]) || parsed[key].length === 0) {
              parsed[key] = defaultsByHorseman[expectedHorseman] || defaultsByHorseman['interest'];
              appliedFixes.push(`${key}_defaulted_for_${expectedHorseman}`);
            } else {
              parsed[key] = parsed[key].filter((x: any) => typeof x === 'string' && x.trim().length > 0);
            }
          };
          const beforeDefaults: Record<string, string[]> = {
            interest: HORSEMAN_PRESETS.interest.before,
            taxes: HORSEMAN_PRESETS.taxes.before,
            insurance: HORSEMAN_PRESETS.insurance.before,
            education: HORSEMAN_PRESETS.education.before,
          };
          const risksDefaults: Record<string, string[]> = {
            interest: HORSEMAN_PRESETS.interest.risks,
            taxes: HORSEMAN_PRESETS.taxes.risks,
            insurance: HORSEMAN_PRESETS.insurance.risks,
            education: HORSEMAN_PRESETS.education.risks,
          };
          const advisorDefaults: Record<string, string[]> = {
            interest: HORSEMAN_PRESETS.interest.packet,
            taxes: HORSEMAN_PRESETS.taxes.packet,
            insurance: HORSEMAN_PRESETS.insurance.packet,
            education: HORSEMAN_PRESETS.education.packet,
          };
          ensureArray('before_you_start', beforeDefaults);
          ensureArray('risks_and_mistakes_to_avoid', risksDefaults);
          ensureArray('advisor_packet', advisorDefaults);

          // Lock plan_schema + disclaimer
          parsed.plan_schema = 'v1';
          if (!parsed.disclaimer || typeof parsed.disclaimer !== 'string') {
            parsed.disclaimer = 'This information is for educational purposes only and does not constitute tax, legal, or financial advice.';
            appliedFixes.push('disclaimer_defaulted');
          }
          if (!parsed.summary || typeof parsed.summary !== 'string' || parsed.summary.trim().length < 20) {
            parsed.summary = `${selected.title}. ${(selected.strategy_details || '').slice(0, 280)}`.trim();
            appliedFixes.push('summary_repaired');
          }

          assistantMessage = '```json\n' + JSON.stringify(parsed, null, 2) + '\n```';
          const finalAssertionErrors = assertPlanMatchesStrategy(parsed as StructuredPlan, selected);
          if (finalAssertionErrors.length > 0) {
            console.error(`Canonical paid plan assertion failed | selected_strategy_id=${selected.strategy_id} | errors=${JSON.stringify(finalAssertionErrors)}`);
            return new Response(
              JSON.stringify({ error: 'Canonical strategy plan mismatch', selected_strategy_id: selected.strategy_id, validation_errors: finalAssertionErrors }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else if (selected) {
          // Could not parse — fall back deterministically using the selected strategy
          validationErrors.push('falling_back_to_deterministic');
          const fallback = buildStructuredPlan(selected, profile, primaryHorseman);
          assistantMessage = '```json\n' + JSON.stringify(fallback, null, 2) + '\n```';
          consistencyFixed = true;
        } else {
          // No selected strategy — leave fence as-is
          const trimmed = assistantMessage.trim();
          if (!trimmed.startsWith('```')) {
            assistantMessage = '```json\n' + trimmed + '\n```';
          }
        }

        console.log(`Strict JSON v1 validation | selected_strategy_id: ${selected?.strategy_id} | selected_horseman: ${selected?.horseman_type} | parser: paid-openai-strict-json | strategy_consistency_fixed: ${consistencyFixed} | validation_errors: ${JSON.stringify(validationErrors)} | applied_fixes: ${JSON.stringify(appliedFixes)}`);
      }

      console.log('Received OpenAI response, length:', assistantMessage.length);
    }

    // Save assistant message (fire and forget)
    supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: assistantMessage,
    }).then(({ error }) => {
      if (error) console.error('Error saving assistant message:', error);
    });

    return new Response(
      JSON.stringify({
        conversation_id: conversationId,
        assistant_message: assistantMessage,
        has_more_strategies: effectiveMode === 'manual' && rankedStrategies.length > page * strategiesPerPage,
        total_strategies: rankedStrategies.length,
        current_page: page,
        strategy_source: strategySource,
        runtime_branch: runtimeBranch,
        branch: branchLog,
        selected_strategy: selectedStrategyMetadata,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
