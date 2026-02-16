import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, Edit2, Save, X, Calendar, Clock, FileText, Star, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading, error } = usePlan(id);
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const { toast } = useToast();
  const { data: assessments } = useAssessmentHistory();
  
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

  // Get latest assessment for "next strategy" link
  const latestAssessment = assessments && assessments.length > 0 ? assessments[0] : null;

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
    
    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        content: { ...content, completedSteps: newCompleted },
        status: newStatus,
      });
    } catch {
      toast({
        title: 'Error updating plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    
    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        title: editedTitle.trim(),
      });
      setIsEditingTitle(false);
    } catch {
      toast({
        title: 'Error updating title',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        notes: notes.trim() || null,
      });
      setNotesChanged(false);
      toast({
        title: 'Notes saved',
        description: 'Your notes have been updated.',
      });
    } catch {
      toast({
        title: 'Error saving notes',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        status: newStatus as 'not_started' | 'in_progress' | 'completed',
      });
    } catch {
      toast({
        title: 'Error updating status',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlan.mutateAsync(plan.id);
      toast({
        title: 'Plan deleted',
        description: 'The plan has been removed.',
      });
      navigate('/plans');
    } catch {
      toast({
        title: 'Error deleting plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthenticatedLayout title={plan.title}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
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
                <AlertDialogDescription>
                  This action cannot be undone. The plan will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Title and Status */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl font-bold"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    setIsEditingTitle(false);
                    setEditedTitle(plan.title);
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{plan.title}</h1>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-muted-foreground mt-1">{plan.strategy_name}</p>
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
          
          {/* Progress bar */}
          {totalSteps > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedSteps.length}/{totalSteps} steps ({progress}%)</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Metadata Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Strategy Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plan.strategy_id && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ID: {plan.strategy_id}</span>
                </div>
              )}
              
              {content.horseman && content.horseman.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{content.horseman.join(', ')}</Badge>
                </div>
              )}
              
              {content.complexity && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Complexity: {'★'.repeat(content.complexity)}{'☆'.repeat(5 - content.complexity)}
                  </span>
                </div>
              )}
              
              {content.savings && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Savings: </span>
                  <span className="font-medium">{content.savings}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Updated {new Date(plan.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            {content.taxReference && (
              <div className="mt-4 pt-4 border-t text-sm">
                <span className="text-muted-foreground">Tax Reference: </span>
                <span>{content.taxReference}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {content.summary && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{content.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {content.requirements && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{content.requirements}</p>
            </CardContent>
          </Card>
        )}

        {/* Implementation Steps */}
        {content.steps && content.steps.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Implementation Steps</CardTitle>
              <CardDescription>Check off steps as you complete them</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanChecklist
                steps={content.steps}
                completedSteps={completedSteps}
                onToggleStep={handleToggleStep}
                disabled={updatePlan.isPending}
              />
            </CardContent>
          </Card>
        )}

        {/* Ready for next strategy? — shown when plan is completed */}
        {isCompleted && latestAssessment && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ready for your next strategy?
                </h3>
                <p className="text-sm text-muted-foreground">
                  You've completed this plan! Generate your next strategy or take a new assessment.
                </p>
              </div>
              <Button
                onClick={() => navigate(`/results/${latestAssessment.id}`)}
                className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Next Strategy
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Personal Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personal Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesChanged(true);
              }}
              placeholder="Add your personal notes, reminders, or observations..."
              rows={4}
            />
            {notesChanged && (
              <Button size="sm" onClick={handleSaveNotes} disabled={updatePlan.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {updatePlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Notes
              </Button>
            )}
          </CardContent>
        </Card>

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
