/**
 * useStaking — staking pool operations via Mint Club V2 SDK.
 *
 * Uses mintclub.network().stake (the Stake helper) with a numeric pool ID,
 * NOT the per-token stake API (which doesn't exist).
 *
 * Returns are normalized to a consistent shape for callers:
 *   getPoolState → { totalStaked, rewardPool, startTime }
 *   getUserPosition → { staked, pendingRewards, stakedSince }
 */

import { mintclub, ensureInitialized, getMintClub } from "@/lib/mintclub.js";
import { MINT_CLUB_NETWORK } from "@/config/contracts.js";
import { STAKING_POOL_ID } from "@/config/season.js";

async function getStakeHelper() {
  const mc = await getMintClub();
  if (!mc) throw new Error("Mint Club SDK not available in local dev mode");
  return mc.network(MINT_CLUB_NETWORK).stake;
}

/**
 * Get the current pool state (total staked, reward pool, start time).
 * @returns {Promise<object|null>}
 */
export async function getPoolState() {
  if (!STAKING_POOL_ID) return null;
  const stake = await getStakeHelper();
  const result = await stake.getPool({ poolId: STAKING_POOL_ID });
  // SDK returns { poolId, pool: { totalStaked, rewardAmount, rewardStartsAt, ... }, ... }
  const p = result.pool;
  return {
    totalStaked: p.totalStaked,
    rewardPool: p.rewardAmount,
    startTime: p.rewardStartsAt,
  };
}

/**
 * Get user's staking position (staked amount, pending rewards).
 * @param {string} _unused — kept for call-site compat (was poolAddress)
 * @param {string} walletAddress
 * @returns {Promise<object|null>}
 */
export async function getUserPosition(_unused, walletAddress) {
  if (!STAKING_POOL_ID || !walletAddress) return null;
  const stake = await getStakeHelper();

  const [userStake, claimable] = await Promise.all([
    stake.getUserPoolStake({ user: walletAddress, poolId: STAKING_POOL_ID }),
    stake.getClaimableReward({ poolId: STAKING_POOL_ID, staker: walletAddress }),
  ]);

  return {
    staked: userStake.stakedAmount,
    pendingRewards: claimable,
  };
}

/**
 * Stake tokens into the pool.
 * @param {string} _unused — kept for call-site compat (was poolAddress)
 * @param {bigint} amount — amount to stake (must be > 0)
 * @param {object} walletClient — viem WalletClient from useWalletClient()
 * @returns {Promise<object>} — tx receipt
 */
export async function stakeTokens(_unused, amount, walletClient) {
  if (!amount || amount <= 0n) throw new Error("Stake amount must be greater than 0");
  if (!walletClient) throw new Error("Wallet client is required");
  ensureInitialized();
  mintclub.withWalletClient(walletClient);
  const stake = mintclub.network(MINT_CLUB_NETWORK).stake;
  const receipt = await stake.stake({ poolId: STAKING_POOL_ID, amount });
  // Mint Club SDK swallows errors and returns undefined — re-throw
  if (!receipt) throw new Error("Transaction was not completed");
  return receipt;
}

/**
 * Unstake tokens from the pool.
 * @param {string} _unused — kept for call-site compat (was poolAddress)
 * @param {bigint} amount — amount to withdraw
 * @param {object} walletClient — viem WalletClient from useWalletClient()
 * @returns {Promise<object>} — tx receipt
 */
export async function unstakeTokens(_unused, amount, walletClient) {
  if (!walletClient) throw new Error("Wallet client is required");
  ensureInitialized();
  mintclub.withWalletClient(walletClient);
  const stake = mintclub.network(MINT_CLUB_NETWORK).stake;
  const receipt = await stake.unstake({ poolId: STAKING_POOL_ID, amount });
  if (!receipt) throw new Error("Transaction was not completed");
  return receipt;
}

/**
 * Claim pending $DOJO rewards.
 * @param {string} _unused — kept for call-site compat (was poolAddress)
 * @param {object} walletClient — viem WalletClient from useWalletClient()
 * @returns {Promise<object>} — tx receipt
 */
export async function claimRewards(_unused, walletClient) {
  if (!walletClient) throw new Error("Wallet client is required");
  ensureInitialized();
  mintclub.withWalletClient(walletClient);
  const stake = mintclub.network(MINT_CLUB_NETWORK).stake;
  const receipt = await stake.claim({ poolId: STAKING_POOL_ID });
  if (!receipt) throw new Error("Transaction was not completed");
  return receipt;
}
