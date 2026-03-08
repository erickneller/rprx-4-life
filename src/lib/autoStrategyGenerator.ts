import { generateAutoStrategyPrompt, type AssessmentResponseDetail } from './promptGenerator';
import { parseStrategyFromMessage } from './strategyParser';
import { parseEstimatedImpact } from './moneyLeakEstimator';
import type { Profile } from '@/hooks/useProfile';
import type { UserAssessment } from './assessmentTypes';
import type { SavedPlan, CreatePlanInput, PlanContent } from '@/hooks/usePlans';
import { supabase } from '@/integrations/supabase/client';

const HORSEMAN_LABELS: Record<string, string> = {
  interest: 'Interest & Debt',
  taxes: 'Tax Efficiency',
  insurance: 'Insurance & Protection',
  education: 'Education Funding',
};

function getAutoPlanTitle(horseman: string | null | undefined): string {
  const label = HORSEMAN_LABELS[horseman || 'interest'] || 'Financial Strategy';
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' });
  const year = now.getFullYear();
  return `${label} - ${month} ${year}`;
}

function extractStepsFromContent(content: string): string[] {
  const metadataPattern = /^\*\*[^*]+\*\*[:]/;
  const steps = content
    .split('\n')
    .filter((line: string) => /^\s*\d+\.\s+/.test(line))
    .map((line: string) => line.replace(/^\s*\d+\.\s+/, '').trim())
    .filter((s: string) => s.length > 10 && !metadataPattern.test(s))
    .slice(0, 20);

  if (steps.length < 2) {
    const bulletSteps = content
      .split('\n')
      .filter((line: string) => /^\s*[-•]\s+/.test(line) && !metadataPattern.test(line.replace(/^\s*[-•]\s+/, '')))
      .map((line: string) => line.replace(/^\s*[-•]\s+/, '').trim())
      .filter((s: string) => s.length > 10);
    if (bulletSteps.length > steps.length) {
      return bulletSteps.slice(0, 20);
    }
  }

  if (steps.length === 0) {
    return ['Review the strategy details and take action.'];
  }

  return steps;
}

export interface AutoGenerateParams {
  userId: string;
  profile: Profile | null;
  assessment: UserAssessment;
  responses: AssessmentResponseDetail[];
  existingPlanNames: string[];
  sendMessage: (params: {
    conversationId: string | null;
    userMessage: string;
  }) => Promise<{ conversationId: string; assistantMessage: string } | null>;
  createPlan: (input: CreatePlanInput) => Promise<SavedPlan>;
}

/**
 * Shared auto-generation flow: sends AI prompt, parses strategy, saves plan.
 * Does NOT navigate — caller decides what to do after.
 */
export async function autoGenerateStrategy(params: AutoGenerateParams): Promise<SavedPlan> {
  const { userId, profile, assessment, responses, existingPlanNames, sendMessage, createPlan } = params;

  // Build prompt requesting 1 strategy
  const prompt = generateAutoStrategyPrompt(profile, assessment, responses, existingPlanNames);

  // Send prompt and get AI response
  const result = await sendMessage({ conversationId: null, userMessage: prompt });
  if (!result) throw new Error('Could not generate a strategy. Please try again.');

  // Send follow-up for detailed steps
  const followUp = await sendMessage({
    conversationId: result.conversationId,
    userMessage: 'Please provide the detailed step-by-step implementation plan for the strategy above. Include numbered steps I can check off as I complete them.',
  });

  const messageContent = followUp?.assistantMessage || result.assistantMessage;

  // Parse the strategy from the response
  const parsed = parseStrategyFromMessage(messageContent, true);
  const horseman = assessment.primary_horseman || 'interest';
  const planTitle = getAutoPlanTitle(horseman);

  const planData: CreatePlanInput = parsed
    ? {
        title: planTitle,
        strategy_name: parsed.strategyName,
        strategy_id: parsed.strategyId,
        content: parsed.content,
      }
    : {
        title: planTitle,
        strategy_name: 'Implementation Plan',
        content: {
          steps: extractStepsFromContent(messageContent),
          summary: messageContent.substring(0, 500),
          disclaimer: 'This information is for educational purposes only and does not constitute tax, legal, or financial advice.',
          completedSteps: [] as number[],
        } as PlanContent,
      };

  const plan = await createPlan(planData);

  // Auto-activate: set as focus plan
  await supabase
    .from('saved_plans')
    .update({ is_focus: true })
    .eq('id', plan.id);

  // Auto-activate: insert active strategy row
  let strategyId = plan.strategy_id;
  if (!strategyId) {
    const { data: topStrategy } = await supabase
      .from('strategy_definitions')
      .select('id')
      .eq('horseman_type', horseman)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();
    strategyId = topStrategy?.id ?? null;
  }
  if (strategyId) {
    await supabase
      .from('user_active_strategies')
      .insert({
        user_id: userId,
        strategy_id: strategyId,
        status: 'active',
      });
  }

  // NOTE: This function ONLY generates and saves the plan.
  // Day completion is handled separately by explicit user action in OnboardingCard.
  return plan;
}

