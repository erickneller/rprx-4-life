import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLibraryAdmin } from '@/hooks/useLibraryAdmin';
import { Loader2 } from 'lucide-react';

interface LibraryAdminRouteProps {
  children: React.ReactNode;
}

export function LibraryAdminRoute({ children }: LibraryAdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { canManageLibrary, isFetched } = useLibraryAdmin();

  if (authLoading || (!!user && !isFetched)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!canManageLibrary) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
