import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { LibraryTab } from '@/components/admin/LibraryTab';

export default function LibraryAdmin() {
  return (
    <AuthenticatedLayout title="Library Admin">
      <div className="container mx-auto p-6">
        <LibraryTab />
      </div>
    </AuthenticatedLayout>
  );
}
