import type { SavedPlan, PlanContent } from '@/hooks/usePlans';

export interface MoneyLeakResult {
  totalLeakLow: number;
  totalLeakHigh: number;
  totalRecovered: number;
  leakByHorseman: {
    interest: { low: number; high: number; recovered: number };
    taxes: { low: number; high: number; recovered: number };
    insurance: { low: number; high: number; recovered: number };
    education: { low: number; high: number; recovered: number };
  };
  topLeaks: LeakItem[];
  percentRecovered: number;
  focusedPlanProgress: number;
}

export interface LeakItem {
  planId: string;
  planTitle: string;
  horsemen: string[];
  estimatedImpactLow: number;
  estimatedImpactHigh: number;
  status: 'not_started' | 'in_progress' | 'completed';
  stepsTotal: number;
  stepsCompleted: number;
}

const DEFAULT_IMPACT = { low: 500, high: 2000 };

export function parseEstimatedImpact(impact: string | null | undefined): { low: number; high: number } {
  if (!impact || typeof impact !== 'string') return { low: 250, high: 1000 };

  const cleaned = impact.replace(/[$,]/g, '');
  const isMonthly = /\/month/i.test(cleaned);
  const multiplier = isMonthly ? 12 : 1;

  // Try to find two numbers like "500-3000" or "500 to 3000"
  const rangeMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[-–—to]+\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]) * multiplier;
    const high = parseFloat(rangeMatch[2]) * multiplier;
    return { low: Math.round(low), high: Math.round(high) };
  }

  // Single number like "$1,000+"
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]) * multiplier;
    return { low: Math.round(val * 0.5), high: Math.round(val * 2) };
  }

  // Keyword fallbacks
  if (/thousands/i.test(impact)) return { low: 1000, high: 5000 };
  if (/hundreds/i.test(impact)) return { low: 200, high: 800 };

  return { low: 250, high: 1000 };
}

type HorsemanKey = 'interest' | 'taxes' | 'insurance' | 'education';

function normalizeHorseman(h: string): HorsemanKey | null {
  const lower = h.toLowerCase().trim();
  if (lower === 'interest' || lower === 'debt') return 'interest';
  if (lower === 'taxes' || lower === 'tax') return 'taxes';
  if (lower === 'insurance') return 'insurance';
  if (lower === 'education') return 'education';
  return null;
}

export function calculateMoneyLeak(
  allPlans: SavedPlan[],
  focusedPlan: SavedPlan | null
): MoneyLeakResult {
  const leakByHorseman = {
    interest: { low: 0, high: 0, recovered: 0 },
    taxes: { low: 0, high: 0, recovered: 0 },
    insurance: { low: 0, high: 0, recovered: 0 },
    education: { low: 0, high: 0, recovered: 0 },
  };

  let totalLeakLow = 0;
  let totalLeakHigh = 0;
  let totalRecovered = 0;

  const leakItems: LeakItem[] = [];

  for (const plan of allPlans) {
    const content = plan.content;
    const impact = content.estimated_impact;
    const low = impact?.low ?? DEFAULT_IMPACT.low;
    const high = impact?.high ?? DEFAULT_IMPACT.high;
    const midpoint = (low + high) / 2;

    const steps = Array.isArray(content.steps) ? content.steps : [];
    const completedSteps = Array.isArray(content.completedSteps) ? content.completedSteps : [];
    const stepsTotal = steps.length;
    const stepsCompleted = completedSteps.length;

    const isCompleted = plan.status === 'completed' || (stepsTotal > 0 && stepsCompleted === stepsTotal);
    const isInProgress = !isCompleted && stepsCompleted > 0;

    let recovered = 0;
    if (isCompleted) {
      recovered = midpoint;
    } else if (isInProgress && stepsTotal > 0) {
      recovered = midpoint * (stepsCompleted / stepsTotal);
    }

    totalLeakLow += low;
    totalLeakHigh += high;
    totalRecovered += recovered;

    // Group by horseman
    const horsemen = content.horseman
      ? content.horseman.map(normalizeHorseman).filter(Boolean) as HorsemanKey[]
      : [];

    const splitCount = horsemen.length || 1;
    if (horsemen.length > 0) {
      for (const h of horsemen) {
        leakByHorseman[h].low += low / splitCount;
        leakByHorseman[h].high += high / splitCount;
        leakByHorseman[h].recovered += recovered / splitCount;
      }
    }

    leakItems.push({
      planId: plan.id,
      planTitle: plan.title,
      horsemen: horsemen.length > 0 ? horsemen : ['unknown'],
      estimatedImpactLow: low,
      estimatedImpactHigh: high,
      status: isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'not_started',
      stepsTotal,
      stepsCompleted,
    });
  }

  const totalMidpoint = (totalLeakLow + totalLeakHigh) / 2;
  const percentRecovered = totalMidpoint > 0 ? (totalRecovered / totalMidpoint) * 100 : 0;

  // Focused plan progress
  let focusedPlanProgress = 0;
  if (focusedPlan) {
    const fc = focusedPlan.content;
    const fSteps = fc.steps || [];
    const fCompleted = fc.completedSteps || [];
    focusedPlanProgress = fSteps.length > 0 ? Math.round((fCompleted.length / fSteps.length) * 100) : 0;
  }

  // Top 5 sorted by highest impact
  const topLeaks = leakItems
    .sort((a, b) => b.estimatedImpactHigh - a.estimatedImpactHigh)
    .slice(0, 5);

  return {
    totalLeakLow: Math.round(totalLeakLow),
    totalLeakHigh: Math.round(totalLeakHigh),
    totalRecovered: Math.round(totalRecovered),
    leakByHorseman,
    topLeaks,
    percentRecovered: Math.round(percentRecovered),
    focusedPlanProgress,
  };
}