/**
 * Fallback plan generation from strategy_definitions.
 * Used when AI-powered generation fails or sendMessage/createPlan are unavailable.
 * Selects the top strategy for the given horseman, creates a plan, and activates it.
 */
export async function generateFallbackPlan(params: {
  userId: string;
  primaryHorseman: string;
  createPlan?: (input: CreatePlanInput) => Promise<SavedPlan>;
}): Promise<SavedPlan> {
  const { userId, primaryHorseman, createPlan } = params;

  // Fetch top strategy for this horseman
  const { data: topStrategy, error: stratError } = await supabase
    .from('strategy_definitions')
    .select('*')
    .eq('horseman_type', primaryHorseman)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (stratError) throw stratError;
  if (!topStrategy) throw new Error(`No active strategy found for horseman: ${primaryHorseman}`);

  const planTitle = getAutoPlanTitle(primaryHorseman);
  const description = (topStrategy as Record<string, unknown>).description as string || '';
  const impactStr = (topStrategy as Record<string, unknown>).estimated_impact as string || '';

  // Extract steps from strategy description
  const steps = extractStepsFromContent(description);

  // Parse estimated impact from the string (e.g. "$500-5,000/year")
  const impact = parseEstimatedImpact(impactStr);

  const planContent: PlanContent = {
    steps,
    summary: description.substring(0, 500),
    horseman: [primaryHorseman],
    disclaimer: 'This information is for educational purposes only and does not constitute tax, legal, or financial advice.',
    completedSteps: [],
    estimated_impact: { low: impact.low, high: impact.high, source: 'strategy_definition' },
  };

  // Create plan via mutation if available, otherwise direct insert
  let plan: SavedPlan;
  if (createPlan) {
    plan = await createPlan({
      title: planTitle,
      strategy_id: topStrategy.id,
      strategy_name: (topStrategy as Record<string, unknown>).name as string || 'Recovery Strategy',
      content: planContent,
    });
  } else {
    const { data, error } = await supabase
      .from('saved_plans')
      .insert({
        user_id: userId,
        title: planTitle,
        strategy_id: topStrategy.id,
        strategy_name: (topStrategy as Record<string, unknown>).name as string || 'Recovery Strategy',
        content: planContent as unknown as Record<string, unknown>,
      })
      .select()
      .single();
    if (error) throw error;
    plan = data as unknown as SavedPlan;
  }

  // Set as focus plan
  await supabase
    .from('saved_plans')
    .update({ is_focus: true })
    .eq('id', plan.id);

  // Activate the strategy
  await supabase
    .from('user_active_strategies')
    .insert({
      user_id: userId,
      strategy_id: topStrategy.id,
      status: 'active',
    });

  return plan;
}
