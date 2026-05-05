import type { PlanContent } from '@/hooks/usePlans';

export interface RenderBlocks {
  headline?: string;
  quick_win?: string;
  checklist?: string[];
  risk_alerts?: string[];
}

export interface ParsedStrategy {
  strategyId?: string;
  strategyName: string;
  content: PlanContent;
  renderBlocks?: RenderBlocks;
}

export interface ParsedMultiPlan {
  overviewMd: string;
  plans: ParsedStrategy[];
}

function buildParsedFromV1(parsed: any): ParsedStrategy | null {
  if (!parsed || parsed.plan_schema !== 'v1') return null;
  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) return null;
  return {
    strategyId: typeof parsed.strategy_id === 'string' ? parsed.strategy_id : undefined,
    strategyName: typeof parsed.strategy_name === 'string' ? parsed.strategy_name : 'Implementation Plan',
    content: {
      steps: parsed.steps,
      summary: parsed.summary,
      horseman: Array.isArray(parsed.horseman)
        ? parsed.horseman.map(String)
        : (parsed.horseman ? [String(parsed.horseman)] : undefined),
      disclaimer: parsed.disclaimer,
      completedSteps: [],
      plan_schema: 'v1',
      expected_result: parsed.expected_result,
      before_you_start: Array.isArray(parsed.before_you_start) ? parsed.before_you_start : undefined,
      risks_and_mistakes_to_avoid: Array.isArray(parsed.risks_and_mistakes_to_avoid) ? parsed.risks_and_mistakes_to_avoid : undefined,
      advisor_packet: Array.isArray(parsed.advisor_packet) ? parsed.advisor_packet : undefined,
      savings: parsed.expected_result?.impact_range,
    },
    renderBlocks: parsed.render_blocks && typeof parsed.render_blocks === 'object'
      ? {
          headline: typeof parsed.render_blocks.headline === 'string' ? parsed.render_blocks.headline : undefined,
          quick_win: typeof parsed.render_blocks.quick_win === 'string' ? parsed.render_blocks.quick_win : undefined,
          checklist: Array.isArray(parsed.render_blocks.checklist) ? parsed.render_blocks.checklist.map(String) : undefined,
          risk_alerts: Array.isArray(parsed.render_blocks.risk_alerts) ? parsed.render_blocks.risk_alerts.map(String) : undefined,
        }
      : undefined,
  };
}

function readJsonBlock(messageContent: string): any | null {
  const jsonBlockMatch = messageContent.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!jsonBlockMatch) return null;
  try { return JSON.parse(jsonBlockMatch[1]); } catch { return null; }
}

/**
 * Parses assistant messages for an embedded `plan_schema: "v1"` JSON block.
 * Returns the first plan if a `v1-multi` envelope is present.
 */
export function parseStrategyFromMessage(messageContent: string, _lenient = false): ParsedStrategy | null {
  const parsed = readJsonBlock(messageContent);
  if (!parsed) return null;
  if (parsed.plan_schema === 'v1-multi' && Array.isArray(parsed.plans) && parsed.plans.length > 0) {
    return buildParsedFromV1(parsed.plans[0]);
  }
  return buildParsedFromV1(parsed);
}

/**
 * Parses the full multi-plan envelope from an assistant message.
 * Returns null if the message is not a `v1-multi` envelope.
 */
export function parseMultiPlanFromMessage(messageContent: string): ParsedMultiPlan | null {
  const parsed = readJsonBlock(messageContent);
  if (!parsed || parsed.plan_schema !== 'v1-multi' || !Array.isArray(parsed.plans)) return null;
  const plans = parsed.plans
    .map((p: any) => buildParsedFromV1(p))
    .filter((p: ParsedStrategy | null): p is ParsedStrategy => p !== null);
  if (plans.length === 0) return null;
  return {
    overviewMd: typeof parsed.overview_md === 'string' ? parsed.overview_md : '',
    plans,
  };
}
