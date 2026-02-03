import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { DebtEntryForm } from "./DebtEntryForm";
import {
  type DebtType,
  type DebtEntryFormData,
  createEmptyDebtEntry,
  DEBT_TYPE_LABELS,
  formatCurrency,
} from "@/lib/debtTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface DebtEntryStepProps {
  selectedTypes: DebtType[];
  debts: DebtEntryFormData[];
  onDebtsChange: (debts: DebtEntryFormData[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DebtEntryStep({
  selectedTypes,
  debts,
  onDebtsChange,
  onNext,
  onBack,
}: DebtEntryStepProps) {
  const [addingType, setAddingType] = useState<DebtType | "">("");

  const handleDebtChange = (index: number, debt: DebtEntryFormData) => {
    const updated = [...debts];
    updated[index] = debt;
    onDebtsChange(updated);
  };

  const handleRemoveDebt = (index: number) => {
    onDebtsChange(debts.filter((_, i) => i !== index));
  };

  const handleAddDebt = () => {
    if (addingType) {
      onDebtsChange([...debts, createEmptyDebtEntry(addingType)]);
      setAddingType("");
    }
  };

  const totalDebt = debts.reduce((sum, d) => sum + d.current_balance, 0);

  const isValid = debts.length > 0 && debts.every(
    (d) => d.name.trim() && d.original_balance > 0 && d.current_balance >= 0
  );

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Add Your Debts</h2>
        <p className="text-muted-foreground">
          Enter the details for each debt you want to track. Be as accurate as
          possible for better insights.
        </p>
      </div>

      {/* Debt summary */}
      {debts.length > 0 && (
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Debt to Eliminate</p>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(totalDebt)}
          </p>
          <p className="text-sm text-muted-foreground">
            across {debts.length} account{debts.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Debt forms */}
      <div className="space-y-4">
        {debts.map((debt, index) => (
          <DebtEntryForm
            key={index}
            debt={debt}
            index={index}
            onChange={handleDebtChange}
            onRemove={handleRemoveDebt}
            canRemove={debts.length > 1}
          />
        ))}
      </div>

      {/* Add another debt */}
      <div className="flex items-center gap-2">
        <Select
          value={addingType}
          onValueChange={(v) => setAddingType(v as DebtType)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Add another debt..." />
          </SelectTrigger>
          <SelectContent>
            {selectedTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {DEBT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={handleAddDebt}
          disabled={!addingType}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
