import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePlan, type CreatePlanInput, type PlanContent } from '@/hooks/usePlans';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      await createPlan.mutateAsync({
        title: title.trim(),
        strategy_id: initialData.strategyId,
        strategy_name: initialData.strategyName,
        content: initialData.content,
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
          <Button onClick={handleSave} disabled={!title.trim() || createPlan.isPending}>
            {createPlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
