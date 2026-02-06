import { useEffect, useCallback, useState } from 'react';

interface UseUnsavedChangesWarningOptions {
  isDirty: boolean;
  onSave: () => Promise<void>;
  onNavigateAway: () => void;
}

export function useUnsavedChangesWarning({ isDirty, onSave, onNavigateAway }: UseUnsavedChangesWarningOptions) {
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle browser back/refresh with beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Called when user attempts to navigate away (e.g., Cancel button)
  const attemptNavigation = useCallback(() => {
    if (isDirty) {
      setShowDialog(true);
    } else {
      onNavigateAway();
    }
  }, [isDirty, onNavigateAway]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave();
      setShowDialog(false);
      onNavigateAway();
    } catch (error) {
      // Keep dialog open on error, let the save function handle toast
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, onNavigateAway]);

  const handleDiscard = useCallback(() => {
    setShowDialog(false);
    onNavigateAway();
  }, [onNavigateAway]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
  }, []);

  return {
    showDialog,
    isSaving,
    attemptNavigation,
    handleSave,
    handleDiscard,
    handleCancel,
  };
}
