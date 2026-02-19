/**
 * useSeason — season state derivation, timing, and countdown.
 *
 * Pure functions for computing season state from a start timestamp.
 * React hook wrapping will be added when components need live countdown.
 */

import {
  SEASON_ACTIVE_WEEKS,
  SEASON_COOLDOWN_WEEKS,
} from "@/config/season.js";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVE_DURATION_MS = SEASON_ACTIVE_WEEKS * ONE_WEEK_MS;
const TOTAL_DURATION_MS =
  (SEASON_ACTIVE_WEEKS + SEASON_COOLDOWN_WEEKS) * ONE_WEEK_MS;

/**
 * Determine current season status.
 * @param {number} startTime — season start timestamp (ms)
 * @returns {'active' | 'cooldown' | 'ended'}
 */
export function getSeasonStatus(startTime) {
  const elapsed = Date.now() - startTime;
  if (elapsed < ACTIVE_DURATION_MS) return "active";
  if (elapsed < TOTAL_DURATION_MS) return "cooldown";
  return "ended";
}

/**
 * Get the current week number (1-indexed, capped at SEASON_ACTIVE_WEEKS).
 * @param {number} startTime — season start timestamp (ms)
 * @returns {number}
 */
export function getWeekNumber(startTime) {
  const elapsed = Date.now() - startTime;
  const week = Math.floor(elapsed / ONE_WEEK_MS) + 1;
  return Math.min(week, SEASON_ACTIVE_WEEKS);
}

/**
 * Get time remaining until season end (active phase) in ms.
 * @param {number} startTime — season start timestamp (ms)
 * @returns {number} ms remaining, 0 if ended
 */
export function getTimeRemaining(startTime) {
  const remaining = ACTIVE_DURATION_MS - (Date.now() - startTime);
  return Math.max(0, remaining);
}

/**
 * Get season progress as a percentage (0-100).
 * @param {number} startTime — season start timestamp (ms)
 * @returns {number}
 */
export function getSeasonProgress(startTime) {
  const elapsed = Date.now() - startTime;
  const progress = (elapsed / ACTIVE_DURATION_MS) * 100;
  return Math.min(100, Math.max(0, progress));
}
