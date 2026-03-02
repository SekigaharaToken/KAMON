/**
 * stakingBadge.js — pure functions for staking badge progress tracking.
 *
 * Computes how many full weeks a user has been staking and whether
 * they have earned the Staking Badge NFT (requires 4+ continuous weeks).
 */

import { STAKING_BADGE_WEEKS } from "@/config/season.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Convert a timestamp to milliseconds.
 * Accepts: number (ms), BigInt (seconds from chain), or null/undefined.
 * @param {number|bigint|null|undefined} timestamp
 * @returns {number|null}
 */
function toMs(timestamp) {
  if (timestamp == null) return null;
  if (typeof timestamp === "bigint") {
    // On-chain timestamps are in seconds
    return Number(timestamp) * 1000;
  }
  return Number(timestamp);
}

/**
 * Compute how many full weeks have elapsed since a given stake timestamp.
 *
 * @param {number|bigint|null|undefined} stakeTimestamp — ms since epoch (or BigInt seconds)
 * @returns {number} — whole number of complete weeks, minimum 0
 */
export function getStakingWeeks(stakeTimestamp) {
  const ms = toMs(stakeTimestamp);
  if (ms == null) return 0;
  const elapsed = Date.now() - ms;
  if (elapsed <= 0) return 0;
  return Math.floor(elapsed / WEEK_MS);
}

/**
 * Compute badge progress for a given stake timestamp.
 *
 * @param {number|bigint|null|undefined} stakeTimestamp — ms since epoch (or BigInt seconds)
 * @returns {{ weeks: number, threshold: number, earned: boolean, progress: number }}
 */
export function getBadgeProgress(stakeTimestamp) {
  const weeks = getStakingWeeks(stakeTimestamp);
  const threshold = STAKING_BADGE_WEEKS;
  const earned = weeks >= threshold;
  const progress = Math.min(1, weeks / threshold);
  return { weeks, threshold, earned, progress };
}
