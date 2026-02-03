import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  CreditCard,
  GraduationCap,
  Car,
  Home,
  Banknote,
  Stethoscope,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DebtType } from "@/lib/debtTypes";
import { DEBT_TYPE_LABELS } from "@/lib/debtTypes";

interface GoalSelectionStepProps {
  selectedTypes: DebtType[];
  onSelect: (types: DebtType[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEBT_TYPE_CONFIG: {
  type: DebtType;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    type: "credit_card",
    icon: <CreditCard className="h-6 w-6" />,
    color: "bg-red-500/10 border-red-500/30 hover:border-red-500",
  },
  {
    type: "student_loan",
    icon: <GraduationCap className="h-6 w-6" />,
    color: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500",
  },
  {
    type: "auto_loan",
    icon: <Car className="h-6 w-6" />,
    color: "bg-orange-500/10 border-orange-500/30 hover:border-orange-500",
  },
  {
    type: "mortgage",
    icon: <Home className="h-6 w-6" />,
    color: "bg-green-500/10 border-green-500/30 hover:border-green-500",
  },
  {
    type: "personal_loan",
    icon: <Banknote className="h-6 w-6" />,
    color: "bg-purple-500/10 border-purple-500/30 hover:border-purple-500",
  },
  {
    type: "medical",
    icon: <Stethoscope className="h-6 w-6" />,
    color: "bg-pink-500/10 border-pink-500/30 hover:border-pink-500",
  },
  {
    type: "other",
    icon: <CircleDot className="h-6 w-6" />,
    color: "bg-gray-500/10 border-gray-500/30 hover:border-gray-500",
  },
];

export function GoalSelectionStep({
  selectedTypes,
  onSelect,
  onNext,
  onBack,
}: GoalSelectionStepProps) {
  const toggleType = (type: DebtType) => {
    if (selectedTypes.includes(type)) {
      onSelect(selectedTypes.filter((t) => t !== type));
    } else {
      onSelect([...selectedTypes, type]);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          What debts are you tackling?
        </h2>
        <p className="text-muted-foreground">
          Select all the debt types you want to eliminate. You'll add specific
          accounts next.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {DEBT_TYPE_CONFIG.map(({ type, icon, color }) => {
          const isSelected = selectedTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                color,
                isSelected &&
                  "ring-2 ring-accent ring-offset-2 ring-offset-background border-accent"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 bg-accent rounded-full p-0.5">
                  <Check className="h-3 w-3 text-accent-foreground" />
                </div>
              )}
              {icon}
              <span className="text-sm font-medium text-foreground">
                {DEBT_TYPE_LABELS[type]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={selectedTypes.length === 0}
          className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
