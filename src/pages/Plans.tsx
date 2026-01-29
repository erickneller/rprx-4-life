import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlans } from '@/hooks/usePlans';
import { PlanCard } from '@/components/plans/PlanCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Loader2, FileText } from 'lucide-react';
import rprxLogo from '@/assets/rprx-logo.png';

export default function Plans() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: plans = [], isLoading } = usePlans();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [horsemanFilter, setHorsemanFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={rprxLogo} alt="RPRx 4 Life" className="h-8 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">My Plans</h1>
              <p className="text-sm text-muted-foreground">
                {plans.length} saved plan{plans.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
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
            <Button onClick={() => navigate('/strategy-assistant')}>
              Go to Strategy Assistant
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
