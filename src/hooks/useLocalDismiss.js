import { useState, useCallback } from "react";

/**
 * Hook for localStorage-backed dismissal state.
 * Returns [dismissed, dismiss] tuple.
 */
export function useLocalDismiss(key) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(key) === "1",
  );

  const dismiss = useCallback(() => {
    localStorage.setItem(key, "1");
    setDismissed(true);
  }, [key]);

  return [dismissed, dismiss];
}
