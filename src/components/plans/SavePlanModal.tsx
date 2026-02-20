import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePlan, usePlans, type CreatePlanInput, type PlanContent } from '@/hooks/usePlans';
import { Loader2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseEstimatedImpact } from '@/lib/moneyLeakEstimator';

interface SavePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    strategyId?: string;
    strategyName: string;
    content: PlanContent;
  };
}

export function SavePlanModal({ open, onOpenChange, initialData }: SavePlanModalProps) {
  const [title, setTitle] = useState(initialData.strategyName);
  const [notes, setNotes] = useState('');
  const createPlan = useCreatePlan();
  const { data: existingPlans = [] } = usePlans();
  const { toast } = useToast();

  // Free tier: max 1 plan
  const isFree = true; // swap to subscription check later
  const atLimit = isFree && existingPlans.length >= 1;

  const handleSave = async () => {
    if (!title.trim() || atLimit) return;

    try {
      // Try to match strategy name to get estimated_impact
      let estimatedImpact: { low: number; high: number; source: string } = { low: 500, high: 2000, source: 'assessment' };
      
      const strategyName = initialData.strategyName;
      if (strategyName) {
        const { data: matchedStrategy } = await supabase
          .from('strategy_definitions')
          .select('estimated_impact')
          .ilike('name', `%${strategyName}%`)
          .limit(1)
          .maybeSingle();

        if (matchedStrategy?.estimated_impact) {
          const parsed = parseEstimatedImpact(matchedStrategy.estimated_impact);
          estimatedImpact = { ...parsed, source: 'strategy_definitions' };
        }
      }

      const contentWithImpact: PlanContent = {
        ...initialData.content,
        estimated_impact: estimatedImpact,
      };

      await createPlan.mutateAsync({
        title: title.trim(),
        strategy_id: initialData.strategyId,
        strategy_name: initialData.strategyName,
        content: contentWithImpact,
        notes: notes.trim() || undefined,
      });
      
      toast({
        title: 'Plan saved!',
        description: 'Your implementation plan has been saved.',
      });
      
      onOpenChange(false);
      setTitle(initialData.strategyName);
      setNotes('');
    } catch (error) {
      toast({
        title: 'Error saving plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Implementation Plan</DialogTitle>
          <DialogDescription>
            Save this strategy to your plans for future reference and tracking.
          </DialogDescription>
        </DialogHeader>
        
        {atLimit ? (
          <div className="py-6 text-center space-y-3">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Free accounts are limited to 1 active plan. Delete your current plan or upgrade to save more.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Plan Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your plan"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Personal Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any personal notes or reminders..."
                  rows={3}
                />
              </div>
              
              {initialData.strategyId && (
                <div className="text-sm text-muted-foreground">
                  Strategy ID: {initialData.strategyId}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!title.trim() || createPlan.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {createPlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Plan
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
