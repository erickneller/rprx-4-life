import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlans } from '@/hooks/usePlans';
import { PlanCard } from '@/components/plans/PlanCard';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, FileText } from 'lucide-react';

export default function Plans() {
  const navigate = useNavigate();
  const { data: plans = [], isLoading } = usePlans();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [horsemanFilter, setHorsemanFilter] = useState<string>('all');

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = plan.title.toLowerCase().includes(query);
      const matchesStrategy = plan.strategy_name.toLowerCase().includes(query);
      const matchesId = plan.strategy_id?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesStrategy && !matchesId) return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && plan.status !== statusFilter) return false;
    
    // Horseman filter
    if (horsemanFilter !== 'all') {
      const horsemen = plan.content.horseman || [];
      if (!horsemen.some(h => h.toLowerCase() === horsemanFilter.toLowerCase())) return false;
    }
    
    return true;
  });

  // Get unique horsemen from all plans for filter
  const allHorsemen = [...new Set(
    plans.flatMap(p => p.content.horseman || [])
  )].sort();

  return (
    <AuthenticatedLayout title="My Plans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mb-6">
          {plans.length} saved plan{plans.length !== 1 ? 's' : ''}
        </p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          {allHorsemen.length > 0 && (
            <Select value={horsemanFilter} onValueChange={setHorsemanFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by horseman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Horsemen</SelectItem>
                {allHorsemen.map(horseman => (
                  <SelectItem key={horseman} value={horseman.toLowerCase()}>
                    {horseman}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Plans List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : plans.length > 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No plans match your filters</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No saved plans yet</h3>
            <p className="text-muted-foreground mb-6">
              Chat with the Strategy Assistant and save implementation plans to track your progress.
            </p>
            <Button onClick={() => navigate('/strategy-assistant')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Go to Strategy Assistant
            </Button>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
