import { useState, useCallback } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniAppContext } from "./useMiniAppContext.js";

/**
 * Generic hook for adding the app via Farcaster MiniApp SDK.
 * Wraps sdk.actions.addFrame() with loading/error state.
 *
 * Returns:
 * - addApp() — trigger the add flow
 * - isAdded — whether the app is already added
 * - isLoading — add in progress
 * - error — error message if add failed
 * - clearError — reset error state
 */
export function useAddApp() {
  const { isInMiniApp, isAppAdded } = useMiniAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [justAdded, setJustAdded] = useState(false);

  const addApp = useCallback(async () => {
    if (!isInMiniApp) return;
    setIsLoading(true);
    setError(null);
    try {
      await sdk.actions.addFrame();
      setJustAdded(true);
    } catch (err) {
      setError(err.message || "Failed to add app");
    } finally {
      setIsLoading(false);
    }
  }, [isInMiniApp]);

  const clearError = useCallback(() => setError(null), []);

  return {
    addApp,
    isAdded: isAppAdded || justAdded,
    isInMiniApp,
    isLoading,
    error,
    clearError,
  };
}
