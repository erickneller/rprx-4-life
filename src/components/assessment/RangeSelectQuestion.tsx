import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { QuestionOption } from '@/lib/assessmentTypes';

interface RangeSelectQuestionProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

export function RangeSelectQuestion({
  options,
  value,
  onChange,
}: RangeSelectQuestionProps) {
  return (
    <RadioGroup value={value || ''} onValueChange={onChange} className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <div
          key={option.value}
          className={cn(
            'flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer',
            value === option.value
              ? 'border-primary bg-primary/5'
              : 'border-border'
          )}
          onClick={() => onChange(option.value)}
        >
          <RadioGroupItem value={option.value} id={option.value} />
          <Label htmlFor={option.value} className="flex-1 cursor-pointer text-sm">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
