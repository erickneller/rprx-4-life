import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { DebtJourney, UserDebt, SetupWizardData } from "@/lib/debtTypes";
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

  return {
    journey,
    debts: debts ?? [],
    isLoading: journeyLoading || debtsLoading,
    error: journeyError || debtsError,
    hasActiveJourney: !!journey,
    createJourney,
    updateJourney,
  };
}
