import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface PlanChecklistProps {
  steps: string[];
  completedSteps: number[];
  onToggleStep: (stepIndex: number) => void;
  disabled?: boolean;
}

/** Strip markdown bold markers from text */
function cleanStepText(text: string): string {
  return text.replace(/\*\*/g, '').trim();
}

export function PlanChecklist({ steps, completedSteps, onToggleStep, disabled }: PlanChecklistProps) {
  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const cleanText = cleanStepText(step);

        return (
          <div
            key={index}
            className={cn(
              "group flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors cursor-pointer",
              isCompleted
                ? "bg-muted/40"
                : "hover:bg-muted/30"
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
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-sm font-semibold text-muted-foreground shrink-0 pt-px">
                {index + 1}.
              </span>
              <span
                className={cn(
                  "text-sm leading-relaxed",
                  isCompleted && "text-muted-foreground line-through"
                )}
              >
                {cleanText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
