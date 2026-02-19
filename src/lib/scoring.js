/**
 * Leaderboard scoring — pure functions for the 40/30/30 formula.
 * Implemented in Phase 6 (TDD — tests first).
 */

import {
  SCORING_WEIGHTS,
  SCORING_WEIGHTS_FALLBACK,
  MAX_DOJO_STREAK,
} from "@/config/season.js";

/**
 * Normalize DOJO streak to 0–100 score.
 * 30-day streak = 100, linear scale, capped at 100.
 */
export function normalizeDojoStreak(streak) {
  if (!streak || streak <= 0) return 0;
  return Math.min((streak / MAX_DOJO_STREAK) * 100, 100);
}

/**
 * Normalize staking amount to 0–100 score.
 * Score = (userStake / totalStake) * 100
 */
export function normalizeStaking(userStake, totalStake) {
  if (!totalStake || totalStake <= 0) return 0;
  if (!userStake || userStake <= 0) return 0;
  return (userStake / totalStake) * 100;
}

/**
 * Normalize OnChat message count to 0–100 score.
 * Score = (userMessages / maxMessages) * 100
 */
export function normalizeOnChat(userMessages, maxMessages) {
  if (!maxMessages || maxMessages <= 0) return 0;
  if (!userMessages || userMessages <= 0) return 0;
  return Math.min((userMessages / maxMessages) * 100, 100);
}

/**
 * Compute a single wallet's activity score.
 * Uses 40/30/30 weights, or 40/60 fallback when OnChat is unavailable.
 */
export function computeWalletScore({ dojoStreak, stakePct, onChatPct }) {
  const dojo = normalizeDojoStreak(dojoStreak);
  const staking = stakePct ?? 0;

  // Fallback: OnChat unavailable (null)
  if (onChatPct === null || onChatPct === undefined) {
    return (
      dojo * SCORING_WEIGHTS_FALLBACK.dojo +
      staking * SCORING_WEIGHTS_FALLBACK.staking
    );
  }

  const onChat = onChatPct ?? 0;
  return (
    dojo * SCORING_WEIGHTS.dojo +
    staking * SCORING_WEIGHTS.staking +
    onChat * SCORING_WEIGHTS.onchat
  );
}

/**
 * Compute a House's total score from its members' scores.
 */
export function computeHouseScore(walletScores) {
  if (!walletScores?.length) return 0;
  return walletScores.reduce((sum, s) => sum + s, 0);
}

/**
 * Rank Houses by score descending. Ties broken by totalStaked.
 */
export function rankHouses(houseScores) {
  return [...houseScores].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.totalStaked ?? 0) - (a.totalStaked ?? 0);
  });
}
