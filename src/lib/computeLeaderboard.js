/**
 * computeLeaderboard — full client-side scoring pipeline.
 *
 * For each House:
 *   1. Enumerate NFT holders via getHouseHolders.
 *   2. For each holder: fetch DOJO streak, staking position, OnChat messages.
 *   3. Compute per-wallet scores using 40/30/30 formula (or 40/60 fallback).
 *   4. Sum wallet scores to get House score.
 *   5. Rank Houses by score (ties broken by totalStaked).
 *
 * Returns a ranked array consumed by LeaderboardPage → Leaderboard component.
 */

import { HOUSE_LIST } from "@/config/houses.js";
import { STAKING_POOL_ADDRESS } from "@/config/contracts.js";
import { getHouseHolders } from "@/lib/getHouseHolders.js";
import { getCurrentStreak } from "@/hooks/useEASStreaks.js";
import { getUserPosition, getPoolState } from "@/hooks/useStaking.js";
import {
  getOnChatMessageCount,
  getOnChatTotalMessages,
} from "@/hooks/useOnChat.js";
import {
  normalizeStaking,
  normalizeOnChat,
  computeWalletScore,
  computeHouseScore,
  rankHouses,
} from "@/lib/scoring.js";

/**
 * Fetch and score all holders for a single House.
 *
 * @param {object} house — House metadata object from HOUSE_LIST
 * @param {bigint} totalStaked — total staked in pool (for staking normalization)
 * @param {number|null} maxOnChatMessages — channel max for normalization (null if unavailable)
 * @param {bigint} seasonStartBlock — season start block for OnChat window
 * @returns {Promise<{ walletScores: number[], memberCount: number, totalStaked: bigint }>}
 */
async function scoreHouseHolders(house, totalStaked, maxOnChatMessages, seasonStartBlock) {
  let holders = [];
  try {
    holders = await getHouseHolders(house.address);
  } catch (err) {
    console.warn(`[Leaderboard] Failed to get holders for ${house.id}:`, err.message);
    return { walletScores: [], memberCount: 0, totalStaked: 0n };
  }

  if (holders.length === 0) {
    return { walletScores: [], memberCount: 0, totalStaked };
  }

  // Fetch all wallet data in parallel
  const [streakResults, positionResults, onChatResults] = await Promise.all([
    Promise.allSettled(holders.map((addr) => getCurrentStreak(addr))),
    Promise.allSettled(holders.map((addr) => getUserPosition(STAKING_POOL_ADDRESS, addr))),
    Promise.allSettled(
      holders.map((addr) => getOnChatMessageCount(addr, seasonStartBlock))
    ),
  ]);

  const walletScores = holders.map((_, i) => {
    const streak = streakResults[i].status === "fulfilled"
      ? Number(streakResults[i].value ?? 0n)
      : 0;

    const position = positionResults[i].status === "fulfilled"
      ? positionResults[i].value
      : null;
    const userStake = position?.staked ?? 0n;
    const stakePct = normalizeStaking(
      Number(userStake),
      Number(totalStaked)
    );

    const onChatCount = onChatResults[i].status === "fulfilled"
      ? onChatResults[i].value
      : null;

    // onChatPct: null triggers 40/60 fallback in computeWalletScore
    const onChatPct =
      onChatCount !== null && maxOnChatMessages
        ? normalizeOnChat(onChatCount, maxOnChatMessages)
        : null;

    return computeWalletScore({
      dojoStreak: streak,
      stakePct,
      onChatPct,
    });
  });

  return { walletScores, memberCount: holders.length, totalStaked };
}

/**
 * Compute leaderboard rankings for all Houses.
 *
 * @param {bigint} [seasonStartBlock=0n] — season start block for OnChat window
 * @returns {Promise<Array<{
 *   house: object,
 *   memberCount: number,
 *   score: number,
 *   totalStaked: bigint,
 *   lastUpdated: number
 * }>>} ranked array
 */
export async function computeLeaderboard(seasonStartBlock = 0n) {
  const timestamp = Date.now();

  // Fetch pool state and total OnChat messages once for all Houses
  const [poolStateResult, maxOnChatResult] = await Promise.allSettled([
    getPoolState(STAKING_POOL_ADDRESS),
    getOnChatTotalMessages(),
  ]);

  const poolState = poolStateResult.status === "fulfilled" ? poolStateResult.value : null;
  const totalStaked = poolState?.totalStaked ?? 0n;
  const maxOnChatMessages = maxOnChatResult.status === "fulfilled"
    ? maxOnChatResult.value
    : null;

  // Score all Houses in parallel
  const houseResults = await Promise.allSettled(
    HOUSE_LIST.map((house) =>
      scoreHouseHolders(house, totalStaked, maxOnChatMessages, seasonStartBlock)
    )
  );

  // Build houseScores for rankHouses()
  const houseScores = HOUSE_LIST.map((house, i) => {
    const result = houseResults[i];
    if (result.status === "rejected") {
      return { id: house.id, score: 0, memberCount: 0, totalStaked: 0 };
    }
    const { walletScores, memberCount, totalStaked: houseTotalStaked } = result.value;
    return {
      id: house.id,
      score: computeHouseScore(walletScores),
      memberCount,
      // Convert BigInt to Number for rankHouses sort arithmetic
      totalStaked: Number(houseTotalStaked ?? 0n),
    };
  });

  // Rank and build the final rankings array
  const ranked = rankHouses(houseScores);

  return ranked.map((entry) => {
    const house = HOUSE_LIST.find((h) => h.id === entry.id);
    const raw = houseScores.find((h) => h.id === entry.id);
    return {
      house,
      memberCount: raw?.memberCount ?? 0,
      score: entry.score,
      totalStaked: entry.totalStaked ?? 0,
      lastUpdated: timestamp,
    };
  });
}
