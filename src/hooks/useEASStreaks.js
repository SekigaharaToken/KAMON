/**
 * useEASStreaks — direct DojoResolver reads for DOJO streak data.
 *
 * Reads currentStreak, longestStreak, lastCheckIn from the DojoResolver contract.
 * Pure async functions; React hooks (TanStack Query) added when components need them.
 */

import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { dojoResolverAbi } from "@/config/abis/dojoResolver.js";
import { DOJO_RESOLVER_ADDRESS } from "@/config/contracts.js";

const client = createPublicClient({
  chain: base,
  transport: http(),
});

const STREAK_AT_RISK_THRESHOLD = 23 * 3600; // 23 hours in seconds

/**
 * Get current streak for a wallet address.
 * @param {string} walletAddress
 * @returns {Promise<bigint|null>}
 */
export async function getCurrentStreak(walletAddress) {
  if (!walletAddress) return null;
  return client.readContract({
    address: DOJO_RESOLVER_ADDRESS,
    abi: dojoResolverAbi,
    functionName: "currentStreak",
    args: [walletAddress],
  });
}

/**
 * Get longest streak for a wallet address.
 * @param {string} walletAddress
 * @returns {Promise<bigint|null>}
 */
export async function getLongestStreak(walletAddress) {
  if (!walletAddress) return null;
  return client.readContract({
    address: DOJO_RESOLVER_ADDRESS,
    abi: dojoResolverAbi,
    functionName: "longestStreak",
    args: [walletAddress],
  });
}

/**
 * Get last check-in timestamp for a wallet address.
 * @param {string} walletAddress
 * @returns {Promise<bigint|null>}
 */
export async function getLastCheckIn(walletAddress) {
  if (!walletAddress) return null;
  return client.readContract({
    address: DOJO_RESOLVER_ADDRESS,
    abi: dojoResolverAbi,
    functionName: "lastCheckIn",
    args: [walletAddress],
  });
}

/**
 * Check if a streak is at risk (last check-in > 23 hours ago).
 * @param {number|null} lastCheckInTimestamp — unix timestamp in seconds
 * @returns {boolean}
 */
export function isStreakAtRisk(lastCheckInTimestamp) {
  if (!lastCheckInTimestamp) return false;
  const now = Math.floor(Date.now() / 1000);
  return now - lastCheckInTimestamp > STREAK_AT_RISK_THRESHOLD;
}
