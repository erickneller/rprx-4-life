import { useEffect, useCallback, useState } from 'react';
import { useBlocker } from 'react-router-dom';

interface UseUnsavedChangesWarningOptions {
  isDirty: boolean;
  onSave: () => Promise<void>;
}

export function useUnsavedChangesWarning({ isDirty, onSave }: UseUnsavedChangesWarningOptions) {
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Block navigation when form is dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Show dialog when navigation is blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowDialog(true);
    }
  }, [blocker.state]);

  // Handle browser back/refresh
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

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave();
      setShowDialog(false);
      blocker.proceed?.();
    } catch (error) {
      // Keep dialog open on error, let the save function handle toast
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, blocker]);

  const handleDiscard = useCallback(() => {
    setShowDialog(false);
    blocker.proceed?.();
  }, [blocker]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    blocker.reset?.();
  }, [blocker]);

  return {
    showDialog,
    isSaving,
    handleSave,
    handleDiscard,
    handleCancel,
  };
}
