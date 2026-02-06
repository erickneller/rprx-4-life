import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { DebtJourney, UserDebt, SetupWizardData, DebtEntryFormData } from "@/lib/debtTypes";
import { useToast } from "@/hooks/use-toast";

export function useDebtJourney() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active journey
  const {
    data: journey,
    isLoading: journeyLoading,
    error: journeyError,
  } = useQuery({
    queryKey: ["debt-journey", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("debt_journeys")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data as DebtJourney | null;
    },
    enabled: !!user?.id,
  });

  // Fetch debts for active journey
  const {
    data: debts,
    isLoading: debtsLoading,
    error: debtsError,
  } = useQuery({
    queryKey: ["user-debts", journey?.id],
    queryFn: async () => {
      if (!journey?.id) return [];

      const { data, error } = await supabase
        .from("user_debts")
        .select("*")
        .eq("journey_id", journey.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as UserDebt[];
    },
    enabled: !!journey?.id,
  });

  // Create new journey with debts
  const createJourney = useMutation({
    mutationFn: async (wizardData: SetupWizardData) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Create journey
      const { data: journeyData, error: journeyError } = await supabase
        .from("debt_journeys")
        .insert({
          user_id: user.id,
          dream_text: wizardData.dreamText,
          dream_image_url: wizardData.dreamImageUrl,
          status: "active",
        })
        .select()
        .single();

      if (journeyError) throw journeyError;

      // Create debts
      const debtsToInsert = wizardData.debts.map((debt) => ({
        journey_id: journeyData.id,
        user_id: user.id,
        debt_type: debt.debt_type,
        name: debt.name,
        original_balance: debt.original_balance,
        current_balance: debt.current_balance,
        interest_rate: debt.interest_rate,
        min_payment: debt.min_payment,
      }));

      const { error: debtsError } = await supabase
        .from("user_debts")
        .insert(debtsToInsert);

      if (debtsError) throw debtsError;

      return journeyData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt-journey"] });
      queryClient.invalidateQueries({ queryKey: ["user-debts"] });
      toast({
        title: "Journey started!",
        description: "Your debt elimination journey has begun.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create journey. Please try again.",
        variant: "destructive",
      });
      console.error("Create journey error:", error);
    },
  });

  // Update journey (dream, status)
  const updateJourney = useMutation({
    mutationFn: async (updates: Partial<DebtJourney>) => {
      if (!journey?.id) throw new Error("No active journey");

      const { data, error } = await supabase
        .from("debt_journeys")
        .update(updates)
        .eq("id", journey.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debt-journey"] });
    },
  });

  // Add a new debt to the active journey
  const addDebt = useMutation({
    mutationFn: async (debtData: DebtEntryFormData) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (!journey?.id) throw new Error("No active journey");

      const { data, error } = await supabase
        .from("user_debts")
        .insert({
          journey_id: journey.id,
          user_id: user.id,
          debt_type: debtData.debt_type,
          name: debtData.name,
          original_balance: debtData.original_balance,
          current_balance: debtData.current_balance,
          interest_rate: debtData.interest_rate,
          min_payment: debtData.min_payment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-debts"] });
      toast({
        title: "Debt added!",
        description: "Your new debt has been added to your journey.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add debt. Please try again.",
        variant: "destructive",
      });
      console.error("Add debt error:", error);
    },
  });

  // Update an existing debt
  const updateDebt = useMutation({
    mutationFn: async ({
      debtId,
      updates,
    }: {
      debtId: string;
      updates: Partial<Omit<UserDebt, "id" | "journey_id" | "user_id" | "created_at">>;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_debts")
        .update(updates)
        .eq("id", debtId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-debts"] });
      toast({
        title: "Debt updated!",
        description: "Your debt has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update debt. Please try again.",
        variant: "destructive",
      });
      console.error("Update debt error:", error);
    },
  });

  // Delete a debt
  const deleteDebt = useMutation({
    mutationFn: async (debtId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_debts")
        .delete()
        .eq("id", debtId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-debts"] });
      toast({
        title: "Debt deleted",
        description: "The debt has been removed from your journey.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete debt. Please try again.",
        variant: "destructive",
      });
      console.error("Delete debt error:", error);
    },
  });

  // Log a payment against a debt
  const logPayment = useMutation({
    mutationFn: async ({
      debtId,
      amount,
      note,
    }: {
      debtId: string;
      amount: number;
      note?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Get current debt balance
      const { data: debt, error: fetchError } = await supabase
        .from("user_debts")
        .select("current_balance")
        .eq("id", debtId)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!debt) throw new Error("Debt not found");

      const newBalance = Math.max(0, debt.current_balance - amount);
      const isPaidOff = newBalance === 0;

      // Insert payment record
      const { error: paymentError } = await supabase
        .from("debt_payments")
        .insert({
          debt_id: debtId,
          user_id: user.id,
          amount,
          payment_type: "payment",
          note: note || null,
        });

      if (paymentError) throw paymentError;

      // Update debt balance
      const { error: updateError } = await supabase
        .from("user_debts")
        .update({
          current_balance: newBalance,
          paid_off_at: isPaidOff ? new Date().toISOString() : null,
        })
        .eq("id", debtId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return { newBalance, isPaidOff };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-debts"] });
      
      if (data.isPaidOff) {
        toast({
          title: "🎉 Debt Paid Off!",
          description: "Congratulations! You've eliminated this debt!",
        });
      } else {
        toast({
          title: "Payment logged!",
          description: "Your payment has been recorded.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to log payment. Please try again.",
        variant: "destructive",
      });
      console.error("Log payment error:", error);
    },
  });

  return {
    journey,
    debts: debts ?? [],
    isLoading: journeyLoading || debtsLoading,
    error: journeyError || debtsError,
    hasActiveJourney: !!journey,
    createJourney,
    updateJourney,
    addDebt,
    updateDebt,
    deleteDebt,
    logPayment,
  };
}
