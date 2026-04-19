import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Clock, Target } from 'lucide-react';
import type { StructuredPlanStep } from '@/hooks/usePlans';

interface PlanChecklistProps {
  steps: Array<string | StructuredPlanStep>;
  completedSteps: number[];
  onToggleStep: (stepIndex: number) => void;
  disabled?: boolean;
}

/** Strip markdown bold markers from text */
function cleanStepText(text: string): string {
  return text.replace(/\*\*/g, '').trim();
}

function isStructuredStep(s: string | StructuredPlanStep): s is StructuredPlanStep {
  return typeof s === 'object' && s !== null && 'instruction' in s;
}

export function PlanChecklist({ steps, completedSteps, onToggleStep, disabled }: PlanChecklistProps) {
  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const structured = isStructuredStep(step);
        const title = structured ? cleanStepText(step.title) : null;
        const body = structured ? cleanStepText(step.instruction) : cleanStepText(step as string);

        return (
          <div
            key={index}
            className={cn(
              'group flex items-start gap-3 py-3 px-3 rounded-lg transition-colors cursor-pointer',
              isCompleted ? 'bg-muted/40' : 'hover:bg-muted/30',
            )}
            onClick={() => !disabled && onToggleStep(index)}
          >
            <div className="pt-0.5 shrink-0">
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onToggleStep(index)}
                disabled={disabled}
                className="pointer-events-none"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold text-muted-foreground shrink-0 pt-px">
                  {index + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  {title && (
                    <div
                      className={cn(
                        'text-sm font-semibold leading-snug',
                        isCompleted && 'text-muted-foreground line-through',
                      )}
                    >
                      {title}
                    </div>
                  )}
                  <div
                    className={cn(
                      'text-sm leading-relaxed',
                      title ? 'text-muted-foreground mt-0.5' : '',
                      isCompleted && 'text-muted-foreground line-through',
                    )}
                  >
                    {body}
                  </div>
                  {structured && (step.time_estimate || step.done_definition) && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {step.time_estimate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cleanStepText(step.time_estimate)}
                        </span>
                      )}
                      {step.done_definition && (
                        <span className="inline-flex items-start gap-1">
                          <Target className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>Done when: {cleanStepText(step.done_definition)}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
