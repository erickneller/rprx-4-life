import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationBlockerContextType {
  isDirty: boolean;
  pendingPath: string | null;
  setDirty: (dirty: boolean) => void;
  attemptNavigation: (path: string) => boolean;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  registerBlocker: (showDialog: () => void) => void;
  unregisterBlocker: () => void;
}

const NavigationBlockerContext = createContext<NavigationBlockerContextType | null>(null);

export function NavigationBlockerProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showDialogFn, setShowDialogFn] = useState<(() => void) | null>(null);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  const attemptNavigation = useCallback((path: string): boolean => {
    if (isDirty && showDialogFn) {
      setPendingPath(path);
      showDialogFn();
      return false; // Block navigation
    }
    return true; // Allow navigation
  }, [isDirty, showDialogFn]);

  const confirmNavigation = useCallback(() => {
    setPendingPath(null);
  }, []);

  const cancelNavigation = useCallback(() => {
    setPendingPath(null);
  }, []);

  const registerBlocker = useCallback((showDialog: () => void) => {
    setShowDialogFn(() => showDialog);
  }, []);

  const unregisterBlocker = useCallback(() => {
    setShowDialogFn(null);
    setIsDirty(false);
    setPendingPath(null);
  }, []);

  return (
    <NavigationBlockerContext.Provider
      value={{
        isDirty,
        pendingPath,
        setDirty,
        attemptNavigation,
        confirmNavigation,
        cancelNavigation,
        registerBlocker,
        unregisterBlocker,
      }}
    >
      {children}
    </NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker() {
  const context = useContext(NavigationBlockerContext);
  if (!context) {
    throw new Error('useNavigationBlocker must be used within a NavigationBlockerProvider');
  }
  return context;
}

// Optional hook for components that might be outside the provider
export function useNavigationBlockerOptional() {
  return useContext(NavigationBlockerContext);
}
