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

async function fetchStrategies(serviceClient: any): Promise<DBStrategy[]> {
  const { data, error } = await serviceClient
    .from('strategy_catalog_v2')
    .select('id, strategy_id, title, strategy_details, example, potential_savings_benefits, horseman_type, difficulty, estimated_impact_min, estimated_impact_max, estimated_impact_display, tax_return_line_or_area, goal_tags, implementation_steps, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!error && data && data.length > 0) return data;

  console.warn('strategy_catalog_v2 unavailable/empty, using legacy strategy_definitions fallback');
  const { data: legacy, error: legacyError } = await serviceClient
    .from('strategy_definitions')
    .select('id, horseman_type, name, description, difficulty, estimated_impact, tax_return_line_or_area, financial_goals, steps, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (legacyError || !legacy) {
    console.error('Error fetching fallback strategies:', legacyError || error);
    return [];
  }

  return legacy.map((s: any) => ({
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
  }));
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

// =====================================================
// STRATEGY FORMATTING
// =====================================================

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
// KNOWLEDGE BASE FETCHING
// =====================================================

async function fetchKnowledgeBase(serviceClient: any): Promise<string> {
  try {
    const { data, error } = await serviceClient
      .from('knowledge_base')
      .select('name, content')
      .eq('is_active', true)
      .not('content', 'eq', '');
    if (error || !data || data.length === 0) return '';
    return '\n## KNOWLEDGE BASE\n' +
      data.map((d: any) => `### ${d.name}\n${d.content}`).join('\n\n');
  } catch {
    return '';
  }
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
    const steps = Array.isArray(s.implementation_steps) ? s.implementation_steps : [];
    const stepsStr = steps.length > 0
      ? steps.map((step: any, i: number) => `${i + 1}. ${typeof step === 'string' ? step : step?.text || step?.step || JSON.stringify(step)}`).join('\n')
      : '';
    return `## ${idx}. ${s.title} (${s.strategy_id})
**Horseman:** ${HORSEMAN_DISPLAY[s.horseman_type] || s.horseman_type} | **Impact:** ${s.estimated_impact_display || 'Varies'} | **Difficulty:** ${s.difficulty}

${s.strategy_details}${stepsStr ? `\n\n**Implementation Steps:**\n${stepsStr}` : ''}`;
  };

  // ----- AUTO mode: single best strategy with full steps -----
  if (intent === 'auto' || mode === 'auto') {
    const top = ranked[0];
    if (!top) return `I don't have a matching strategy for your profile yet. Try completing the assessment first!${disclaimer}`;
    return `# Your Recommended Strategy

Based on your profile and assessment, here is your best-fit strategy for **${horsemanLabel}**:

${formatStrategyBlock(top.strategy, 1)}

Here are the step-by-step implementation plans for this strategy. Would you like to save this as your active plan?${disclaimer}`;
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

    return `# Implementation Plan: ${target.strategy.title}

${formatStrategyBlock(target.strategy, 1)}

${target.strategy.tax_return_line_or_area ? `**Tax Return Reference:** ${target.strategy.tax_return_line_or_area}\n` : ''}
Would you like to save this as your active implementation plan?${disclaimer}`;
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
    const [saveResult, historyResult, profileResult, strategiesResult, completedResult, activeResult, systemPromptResult, autoPromptResult, manualPromptResult, assessmentResult, knowledgeBaseContext] = await Promise.all([
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
      fetchKnowledgeBase(serviceClient),
    ]);

    if (saveResult.error) {
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
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

    const allStrategies = strategiesResult;
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

    const userContext: UserContext = {
      primaryHorseman,
      secondaryHorseman: horsemanRanking[1]?.key || null,
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

    // Rank strategies
    const rankedStrategies = rankStrategies(strategiesForRanking, userContext);
    console.log(`Ranked ${rankedStrategies.length} strategies, mode: ${effectiveMode}, page: ${page}, filter: ${requestedHorsemanFilter || 'none'}`);

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
      console.log('Auto mode - top strategy:', topStrategy?.strategy.strategy_id, 'score:', topStrategy?.score);
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
    const forceTemplateEngine = Deno.env.get('RPRX_FORCE_TEMPLATE_ENGINE') === 'true';

    if (isFreeUser || forceTemplateEngine) {
      // =====================================================
      // TEMPLATE ENGINE: deterministic internal strategy engine
      // =====================================================
      console.log(forceTemplateEngine ? 'Forced template engine — generating response' : 'Free tier — generating template response');
      const intent = detectIntent(user_message, messages);
      assistantMessage = generateTemplateResponse(intent, rankedStrategies, profile, primaryHorseman, effectiveMode, user_message, page);
      // =====================================================
      // PAID TIER: OpenAI-powered conversational AI
      // =====================================================
      const openaiMessages = [
        { role: 'system', content: dynamicSystemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      console.log('Paid tier — calling OpenAI with', openaiMessages.length, 'messages');

      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        console.log('OPENAI_API_KEY missing, falling back to template engine');
        const intent = detectIntent(user_message, messages);
        assistantMessage = generateTemplateResponse(intent, rankedStrategies, profile, primaryHorseman, effectiveMode, user_message);
      } else {

      const maxRetries = 3;
      let lastError: string | null = null;
      let openaiData: any = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Retry attempt ${attempt + 1}, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: openaiMessages,
            temperature: 0.7,
            max_tokens: 2500,
          }),
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

      console.log('Received OpenAI response, length:', assistantMessage.length);
      }
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
        has_more_strategies: effectiveMode === 'manual' && rankedStrategies.length > (requestPage || 1) * 10,
        total_strategies: rankedStrategies.length,
        current_page: page,
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
