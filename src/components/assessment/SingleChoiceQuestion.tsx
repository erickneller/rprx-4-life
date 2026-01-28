import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { QuestionOption } from '@/lib/assessmentTypes';

interface SingleChoiceQuestionProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

export function SingleChoiceQuestion({
  options,
  value,
  onChange,
}: SingleChoiceQuestionProps) {
  return (
    <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-3">
      {options.map((option) => (
        <div
          key={option.value}
          className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => onChange(option.value)}
        >
          <RadioGroupItem value={option.value} id={option.value} />
          <Label htmlFor={option.value} className="flex-1 cursor-pointer">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
