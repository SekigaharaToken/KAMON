/**
 * useLeaderboard — client-side scoring computation and localStorage caching.
 *
 * Cache layer: read/write with 15-min TTL.
 * React hook: TanStack Query with 15-min staleTime, backed by computeLeaderboard.
 */

import { useQuery } from "@tanstack/react-query";
import { LEADERBOARD_CACHE_KEY, LEADERBOARD_CACHE_TTL, SEASON_START_BLOCK } from "@/config/season.js";
import { computeLeaderboard } from "@/lib/computeLeaderboard.js";

/**
 * Read leaderboard data from localStorage cache.
 * @returns {object|null} cached data or null
 */
export function getLeaderboardCache() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Write leaderboard data to localStorage cache with timestamp.
 * @param {object} data — rankings data to cache
 */
export function setLeaderboardCache(data) {
  const cached = {
    ...data,
    lastUpdated: data.lastUpdated ?? Date.now(),
  };
  localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(cached));
}

/**
 * Check if the leaderboard cache is still valid (within TTL).
 * @returns {boolean}
 */
export function isLeaderboardCacheValid() {
  const cached = getLeaderboardCache();
  if (!cached || !cached.lastUpdated) return false;
  return Date.now() - cached.lastUpdated < LEADERBOARD_CACHE_TTL;
}

/**
 * Fetch leaderboard rankings and persist to localStorage.
 * TanStack Query manages staleness/refetch timing; this always computes fresh.
 * @returns {Promise<Array>} ranked House array
 */
async function fetchLeaderboard() {
  const rankings = await computeLeaderboard(SEASON_START_BLOCK);
  setLeaderboardCache({ rankings });
  return rankings;
}

/**
 * React hook — leaderboard rankings.
 *
 * - On app open: renders instantly from localStorage cache, refetches if stale (>15 min).
 * - Background: auto-refetches every 15 min via refetchInterval.
 *
 * @returns {{ rankings: Array, isLoading: boolean, isError: boolean, lastUpdated: number|null }}
 */
export function useLeaderboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: LEADERBOARD_CACHE_TTL,
    refetchInterval: LEADERBOARD_CACHE_TTL,
    // Seed from localStorage so the UI renders instantly with cached data
    initialData: () => {
      const cached = getLeaderboardCache();
      return cached?.rankings ?? undefined;
    },
    // Tell TanStack Query the real age of cached data so it refetches if stale
    initialDataUpdatedAt: () => {
      const cached = getLeaderboardCache();
      return cached?.lastUpdated ?? 0;
    },
  });

  const lastUpdated = (() => {
    const cached = getLeaderboardCache();
    return cached?.lastUpdated ?? null;
  })();

  return {
    rankings: data ?? [],
    isLoading,
    isError,
    lastUpdated,
  };
}
