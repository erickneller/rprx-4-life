import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import type { UserDebt } from "@/lib/debtTypes";
import { DEBT_TYPE_LABELS } from "@/lib/debtTypes";

interface EditDebtDialogProps {
  debt: UserDebt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (debtId: string, updates: Partial<UserDebt>) => void;
  onDelete: (debtId: string) => void;
  isLoading?: boolean;
  isDeleting?: boolean;
}

export function EditDebtDialog({
  debt,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  isLoading,
  isDeleting,
}: EditDebtDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    original_balance: 0,
    current_balance: 0,
    interest_rate: 0,
    min_payment: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name,
        original_balance: debt.original_balance,
        current_balance: debt.current_balance,
        interest_rate: debt.interest_rate,
        min_payment: debt.min_payment,
      });
    }
  }, [debt]);

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
    if (debt && validateForm()) {
      onSubmit(debt.id, formData);
    }
  };

  const handleClose = () => {
    setErrors({});
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (debt) {
      onDelete(debt.id);
      setShowDeleteConfirm(false);
    }
  };

  if (!debt) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Debt</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Debt Type</Label>
              <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                {DEBT_TYPE_LABELS[debt.debt_type]}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-original_balance">Original Balance ($)</Label>
                <Input
                  id="edit-original_balance"
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
                <Label htmlFor="edit-current_balance">Current Balance ($)</Label>
                <Input
                  id="edit-current_balance"
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
                <Label htmlFor="edit-interest_rate">Interest Rate (%)</Label>
                <Input
                  id="edit-interest_rate"
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
                <Label htmlFor="edit-min_payment">Min Payment ($)</Label>
                <Input
                  id="edit-min_payment"
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

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="sm:mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{debt.name}"? This action cannot be
              undone and will also remove all payment history for this debt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
