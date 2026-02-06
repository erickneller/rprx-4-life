import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationBlocker } from '@/contexts/NavigationBlockerContext';

interface UseUnsavedChangesWarningOptions {
  isDirty: boolean;
  onSave: () => Promise<void>;
}

export function useUnsavedChangesWarning({ isDirty, onSave }: UseUnsavedChangesWarningOptions) {
  const navigate = useNavigate();
  const blocker = useNavigationBlocker();
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync dirty state with the navigation blocker context
  useEffect(() => {
    blocker.setDirty(isDirty);
  }, [isDirty, blocker]);

  // Register the dialog trigger with the blocker
  useEffect(() => {
    blocker.registerBlocker(() => setShowDialog(true));
    return () => blocker.unregisterBlocker();
  }, [blocker]);

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

  // Called when user attempts to navigate away via Cancel button
  const attemptNavigation = useCallback(() => {
    if (isDirty) {
      setShowDialog(true);
    } else {
      navigate(-1);
    }
  }, [isDirty, navigate]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave();
      setShowDialog(false);
      
      // Navigate to pending path if there is one, otherwise go back
      if (blocker.pendingPath) {
        const path = blocker.pendingPath;
        blocker.confirmNavigation();
        navigate(path);
      } else {
        navigate(-1);
      }
    } catch (error) {
      // Keep dialog open on error, let the save function handle toast
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, navigate, blocker]);

  const handleDiscard = useCallback(() => {
    setShowDialog(false);
    
    // Navigate to pending path if there is one, otherwise go back
    if (blocker.pendingPath) {
      const path = blocker.pendingPath;
      blocker.confirmNavigation();
      navigate(path);
    } else {
      navigate(-1);
    }
  }, [navigate, blocker]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    blocker.cancelNavigation();
  }, [blocker]);

  return {
    showDialog,
    isSaving,
    attemptNavigation,
    handleSave,
    handleDiscard,
    handleCancel,
  };
}
