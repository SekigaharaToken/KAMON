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

import { erc20Abi, maxUint256 } from "viem";
import { mintclub, ensureInitialized, getMintClub } from "@/lib/mintclub.js";
import { MINT_CLUB_NETWORK, SEKI_TOKEN_ADDRESS } from "@/config/contracts.js";
import { STAKING_POOL_ID } from "@/config/season.js";

/** Mint Club Stake contract address on Base */
const STAKE_CONTRACT_ADDRESS = "0x9Ab05EcA10d087f23a1B22A44A714cdbBA76E802";

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
 * Ensure the staking contract has ERC-20 approval to transfer $SEKI.
 * Stake.stake() does NOT auto-approve (unlike Token.buy()).
 */
async function ensureStakingApproval(walletClient, amount) {
  const publicClient = mintclub.wallet._getPublicClient(walletClient.chain.id);
  const owner = walletClient.account.address;

  const allowance = await publicClient.readContract({
    address: SEKI_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, STAKE_CONTRACT_ADDRESS],
  });

  if (allowance >= amount) return;

  const hash = await walletClient.writeContract({
    address: SEKI_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "approve",
    args: [STAKE_CONTRACT_ADDRESS, maxUint256],
    chain: walletClient.chain,
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });
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

  // Stake.stake() doesn't auto-approve — handle ERC-20 approval first
  await ensureStakingApproval(walletClient, amount);

  const stake = mintclub.network(MINT_CLUB_NETWORK).stake;
  let sdkError = null;
  const receipt = await stake.stake({
    poolId: STAKING_POOL_ID,
    amount,
    onError: (e) => { sdkError = e; },
  });
  if (!receipt) throw sdkError || new Error("Transaction was not completed");
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
  let sdkError = null;
  const receipt = await stake.unstake({
    poolId: STAKING_POOL_ID,
    amount,
    onError: (e) => { sdkError = e; },
  });
  if (!receipt) throw sdkError || new Error("Transaction was not completed");
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
  let sdkError = null;
  const receipt = await stake.claim({
    poolId: STAKING_POOL_ID,
    onError: (e) => { sdkError = e; },
  });
  if (!receipt) throw sdkError || new Error("Transaction was not completed");
  return receipt;
}
