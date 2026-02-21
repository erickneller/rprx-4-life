import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import LandingPage from '@/components/landing/LandingPage';

const Index = () => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();

  if (loading || (user && (profileLoading || !profile))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Redirect to profile if incomplete, otherwise dashboard
  if (!isProfileComplete) {
    return <Navigate to="/profile" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default Index;
