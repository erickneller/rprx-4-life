import { useState } from 'react';
import { Loader2, Trash2, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AssessmentSummaryCard } from './AssessmentSummaryCard';
import { useAssessmentHistory, useDeleteAssessments } from '@/hooks/useAssessmentHistory';

export function AssessmentHistory() {
  const { data: assessments = [], isLoading } = useAssessmentHistory();
  const deleteAssessments = useDeleteAssessments();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === assessments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assessments.map((a) => a.id)));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    setDeleteDialogOpen(true);
  };

  const handleSingleDelete = (id: string) => {
    setSingleDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    const ids = singleDeleteId ? [singleDeleteId] : Array.from(selectedIds);
    deleteAssessments.mutate(ids, {
      onSuccess: () => {
        setSingleDeleteId(null);
        setSelectedIds(new Set());
        setSelectionMode(false);
        setDeleteDialogOpen(false);
      },
      onSettled: () => {
        setDeleteDialogOpen(false);
      },
    });
  };

  const deleteCount = singleDeleteId ? 1 : selectedIds.size;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (assessments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Assessment History</h2>
        <div className="flex items-center gap-2">
          {selectionMode && (
            <>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  checked={selectedIds.size === assessments.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">All</span>
              </div>
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={deleteAssessments.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete ({selectedIds.size})
                </Button>
              )}
            </>
          )}
          <Button
            variant={selectionMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={selectionMode ? exitSelectionMode : () => setSelectionMode(true)}
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            {selectionMode ? 'Cancel' : 'Select'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assessments.map((assessment, index) => (
          <AssessmentSummaryCard
            key={assessment.id}
            assessment={assessment}
            isLatest={index === 0}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(assessment.id)}
            onToggleSelect={toggleSelect}
            onDelete={handleSingleDelete}
          />
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteCount === 1 ? 'Assessment' : `${deleteCount} Assessments`}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteCount === 1 ? 'this assessment' : `these ${deleteCount} assessments`} and all associated responses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSingleDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAssessments.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
