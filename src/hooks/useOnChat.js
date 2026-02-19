/**
 * useOnChat — OnChat message counts for scoring.
 *
 * Provides normalization and fallback logic.
 * Actual OnChat SDK query will be added when SDK integration is ready.
 * For now, returns null to trigger 40/60 fallback scoring.
 */

/**
 * Normalize user message count to 0-100 scale.
 * @param {number} userMessages — user's messages this season
 * @param {number} maxMessages — max messages in cohort
 * @returns {number} 0-100
 */
export function normalizeOnChatMessages(userMessages, maxMessages) {
  if (!userMessages || !maxMessages) return 0;
  return Math.min(100, Math.round((userMessages / maxMessages) * 100));
}

/**
 * Get OnChat fallback score.
 * Returns null to signal fallback mode (40% DOJO + 60% Staking).
 * Will return actual score once OnChat SDK is integrated.
 * @returns {null}
 */
export function getOnChatFallbackScore() {
  return null;
}
