import type { PlanContent } from '@/hooks/usePlans';

export interface RenderBlocks {
  headline?: string;
  quick_win?: string;
  checklist?: string[];
  risk_alerts?: string[];
}

interface ParsedStrategy {
  strategyId?: string;
  strategyName: string;
  content: PlanContent;
  renderBlocks?: RenderBlocks;
}

/**
 * Parses assistant messages for an embedded `plan_schema: "v1"` JSON block.
 * Strict: returns null unless a valid v1 plan with non-empty steps is found.
 * The legacy regex/marker fallback was removed in favor of a single contract.
 *
 * The `lenient` flag is preserved for callers but no longer changes behavior;
 * if no JSON v1 plan is present, the caller should build a fallback card
 * from the catalog/profile, not reconstruct one from prose.
 */
export function parseStrategyFromMessage(messageContent: string, _lenient = false): ParsedStrategy | null {
  const jsonBlockMatch = messageContent.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!jsonBlockMatch) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(jsonBlockMatch[1]);
  } catch {
    return null;
  }

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
