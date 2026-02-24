/**
 * useStaking — staking pool operations via Mint Club SDK.
 *
 * Provides async functions for staking interactions:
 * getPoolState, getUserPosition, stakeTokens, unstakeTokens, claimRewards.
 *
 * React hooks (TanStack Query wrappers) will be added when components need them.
 */

import { mintclub } from "@/lib/mintclub.js";

function getPool(poolAddress) {
  if (!mintclub) throw new Error("Mint Club SDK not available in local dev mode");
  return mintclub.network("base").token(poolAddress).stake();
}

/**
 * Get the current pool state (total staked, reward pool, start time).
 * @param {string} poolAddress
 * @returns {Promise<object|null>}
 */
export async function getPoolState(poolAddress) {
  if (!poolAddress) return null;
  return getPool(poolAddress).getPoolState();
}

/**
 * Get user's staking position (staked amount, pending rewards).
 * @param {string} poolAddress
 * @param {string} walletAddress
 * @returns {Promise<object|null>}
 */
export async function getUserPosition(poolAddress, walletAddress) {
  if (!poolAddress || !walletAddress) return null;
  return getPool(poolAddress).getPosition();
}

/**
 * Stake tokens into the pool.
 * @param {string} poolAddress
 * @param {bigint} amount — amount to stake (must be > 0)
 * @returns {Promise<object>} — tx receipt
 */
export async function stakeTokens(poolAddress, amount) {
  if (!amount || amount <= 0n) throw new Error("Stake amount must be greater than 0");
  return getPool(poolAddress).deposit({ amount });
}

/**
 * Unstake tokens from the pool.
 * @param {string} poolAddress
 * @param {bigint} amount — amount to withdraw
 * @returns {Promise<object>} — tx receipt
 */
export async function unstakeTokens(poolAddress, amount) {
  return getPool(poolAddress).withdraw({ amount });
}

/**
 * Claim pending $DOJO rewards.
 * @param {string} poolAddress
 * @returns {Promise<object>} — tx receipt
 */
export async function claimRewards(poolAddress) {
  return getPool(poolAddress).claim();
}
