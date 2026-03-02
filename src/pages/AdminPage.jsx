/**
 * AdminPage — operator-only season management.
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { AdminPanel } from "@/components/admin/AdminPanel.jsx";
import { SeasonSnapshot } from "@/components/admin/SeasonSnapshot.jsx";
import { AirdropTrigger } from "@/components/admin/AirdropTrigger.jsx";
import { fadeInUp } from "@/lib/motion.js";
import { useWalletAddress } from "@/hooks/useWalletAddress.js";
import { getSeasonStatus, getWeekNumber } from "@/hooks/useSeason.js";
import { OPERATOR_ADDRESS, STAKING_POOL_ADDRESS, DOJO_TOKEN_ADDRESS } from "@/config/contracts.js";
import { getPoolState } from "@/hooks/useStaking.js";
import { mintclub } from "@/lib/mintclub.js";
import { useLeaderboard } from "@/hooks/useLeaderboard.js";
import { createAirdrop } from "@/lib/merkleAirdrop.js";
import { SEASON_REWARD_POOL } from "@/config/season.js";

export default function AdminPage() {
  const { address } = useWalletAddress();

  const isOperator =
    !!address &&
    !!OPERATOR_ADDRESS &&
    address.toLowerCase() === OPERATOR_ADDRESS;

  // Query pool startTime to derive season state
  const { data: poolState } = useQuery({
    queryKey: ["stakingPool", STAKING_POOL_ADDRESS],
    queryFn: () => getPoolState(STAKING_POOL_ADDRESS),
    enabled: !!mintclub && !!STAKING_POOL_ADDRESS,
    staleTime: 30_000,
  });

  // startTime from pool is in seconds; convert to ms.
  // When pool data is unavailable, fall back to stable defaults.
  const startTimeMs = poolState?.startTime
    ? Number(poolState.startTime) * 1000
    : null;

  const seasonStatus = startTimeMs ? getSeasonStatus(startTimeMs) : "active";
  const weekNumber = startTimeMs ? getWeekNumber(startTimeMs) : 1;

  // Live leaderboard data — used to populate snapshot and recipient list
  const { rankings } = useLeaderboard();

  // Snapshot state — set when the operator confirms the snapshot
  const [winnerMembers, setWinnerMembers] = useState([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // Airdrop execution state
  const [airdropLoading, setAirdropLoading] = useState(false);
  const [airdropTxHash, setAirdropTxHash] = useState(null);

  /**
   * Confirm snapshot — store the winning house's member addresses.
   * The winner is rankings[0] (highest scoring house).
   */
  const handleConfirmSnapshot = useCallback(() => {
    setSnapshotLoading(true);
    const winner = rankings[0] ?? null;
    const members = winner?.members ?? [];
    setWinnerMembers(members);
    setSnapshotLoading(false);
  }, [rankings]);

  /**
   * Execute airdrop — call createAirdrop with the winner member list.
   * Guard: no-op if winnerMembers is empty.
   */
  const handleTriggerAirdrop = useCallback(async () => {
    if (winnerMembers.length === 0) return;

    setAirdropLoading(true);
    try {
      const amountPerClaim = BigInt(
        Math.floor(SEASON_REWARD_POOL / winnerMembers.length)
      );
      const txHash = await createAirdrop({
        tokenAddress: DOJO_TOKEN_ADDRESS,
        amountPerClaim,
        recipients: winnerMembers,
        title: `Season ${weekNumber} Rewards`,
      });
      setAirdropTxHash(txHash);
    } finally {
      setAirdropLoading(false);
    }
  }, [winnerMembers, weekNumber]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <AdminPanel
          isOperator={isOperator}
          seasonStatus={seasonStatus}
          weekNumber={weekNumber}
        />
      </motion.div>
      {isOperator && (
        <>
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
          >
            <SeasonSnapshot
              rankings={rankings}
              onConfirm={handleConfirmSnapshot}
              isLoading={snapshotLoading}
            />
          </motion.div>
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.2 }}
          >
            <AirdropTrigger
              winnerMembers={winnerMembers}
              onTrigger={handleTriggerAirdrop}
              isLoading={airdropLoading}
              txHash={airdropTxHash}
            />
          </motion.div>
        </>
      )}
    </div>
  );
}
