import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WizardStepContent {
  id: string;
  step_number: number;
  title: string;
  subtitle: string;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

export function useWizardContent() {
  const query = useQuery({
    queryKey: ['wizard-step-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wizard_step_content')
        .select('*')
        .order('step_number');
      if (error) throw error;
      return data as WizardStepContent[];
    },
  });

  const contentMap = (query.data || []).reduce<Record<string, WizardStepContent>>((acc, row) => {
    acc[row.id] = row;
    return acc;
  }, {});

  return {
    ...query,
    contentMap,
  };
}
