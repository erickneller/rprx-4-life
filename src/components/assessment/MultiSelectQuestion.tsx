import { Checkbox } from '@/components/ui/checkbox';

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
      {options.map((opt) => {
        const checked = value.includes(opt.value);
        return (
          <div
            key={opt.value}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer select-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => toggle(opt.value)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggle(opt.value);
              }
            }}
          >
            <Checkbox
              checked={checked}
              tabIndex={-1}
              className="pointer-events-none"
            />
            <span className="pointer-events-none flex-1 text-sm font-medium">
              {opt.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
