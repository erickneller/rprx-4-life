import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const Dashboard = () => {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkout = params.get('checkout');
    if (checkout === 'success') {
      toast.success('Subscription activated! Welcome aboard.');
      queryClient.invalidateQueries({ queryKey: ['subscription-tier'] });
      params.delete('checkout');
      setParams(params, { replace: true });
    } else if (checkout === 'cancelled') {
      toast('Checkout cancelled. You can subscribe anytime.');
      params.delete('checkout');
      setParams(params, { replace: true });
    }
  }, [params, setParams, queryClient]);

  return (
    <AuthenticatedLayout title="Dashboard">
      <DashboardContent />
    </AuthenticatedLayout>
  );
};

export default Dashboard;
