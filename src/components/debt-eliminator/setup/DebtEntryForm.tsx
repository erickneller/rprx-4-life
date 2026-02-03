import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DEBT_TYPE_LABELS, type DebtEntryFormData } from "@/lib/debtTypes";

interface DebtEntryFormProps {
  debt: DebtEntryFormData;
  index: number;
  onChange: (index: number, debt: DebtEntryFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function DebtEntryForm({
  debt,
  index,
  onChange,
  onRemove,
  canRemove,
}: DebtEntryFormProps) {
  const updateField = <K extends keyof DebtEntryFormData>(
    field: K,
    value: DebtEntryFormData[K]
  ) => {
    onChange(index, { ...debt, [field]: value });
  };

  const handleNumberChange = (
    field: "original_balance" | "current_balance" | "interest_rate" | "min_payment",
    value: string
  ) => {
    const num = parseFloat(value) || 0;
    updateField(field, num);
    
    // Auto-sync current balance with original if current is empty/zero
    if (field === "original_balance" && debt.current_balance === 0) {
      onChange(index, { ...debt, original_balance: num, current_balance: num });
    }
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {DEBT_TYPE_LABELS[debt.debt_type]}
          </span>
          <span className="text-xs text-muted-foreground">#{index + 1}</span>
        </div>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor={`name-${index}`}>Account Name</Label>
          <Input
            id={`name-${index}`}
            placeholder="e.g., Chase Sapphire, Sallie Mae"
            value={debt.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`original-${index}`}>Original Balance</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id={`original-${index}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={debt.original_balance || ""}
                onChange={(e) =>
                  handleNumberChange("original_balance", e.target.value)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`current-${index}`}>Current Balance</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id={`current-${index}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={debt.current_balance || ""}
                onChange={(e) =>
                  handleNumberChange("current_balance", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`rate-${index}`}>Interest Rate (APR)</Label>
            <div className="relative">
              <Input
                id={`rate-${index}`}
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
                className="pr-7"
                value={debt.interest_rate || ""}
                onChange={(e) =>
                  handleNumberChange("interest_rate", e.target.value)
                }
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`min-${index}`}>Minimum Payment</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id={`min-${index}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7"
                value={debt.min_payment || ""}
                onChange={(e) =>
                  handleNumberChange("min_payment", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
