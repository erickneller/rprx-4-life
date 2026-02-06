import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuestionOption } from '@/lib/assessmentTypes';

interface YesNoQuestionProps {
  options: QuestionOption[];
  value: string | undefined;
  onChange: (value: string) => void;
}

export function YesNoQuestion({ options, value, onChange }: YesNoQuestionProps) {
  const yesOption = options.find((opt) => opt.value === 'yes');
  const noOption = options.find((opt) => opt.value === 'no');

  return (
    <div className="flex gap-4 pt-4">
      <Button
        type="button"
        variant="outline"
        className={cn(
          'flex-1 h-16 text-lg gap-2',
          value === 'yes' && 'bg-success text-success-foreground border-success ring-2 ring-success ring-offset-2 hover:bg-success/90'
        )}
        onClick={() => onChange('yes')}
      >
        <Check className="h-5 w-5" />
        {yesOption?.label || 'Yes'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className={cn(
          'flex-1 h-16 text-lg gap-2',
          value === 'no' && 'bg-success text-success-foreground border-success ring-2 ring-success ring-offset-2 hover:bg-success/90'
        )}
        onClick={() => onChange('no')}
      >
        <X className="h-5 w-5" />
        {noOption?.label || 'No'}
      </Button>
    </div>
  );
}
