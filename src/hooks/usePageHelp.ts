import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PageHelpContent {
  id: string;
  page_name: string;
  hint_text: string;
  help_title: string;
  help_body: string;
  video_url: string | null;
  video_placeholder_text: string;
  sort_order: number;
  is_active: boolean;
}

function pathToPageId(pathname: string): string | null {
  if (pathname === '/dashboard') return 'dashboard';
  if (pathname === '/profile') return 'profile';
  if (pathname.startsWith('/assessment')) return 'assessment';
  if (pathname.startsWith('/results')) return 'results';
  if (pathname.startsWith('/plans')) return 'plans';
  if (pathname === '/strategy-assistant') return 'strategies';
  if (pathname === '/debt-eliminator') return 'debt-eliminator';
  return null;
}

export function usePageHelp() {
  const { pathname } = useLocation();
  const pageId = pathToPageId(pathname);

  const { data: helpContent = null, isLoading } = useQuery({
    queryKey: ['page-help', pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const { data, error } = await supabase
        .from('page_help_content' as any)
        .select('*')
        .eq('id', pageId)
        .eq('is_active', true)
        .single();
      if (error || !data) return null;
      return data as unknown as PageHelpContent;
    },
    enabled: !!pageId,
  });

  return { helpContent, isLoading, pageId };
}
