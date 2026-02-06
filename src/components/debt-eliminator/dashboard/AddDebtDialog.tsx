import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { DebtType, DebtEntryFormData } from "@/lib/debtTypes";
import { DEBT_TYPE_LABELS, createEmptyDebtEntry } from "@/lib/debtTypes";

interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DebtEntryFormData) => void;
  isLoading?: boolean;
}

const DEBT_TYPES: DebtType[] = [
  "credit_card",
  "student_loan",
  "auto_loan",
  "mortgage",
  "personal_loan",
  "medical",
  "other",
];

export function AddDebtDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: AddDebtDialogProps) {
  const [formData, setFormData] = useState<DebtEntryFormData>(createEmptyDebtEntry());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (formData.original_balance <= 0) {
      newErrors.original_balance = "Original balance must be greater than 0";
    }
    if (formData.current_balance < 0) {
      newErrors.current_balance = "Current balance cannot be negative";
    }
    if (formData.current_balance > formData.original_balance) {
      newErrors.current_balance = "Current balance cannot exceed original balance";
    }
    if (formData.interest_rate < 0) {
      newErrors.interest_rate = "Interest rate cannot be negative";
    }
    if (formData.min_payment < 0) {
      newErrors.min_payment = "Minimum payment cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData(createEmptyDebtEntry());
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData(createEmptyDebtEntry());
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Debt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debt_type">Debt Type</Label>
            <Select
              value={formData.debt_type}
              onValueChange={(value: DebtType) =>
                setFormData({ ...formData, debt_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select debt type" />
              </SelectTrigger>
              <SelectContent>
                {DEBT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {DEBT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Chase Sapphire Card"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_balance">Original Balance ($)</Label>
              <Input
                id="original_balance"
                type="number"
                min="0"
                step="0.01"
                value={formData.original_balance || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    original_balance: parseFloat(e.target.value) || 0,
                  })
                }
              />
              {errors.original_balance && (
                <p className="text-sm text-destructive">{errors.original_balance}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_balance">Current Balance ($)</Label>
              <Input
                id="current_balance"
                type="number"
                min="0"
                step="0.01"
                value={formData.current_balance || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_balance: parseFloat(e.target.value) || 0,
                  })
                }
              />
              {errors.current_balance && (
                <p className="text-sm text-destructive">{errors.current_balance}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Interest Rate (%)</Label>
              <Input
                id="interest_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.interest_rate || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interest_rate: parseFloat(e.target.value) || 0,
                  })
                }
              />
              {errors.interest_rate && (
                <p className="text-sm text-destructive">{errors.interest_rate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_payment">Min Payment ($)</Label>
              <Input
                id="min_payment"
                type="number"
                min="0"
                step="0.01"
                value={formData.min_payment || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_payment: parseFloat(e.target.value) || 0,
                  })
                }
              />
              {errors.min_payment && (
                <p className="text-sm text-destructive">{errors.min_payment}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Debt"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
