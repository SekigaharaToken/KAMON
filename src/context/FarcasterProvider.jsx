/**
 * FarcasterProvider — React context for Farcaster SIWF state.
 *
 * Adapted from SecondOrder (commit 87e0d786).
 * No backend JWT — DOJO is fully static/onchain.
 * Persists profile to sessionStorage so identity survives page reload.
 */

import { useEffect, useMemo, useCallback, useState } from "react";
import { useProfile, useSignIn } from "@farcaster/auth-kit";
import FarcasterContext from "./farcasterContext.js";

const PROFILE_STORAGE_KEY = "kamon:farcaster_profile";

export const FarcasterProvider = ({ children }) => {
  const { isAuthenticated: isAuthKitAuthenticated, profile: authKitProfile } =
    useProfile();
  const { signOut } = useSignIn({});
  const [error, setError] = useState(null);
  const [miniAppFid, setMiniAppFid] = useState(null);

  // Resolve FID from MiniApp SDK context (Farcaster frames / mini-apps)
  useEffect(() => {
    import("@farcaster/miniapp-sdk").then((mod) => {
      const sdk = mod.default || mod;
      if (sdk.context && typeof sdk.context.then === "function") {
        sdk.context.then((ctx) => {
          if (ctx?.user?.fid) setMiniAppFid(ctx.user.fid);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  // Restore profile from sessionStorage on mount
  const [storedProfile, setStoredProfile] = useState(() => {
    try {
      const stored = sessionStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // noop
    }
    return null;
  });

  // When auth-kit provides a fresh profile, persist it to sessionStorage
  useEffect(() => {
    if (isAuthKitAuthenticated && authKitProfile) {
      try {
        sessionStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify(authKitProfile),
        );
      } catch {
        // noop
      }
    }
  }, [isAuthKitAuthenticated, authKitProfile]);

  // Clear stored profile on explicit sign-out
  const handleSignOut = useCallback(() => {
    setStoredProfile(null);
    try {
      sessionStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch {
      // noop
    }
    signOut();
  }, [signOut]);

  // Use auth-kit profile when live, fall back to stored profile
  const isAuthenticated = isAuthKitAuthenticated || storedProfile !== null;
  const baseProfile = (isAuthKitAuthenticated && authKitProfile) || storedProfile;

  // Merge MiniApp FID into profile if auth-kit didn't provide one
  const profile = useMemo(() => {
    if (!baseProfile) return null;
    if (baseProfile.fid || !miniAppFid) return baseProfile;
    return { ...baseProfile, fid: miniAppFid };
  }, [baseProfile, miniAppFid]);

  /**
   * Generate an alphanumeric nonce for SIWF.
   * SIWE (ERC-4361) nonces require [a-zA-Z0-9]{8+}.
   * UUID hyphens cause Warpcast to fail silently.
   */
  const generateNonce = useCallback(() => {
    return crypto.randomUUID().replaceAll("-", "");
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      profile: profile || null,
      error,
      generateNonce,
      clearError,
      signOut: handleSignOut,
    }),
    [isAuthenticated, profile, error, generateNonce, clearError, handleSignOut],
  );

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
};
