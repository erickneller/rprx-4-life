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
  name: string;
  description: string;
  horseman_type: string;
  difficulty: string;
  estimated_impact: string | null;
  tax_return_line_or_area: string | null;
  financial_goals: string[] | null;
  steps: unknown;
  is_active: boolean;
  sort_order: number;
}

interface ScoredStrategy {
  strategy: DBStrategy;
  score: number;
}

interface UserContext {
  primaryHorseman: string | null;
  financialGoals: string[];
  profileTypes: string[];
  cashFlowStatus: string | null;
  completedStrategyIds: string[];
  mode: 'auto' | 'manual';
}

// =====================================================
// STRATEGY FETCHING FROM DATABASE
// =====================================================

async function fetchStrategies(serviceClient: any): Promise<DBStrategy[]> {
  const { data, error } = await serviceClient
    .from('strategy_definitions')
    .select('id, name, description, horseman_type, difficulty, estimated_impact, tax_return_line_or_area, financial_goals, steps, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching strategies:', error);
    return [];
  }
  return data || [];
}

// =====================================================
// SMART STRATEGY RANKING ALGORITHM
// =====================================================

function scoreStrategy(strategy: DBStrategy, context: UserContext): number {
  // Exclude completed strategies entirely
  if (context.completedStrategyIds.includes(strategy.id)) {
    return -1;
  }

  let score = 0;

  // 1. Horseman match (30% weight, max 30 points)
  if (context.primaryHorseman && strategy.horseman_type === context.primaryHorseman) {
    score += 30;
  }

  // 2. Financial goals match (25% weight, max 25 points)
  if (context.financialGoals.length > 0 && strategy.financial_goals && strategy.financial_goals.length > 0) {
    const overlap = strategy.financial_goals.filter(g => context.financialGoals.includes(g)).length;
    const maxPossible = Math.min(context.financialGoals.length, strategy.financial_goals.length);
    if (maxPossible > 0) {
      score += Math.round((overlap / maxPossible) * 25);
    }
  }

  // 3. Difficulty fit (15% weight) - easy preferred for auto mode
  const difficultyScores: Record<string, number> = { easy: 15, moderate: 10, advanced: 5 };
  if (context.mode === 'auto') {
    score += difficultyScores[strategy.difficulty] || 5;
  } else {
    // Manual mode: moderate weight, all difficulties welcome
    score += 10;
  }

  // 4. Profile type relevance (15% weight)
  // Map profile types to horseman affinity
  const profileHorsemanMap: Record<string, string[]> = {
    business_owner: ['taxes', 'interest'],
    retiree: ['taxes', 'insurance'],
    salesperson: ['taxes', 'interest'],
    wage_earner: ['taxes', 'interest'],
    investor: ['taxes', 'interest'],
    farmer: ['taxes', 'insurance'],
    nonprofit: ['taxes', 'education'],
  };
  if (context.profileTypes.length > 0) {
    for (const pt of context.profileTypes) {
      const affinities = profileHorsemanMap[pt] || [];
      if (affinities.includes(strategy.horseman_type)) {
        score += 15;
        break;
      }
    }
  }

  // 5. Cash flow compatibility (10% weight)
  if (context.cashFlowStatus === 'deficit' && strategy.difficulty === 'advanced') {
    // Deprioritize complex strategies for deficit users
    score += 2;
  } else if (context.cashFlowStatus === 'surplus') {
    score += 10;
  } else {
    score += 7;
  }

  return score;
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
    `### ${s.id}: ${s.name}
- Horseman: ${s.horseman_type}
- Summary: ${s.description}
- Impact: ${s.estimated_impact || 'Varies'}
- Difficulty: ${s.difficulty}
- Best For: ${(s.financial_goals || []).join(', ') || 'General'}`
  ).join('\n\n');
}

