import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sunos:welcomed';

/**
 * Returns `isFirstVisit` = true when the user has never dismissed the welcome screen.
 * Hydration-safe: starts as `null` (unknown) and resolves after mount.
 *
 * `dismiss()` writes localStorage and flips the flag to false.
 */
export function useFirstVisit(): {
  isFirstVisit: boolean | null;
  dismiss: () => void;
} {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);

  useEffect(() => {
    const welcomed = localStorage.getItem(STORAGE_KEY);
    setIsFirstVisit(welcomed !== 'true');
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsFirstVisit(false);
  };

  return { isFirstVisit, dismiss };
}
