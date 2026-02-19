/**
 * Season configuration — timing, rewards, and structure.
 */

/** Season duration in weeks */
export const SEASON_ACTIVE_WEEKS = 12;

/** Cooldown duration in weeks */
export const SEASON_COOLDOWN_WEEKS = 1;

/** Total $DOJO reward pool per season */
export const SEASON_REWARD_POOL = 500_000;

/** Leaderboard cache TTL in milliseconds (15 minutes) */
export const LEADERBOARD_CACHE_TTL = 15 * 60 * 1000;

/** Leaderboard localStorage key */
export const LEADERBOARD_CACHE_KEY = "kamon_leaderboard_cache";

/** Scoring weights */
export const SCORING_WEIGHTS = {
  dojo: 0.40,
  staking: 0.30,
  onchat: 0.30,
};

/** Fallback scoring weights (when OnChat is unavailable) */
export const SCORING_WEIGHTS_FALLBACK = {
  dojo: 0.40,
  staking: 0.60,
};

/** Max DOJO streak for normalization (30 days = 100%) */
export const MAX_DOJO_STREAK = 30;

/** Staking badge eligibility threshold (4 continuous weeks) */
export const STAKING_BADGE_WEEKS = 4;
