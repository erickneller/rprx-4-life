import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { QuestionOption } from '@/lib/assessmentTypes';

interface SliderQuestionProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

export function SliderQuestion({ options, value, onChange }: SliderQuestionProps) {
  const currentIndex = value ? options.findIndex((opt) => opt.value === value) : 0;

  const handleValueChange = (values: number[]) => {
    const index = values[0];
    if (options[index]) {
      onChange(options[index].value);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <Slider
        value={[currentIndex >= 0 ? currentIndex : 0]}
        min={0}
        max={options.length - 1}
        step={1}
        onValueChange={handleValueChange}
        className="w-full"
      />
      <div className="flex justify-between">
        {options.map((option, index) => (
          <span
            key={option.value}
            className={cn(
              'text-sm transition-colors',
              currentIndex === index
                ? 'text-primary font-medium'
                : 'text-muted-foreground'
            )}
          >
            {option.label}
          </span>
        ))}
      </div>
    </div>
  );
}
