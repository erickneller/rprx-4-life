import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';

export function useLibraryAdmin() {
  const { user } = useAuth();
  const { isAdmin, isFetched: adminFetched } = useAdmin();

  const { data: isLibraryAdmin = false, isFetched: libFetched } = useQuery({
    queryKey: ['library-admin-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'library_admin' as any });
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });

  return {
    isLibraryAdmin,
    isFetched: adminFetched && libFetched,
    canManageLibrary: isAdmin || isLibraryAdmin,
  };
}
