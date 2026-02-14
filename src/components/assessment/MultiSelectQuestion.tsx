import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectQuestionProps {
  options: Option[];
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

export function MultiSelectQuestion({ options, value = [], onChange }: MultiSelectQuestionProps) {
  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <div
          key={opt.value}
          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={() => toggle(opt.value)}
        >
          <Checkbox
            checked={value.includes(opt.value)}
            onCheckedChange={() => toggle(opt.value)}
            id={`ms-${opt.value}`}
          />
          <Label htmlFor={`ms-${opt.value}`} className="cursor-pointer flex-1 text-sm font-medium">
            {opt.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
