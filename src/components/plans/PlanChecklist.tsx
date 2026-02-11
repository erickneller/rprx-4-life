import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface PlanChecklistProps {
  steps: string[];
  completedSteps: number[];
  onToggleStep: (stepIndex: number) => void;
  disabled?: boolean;
}

export function PlanChecklist({ steps, completedSteps, onToggleStep, disabled }: PlanChecklistProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);

        return (
          <div
            key={index}
            className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors opacity-50",

            isCompleted ? "bg-muted/50 border-muted" : "bg-background border-border hover:border-primary/50"
            )}>

            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => onToggleStep(index)}
              disabled={disabled}
              className={cn(
                "mt-0.5",
                isCompleted && "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              )} />

            <span
              className={cn(
                "text-sm leading-relaxed",
                isCompleted && "text-muted-foreground line-through"
              )}>

              {step}
            </span>
          </div>);

      })}
    </div>);

}