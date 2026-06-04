import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InsightsOverviewTab } from '@/components/admin/insights/InsightsOverviewTab';
import { UsersTab } from '@/components/admin/insights/UsersTab';
import { CompaniesTab } from '@/components/admin/insights/CompaniesTab';
import { BarChart3 } from 'lucide-react';

export default function Insights() {
  return (
    <AuthenticatedLayout title="Admin Insights">
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Admin Insights</h1>
            <p className="text-sm text-muted-foreground">
              Drill into users, tiers, activity, and company-level reporting.
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <InsightsOverviewTab />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>
          <TabsContent value="companies" className="mt-6">
            <CompaniesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
