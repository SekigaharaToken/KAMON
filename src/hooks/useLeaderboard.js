/**
 * useLeaderboard — client-side scoring computation and localStorage caching.
 *
 * Cache layer: read/write with 15-min TTL.
 * React hook: TanStack Query with 15-min staleTime, backed by computeLeaderboard.
 */

import { useQuery } from "@tanstack/react-query";
import { LEADERBOARD_CACHE_KEY, LEADERBOARD_CACHE_TTL } from "@/config/season.js";
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
 * Fetch leaderboard rankings.
 * Returns cached data if valid; otherwise calls computeLeaderboard and caches result.
 * @returns {Promise<Array>} ranked House array
 */
async function fetchLeaderboard() {
  if (isLeaderboardCacheValid()) {
    const cached = getLeaderboardCache();
    if (cached?.rankings) return cached.rankings;
  }

  const rankings = await computeLeaderboard();
  setLeaderboardCache({ rankings });
  return rankings;
}

/**
 * React hook — leaderboard rankings with 15-min staleTime.
 *
 * @returns {{ rankings: Array, isLoading: boolean, isError: boolean, lastUpdated: number|null }}
 */
export function useLeaderboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: LEADERBOARD_CACHE_TTL,
    // Seed from localStorage so the UI renders instantly with cached data
    initialData: () => {
      if (isLeaderboardCacheValid()) {
        const cached = getLeaderboardCache();
        return cached?.rankings ?? undefined;
      }
      return undefined;
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
