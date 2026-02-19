/**
 * useLeaderboard — client-side scoring computation and localStorage caching.
 *
 * Provides cache read/write with 15-min TTL.
 * Full computation (fetching all House holders and computing scores)
 * will be wired up when wallet integration is available.
 */

import { LEADERBOARD_CACHE_KEY, LEADERBOARD_CACHE_TTL } from "@/config/season.js";

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
