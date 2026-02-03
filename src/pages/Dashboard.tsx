import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

const Dashboard = () => {
  return (
    <AuthenticatedLayout title="Dashboard">
      <DashboardContent />
    </AuthenticatedLayout>
  );
};

export default Dashboard;
