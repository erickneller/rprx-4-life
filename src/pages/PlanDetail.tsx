import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlan, useUpdatePlan, useDeletePlan } from '@/hooks/usePlans';
import { PlanChecklist } from '@/components/plans/PlanChecklist';
import { PlanDownload } from '@/components/plans/PlanDownload';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, Edit2, Save, X, Calendar, Clock, FileText, Star, Sparkles, ArrowRight, Shield, Target, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useQueryClient } from '@tanstack/react-query';

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading, error } = usePlan(id);
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const { toast } = useToast();
  const { data: assessments } = useAssessmentHistory();
  const queryClient = useQueryClient();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [notesChanged, setNotesChanged] = useState(false);

  useEffect(() => {
    if (plan) {
      setEditedTitle(plan.title);
      setNotes(plan.notes || '');
    }
  }, [plan]);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !plan) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center flex-col gap-4">
          <p className="text-muted-foreground">Plan not found</p>
          <Button onClick={() => navigate('/plans')} className="bg-accent hover:bg-accent/90 text-accent-foreground">Back to Plans</Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  const content = plan.content;
  const completedSteps = content.completedSteps || [];
  const totalSteps = content.steps?.length || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;
  const isCompleted = plan.status === 'completed' || (totalSteps > 0 && completedSteps.length === totalSteps);

  const latestAssessment = assessments && assessments.length > 0 ? assessments[0] : null;

  // Derive display title: use strategy_name unless it's the generic fallback
  const displayTitle = plan.strategy_name && plan.strategy_name !== 'Implementation Plan'
    ? plan.strategy_name
    : plan.title;

  const handleToggleStep = async (stepIndex: number) => {
    const currentCompleted = content.completedSteps || [];
    const newCompleted = currentCompleted.includes(stepIndex)
      ? currentCompleted.filter(i => i !== stepIndex)
      : [...currentCompleted, stepIndex];

    let newStatus: 'not_started' | 'in_progress' | 'completed' = plan.status;
    if (newCompleted.length === 0) {
      newStatus = 'not_started';
    } else if (newCompleted.length === totalSteps) {
      newStatus = 'completed';
    } else {
      newStatus = 'in_progress';
    }

    const wasFirstStep = currentCompleted.length === 0 && newCompleted.length === 1;
    const justCompleted = newCompleted.length === totalSteps && totalSteps > 0;

    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        content: { ...content, completedSteps: newCompleted },
        status: newStatus,
      });

      // Invalidate money leak calculations
      queryClient.invalidateQueries({ queryKey: ['plans'] });

      // Contextual toasts
      if (justCompleted) {
        const impact = content.estimated_impact;
        const mid = impact ? Math.round((impact.low + impact.high) / 2) : null;
        toast({
          title: '🎉 Plan complete!',
          description: mid
            ? `You've recovered an estimated $${mid.toLocaleString()}`
            : 'Great work completing this plan!',
        });
      } else if (wasFirstStep) {
        toast({ title: '🎉 You\'re on your way!', description: 'First step complete.' });
      } else if (newCompleted.length > currentCompleted.length) {
        toast({ title: '✅ Step complete', description: `${newCompleted.length}/${totalSteps} steps done` });
      }
    } catch {
      toast({ title: 'Error updating plan', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    try {
      await updatePlan.mutateAsync({ id: plan.id, title: editedTitle.trim() });
      setIsEditingTitle(false);
    } catch {
      toast({ title: 'Error updating title', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updatePlan.mutateAsync({ id: plan.id, notes: notes.trim() || null });
      setNotesChanged(false);
      toast({ title: 'Notes saved', description: 'Your notes have been updated.' });
    } catch {
      toast({ title: 'Error saving notes', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updatePlan.mutateAsync({ id: plan.id, status: newStatus as 'not_started' | 'in_progress' | 'completed' });
    } catch {
      toast({ title: 'Error updating status', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlan.mutateAsync(plan.id);
      toast({ title: 'Plan deleted', description: 'The plan has been removed.' });
      navigate('/plans');
    } catch {
      toast({ title: 'Error deleting plan', description: 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <AuthenticatedLayout title={displayTitle}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PlanDownload plan={plan} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Select value={plan.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="text-2xl font-bold" autoFocus />
                <Button size="icon" variant="ghost" onClick={handleSaveTitle}><Save className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { setIsEditingTitle(false); setEditedTitle(plan.title); }}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(true)}><Edit2 className="h-4 w-4 text-muted-foreground" /></Button>
              </div>
            )}

            {/* Show plan.title as subtitle when it's different */}
            {displayTitle !== plan.title && (
              <p className="text-sm text-muted-foreground mt-1">{plan.title}</p>
            )}
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {plan.strategy_id && (
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                {plan.strategy_id}
              </Badge>
            )}
            {content.horseman && content.horseman.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                {content.horseman.join(', ')}
              </Badge>
            )}
            {content.complexity && (
              <Badge variant="secondary" className="gap-1">
                <Target className="h-3 w-3" />
                {'★'.repeat(content.complexity)}{'☆'.repeat(5 - content.complexity)}
              </Badge>
            )}
            {content.savings && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {content.savings}
              </Badge>
            )}
            {content.taxReference && (
              <Badge variant="outline">{content.taxReference}</Badge>
            )}
          </div>

          {/* Progress bar */}
          {totalSteps > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedSteps.length}/{totalSteps} steps ({progress}%)</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {content.summary && (
          <div className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4">
            {content.summary}
          </div>
        )}

        {/* Requirements */}
        {content.requirements && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Key Requirements</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{content.requirements}</p>
          </div>
        )}

        {/* Implementation Steps */}
        {content.steps && content.steps.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Step-by-Step Implementation Plan</h2>
              <p className="text-sm text-muted-foreground">Check off each step as you complete it</p>
            </div>
            <Card>
              <CardContent className="pt-4 pb-2">
                <PlanChecklist
                  steps={content.steps}
                  completedSteps={completedSteps}
                  onToggleStep={handleToggleStep}
                  disabled={updatePlan.isPending}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ready for next strategy? */}
        {isCompleted && latestAssessment && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ready for your next strategy?
                </h3>
                <p className="text-sm text-muted-foreground">
                  You've completed this plan! Generate your next strategy to keep the momentum.
                </p>
              </div>
              <Button onClick={() => navigate(`/results/${latestAssessment.id}`)} className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground">
                Next Strategy <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Personal Notes */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Personal Notes</h2>
          <Textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesChanged(true); }}
            placeholder="Add your personal notes, reminders, or observations..."
            rows={4}
          />
          {notesChanged && (
            <Button size="sm" onClick={handleSaveNotes} disabled={updatePlan.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {updatePlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Notes
            </Button>
          )}
        </div>

        {/* Metadata footer */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Created {new Date(plan.created_at).toLocaleDateString()}</div>
          <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated {new Date(plan.updated_at).toLocaleDateString()}</div>
        </div>

        {/* Disclaimer */}
        {content.disclaimer && (
          <div className="text-xs text-muted-foreground italic p-4 bg-muted/50 rounded-lg">
            {content.disclaimer}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
