import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { number: 1, label: 'Profile' },
  { number: 2, label: 'Habits' },
  { number: 3, label: 'Screenings' },
  { number: 4, label: 'Goals' },
  { number: 5, label: 'Contact' },
];

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-1 bg-secondary">
          <div
            className="h-full bg-gradient-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isUpcoming = currentStep < step.number;
            return (
              <div key={step.number} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground shadow-md',
                    isCurrent && 'bg-primary text-primary-foreground shadow-lg scale-110',
                    isUpcoming && 'bg-secondary text-muted-foreground'
                  )}
                >
                  {step.number}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors',
                    (isCompleted || isCurrent) && 'text-foreground',
                    isUpcoming && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