function formatStrategyFull(s: DBStrategy): string {
  const steps = Array.isArray(s.steps) ? s.steps : [];
  const stepsStr = steps.length > 0
    ? steps.map((step: any, i: number) => `  ${i + 1}. ${typeof step === 'string' ? step : step?.text || step?.step || JSON.stringify(step)}`).join('\n')
    : '  (No detailed steps available)';
  
  return `### ${s.id}: ${s.name}
- **Horseman:** ${s.horseman_type}
- **Summary:** ${s.description}
- **Estimated Impact:** ${s.estimated_impact || 'Varies'}
- **Difficulty:** ${s.difficulty}
- **Tax Reference:** ${s.tax_return_line_or_area || 'N/A'}
- **Financial Goals:** ${(s.financial_goals || []).join(', ') || 'General'}
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
    const [saveResult, historyResult, profileResult, strategiesResult, completedResult, systemPromptResult, autoPromptResult, manualPromptResult] = await Promise.all([
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
        .select('full_name, monthly_income, monthly_debt_payments, monthly_housing, monthly_insurance, monthly_living_expenses, profile_type, num_children, children_ages, financial_goals, filing_status, years_until_retirement, desired_retirement_income, retirement_balance_total, retirement_contribution_monthly, health_insurance, life_insurance, disability_insurance, long_term_care_insurance')
        .eq('id', userId)
        .maybeSingle(),
      fetchStrategies(serviceClient),
      supabase
        .from('saved_plans')
        .select('strategy_id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      fetchPromptTemplate(serviceClient, 'system_prompt'),
      fetchPromptTemplate(serviceClient, 'auto_mode_instructions'),
      fetchPromptTemplate(serviceClient, 'manual_mode_instructions'),
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
    const completedStrategyIds = (completedResult.data || [])
      .map((p: any) => p.strategy_id)
      .filter(Boolean);

    // Build profile context
    const profile = profileResult.data;
    const { context: profileContext, cashFlowStatus, profileTypes, financialGoals } = buildProfileContext(profile);

    // Determine mode
    const isAutoMode = requestMode === 'auto' || 
      user_message.includes('## My Assessment Results') || 
      user_message.includes('## My Profile');
    
    const effectiveMode: 'auto' | 'manual' = isAutoMode ? 'auto' : (requestMode || 'manual');
    const page = requestPage || 1;
    const strategiesPerPage = 10;

    // Detect primary horseman from message or assessment
    let primaryHorseman: string | null = null;
    const horsemanMatch = user_message.match(/Primary financial pressure:\s*([\w\s]+)/i);
    if (horsemanMatch) {
      primaryHorseman = horsemanMatch[1].trim().toLowerCase().split(' ')[0]; // e.g. "debt" -> first word
      // Map common phrases
      if (primaryHorseman === 'debt') primaryHorseman = 'interest';
    }
    // Also check for horseman_type enum values directly
    for (const h of ['interest', 'taxes', 'insurance', 'education']) {
      if (user_message.toLowerCase().includes(`primary financial pressure: ${h}`)) {
        primaryHorseman = h;
        break;
      }
    }

    const userContext: UserContext = {
      primaryHorseman,
      financialGoals,
      profileTypes,
      cashFlowStatus,
      completedStrategyIds,
      mode: effectiveMode,
    };

    // Rank strategies
    const rankedStrategies = rankStrategies(allStrategies, userContext);
    console.log(`Ranked ${rankedStrategies.length} strategies, mode: ${effectiveMode}, page: ${page}`);

    // Get prompt templates (with fallbacks)
    const baseSystemPrompt = systemPromptResult || FALLBACK_SYSTEM_PROMPT;
    const autoInstructions = autoPromptResult || '';
    const manualInstructions = manualPromptResult || '';

    // Determine if in intake phase
    const inIntake = isIntakePhase(messages);
    let dynamicSystemPrompt: string;

    if (inIntake && effectiveMode !== 'auto') {
      // Intake phase: No strategy context needed
      dynamicSystemPrompt = baseSystemPrompt + profileContext;
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

## MODE: AUTO (Single Best Strategy)
${autoInstructions}`;
      console.log('Auto mode - top strategy:', topStrategy?.strategy.id, 'score:', topStrategy?.score);
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

${hasMore ? `There are ${totalAvailable - endIdx} more strategies available. If the user wants more, they can request the next page.` : 'This is the last page of strategies.'}

## MODE: MANUAL (Paginated Strategy Finder)
${manualInstructions}`;
      console.log(`Manual mode - page ${page}, showing ${pageStrategies.length} strategies`);
    }

    // Build OpenAI messages
    const openaiMessages = [
      { role: 'system', content: dynamicSystemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    console.log('Calling OpenAI with', openaiMessages.length, 'messages');

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retry logic with exponential backoff
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

    const assistantMessage = openaiData.choices[0]?.message?.content;
    if (!assistantMessage) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received OpenAI response, length:', assistantMessage.length);

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
