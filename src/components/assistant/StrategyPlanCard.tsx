import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Clock, Target, Zap, AlertTriangle, ClipboardCheck, ListChecks } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { PlanContent, StructuredPlanStep } from '@/hooks/usePlans';
import type { RenderBlocks } from '@/lib/strategyParser';

interface StrategyPlanCardProps {
  strategyId?: string;
  strategyName: string;
  content: PlanContent;
  renderBlocks?: RenderBlocks;
}

function clean(text: string | undefined | null): string {
  if (!text) return '';
  return String(text).replace(/\*\*/g, '').trim();
}

function isStructured(s: string | StructuredPlanStep): s is StructuredPlanStep {
  return typeof s === 'object' && s !== null && 'instruction' in s;
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  defaultOpen?: boolean;
}

function CollapsibleSection({ icon, title, items, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (!items || items.length === 0) return null;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold',
          'bg-background/60 hover:bg-background border border-border/60 transition-colors',
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-primary shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
          <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pt-2 pb-1">
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground/90">
          {items.map((item, i) => (
            <li key={i} className="leading-relaxed break-words">{clean(item)}</li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

const GENERIC_HEADLINES = new Set([
  'lower your tax bill with a few targeted moves',
  'cut interest costs and free up monthly cash flow',
  'stretch your education savings with smarter contributions',
  'right-size your insurance coverage and premiums',
  'make a measurable improvement to your finances',
]);

function isGenericHeadline(h: string): boolean {
  const norm = h.toLowerCase().replace(/[.!?]+$/, '').trim();
  return GENERIC_HEADLINES.has(norm);
}

export function StrategyPlanCard({ strategyId, strategyName, content, renderBlocks }: StrategyPlanCardProps) {
  const rawHeadline = clean(renderBlocks?.headline);
  const cleanedName = clean(strategyName);
  const headline = (!rawHeadline || isGenericHeadline(rawHeadline)) && cleanedName
    ? cleanedName
    : (rawHeadline || cleanedName);
  const summary = clean(content.summary);
  const quickWin = clean(renderBlocks?.quick_win) ||
    (content.expected_result
      ? `${clean(content.expected_result.impact_range) || 'Varies'} • first win in ${clean(content.expected_result.first_win_timeline) || '14–30 days'}`
      : '');

  const riskItems =
    (renderBlocks?.risk_alerts && renderBlocks.risk_alerts.length > 0
      ? renderBlocks.risk_alerts
      : (content.risks_and_mistakes_to_avoid || []).slice(0, 3));

  return (
    <Card className="border-primary/20 bg-card overflow-hidden">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {(content.horseman || []).map((h) => (
            <Badge key={h} variant="secondary" className="text-xs">
              {h}
            </Badge>
          ))}
          {strategyId && (
            <Badge variant="outline" className="text-xs font-mono">
              {strategyId}
            </Badge>
          )}
        </div>
        <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground break-words">
          {headline}
        </h3>
        {summary && (
          <p className="text-sm text-muted-foreground leading-relaxed break-words">
            {summary}
          </p>
        )}
        {quickWin && (
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium w-fit max-w-full">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{quickWin}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Steps */}
        {content.steps && content.steps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ListChecks className="h-4 w-4 text-primary" />
              Your plan
            </div>
            <ol className="space-y-3">
              {content.steps.map((step, idx) => {
                const structured = isStructured(step);
                const title = structured ? clean(step.title) : '';
                const body = structured ? clean(step.instruction) : clean(step as string);
                return (
                  <li key={idx} className="flex gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      {title && (
                        <div className="text-sm font-semibold text-foreground leading-snug break-words">
                          {title}
                        </div>
                      )}
                      {body && (
                        <p className="text-sm text-foreground/85 leading-relaxed break-words">
                          {body}
                        </p>
                      )}
                      {structured && (step.time_estimate || step.done_definition) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                          {step.time_estimate && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {clean(step.time_estimate)}
                            </span>
                          )}
                          {step.done_definition && (
                            <span className="inline-flex items-start gap-1 min-w-0">
                              <Target className="h-3 w-3 mt-0.5 shrink-0" />
                              <span className="break-words">Done when: {clean(step.done_definition)}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <Separator />

        {/* Collapsible sections */}
        <div className="space-y-2">
          <CollapsibleSection
            icon={<ClipboardCheck className="h-4 w-4" />}
            title="Before you start"
            items={content.before_you_start || []}
          />
          <CollapsibleSection
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Watch out for"
            items={riskItems}
          />
          <CollapsibleSection
            icon={<ClipboardCheck className="h-4 w-4" />}
            title="Bring to your advisor"
            items={content.advisor_packet || []}
          />
        </div>

        {content.disclaimer && (
          <p className="text-xs italic text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
            {clean(content.disclaimer)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
