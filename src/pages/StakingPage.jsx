/**
 * StakingPage — $SEKI staking pool with Stake/Claim/Unstake tabs.
 *
 * Shows pool stats at top, user position in middle, action tabs at bottom.
 * Preview state when wallet not connected.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { formatUnits, parseUnits, erc20Abi } from "viem";
import { useReadContract } from "wagmi";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useWalletAddress } from "@/hooks/useWalletAddress.js";
import { mintclub } from "@/lib/mintclub.js";
import {
  STAKING_POOL_ADDRESS,
  SEKI_TOKEN_ADDRESS,
} from "@/config/contracts.js";
import {
  getPoolState,
  getUserPosition,
  stakeTokens,
  unstakeTokens,
  claimRewards,
} from "@/hooks/useStaking.js";
import { getTimeRemaining } from "@/hooks/useSeason.js";
import { Card, CardContent } from "@/components/ui/card";
import { StakingPool } from "@/components/staking/StakingPool.jsx";
import { StakingBadge } from "@/components/staking/StakingBadge.jsx";
import { getBadgeProgress } from "@/lib/stakingBadge.js";
import { fadeInUp } from "@/lib/motion.js";

function formatCountdown(ms) {
  if (ms <= 0) return "0d";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (weeks > 0) return `${weeks}w ${remainingDays}d`;
  return `${days}d`;
}

const fmt = (v) => (v != null ? formatUnits(v, 18) : "0");

export default function StakingPage() {
  const { t } = useTranslation();
  const { address, canTransact } = useWalletAddress();
  const [isPending, setIsPending] = useState(false);

  const enabled = !!mintclub;

  const { data: poolState, isLoading: poolLoading } = useQuery({
    queryKey: ["stakingPool", STAKING_POOL_ADDRESS],
    queryFn: () => getPoolState(STAKING_POOL_ADDRESS),
    enabled: enabled && !!STAKING_POOL_ADDRESS,
    staleTime: 30_000,
  });

  const {
    data: userPos,
    isLoading: posLoading,
    refetch: refetchPos,
  } = useQuery({
    queryKey: ["stakingPosition", STAKING_POOL_ADDRESS, address],
    queryFn: () => getUserPosition(STAKING_POOL_ADDRESS, address),
    enabled: enabled && !!STAKING_POOL_ADDRESS && !!address,
    staleTime: 15_000,
  });

  const { data: sekiBalance, refetch: refetchBalance } = useReadContract({
    address: SEKI_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: enabled && !!SEKI_TOKEN_ADDRESS && !!address },
  });

  if (!mintclub) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <motion.h1 className="font-serif text-2xl font-bold" {...fadeInUp}>
          {t("staking.title")}
        </motion.h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("staking.unavailable")}
          </CardContent>
        </Card>
      </div>
    );
  }

  const poolStats = {
    totalStaked:
      poolState?.totalStaked != null ? fmt(poolState.totalStaked) : "—",
    poolSize: poolState?.rewardPool != null ? fmt(poolState.rewardPool) : "—",
    seasonEnd: poolState?.startTime
      ? formatCountdown(getTimeRemaining(Number(poolState.startTime) * 1000))
      : "—",
  };

  const userPosition = {
    staked: fmt(userPos?.staked),
    pendingRewards: fmt(userPos?.pendingRewards),
  };

  const balance = fmt(sekiBalance);

  // Compute badge progress from user's stake timestamp.
  // userPos.stakedSince is preferred; fall back to pool startTime when the
  // user has a non-zero stake (i.e. they have been staking since pool start).
  const stakeTimestamp =
    userPos?.stakedSince ??
    (userPos?.staked && userPos.staked > 0n ? poolState?.startTime : null);
  const badgeProgress = getBadgeProgress(stakeTimestamp);

  async function handleStake(amount) {
    if (!canTransact) return;
    setIsPending(true);
    try {
      await stakeTokens(STAKING_POOL_ADDRESS, parseUnits(amount, 18));
      toast.success(t("staking.stakeSuccess"));
      refetchPos();
      refetchBalance();
    } catch {
      toast.error(t("staking.stakeFailed"));
    } finally {
      setIsPending(false);
    }
  }

  async function handleUnstake(amount) {
    if (!canTransact) return;
    setIsPending(true);
    try {
      await unstakeTokens(STAKING_POOL_ADDRESS, parseUnits(amount, 18));
      toast.success(t("staking.unstakeSuccess"));
      refetchPos();
      refetchBalance();
    } catch {
      toast.error(t("staking.unstakeFailed"));
    } finally {
      setIsPending(false);
    }
  }

  async function handleClaim() {
    if (!canTransact) return;
    setIsPending(true);
    try {
      await claimRewards(STAKING_POOL_ADDRESS);
      toast.success(t("staking.claimSuccess"));
      refetchPos();
    } catch {
      toast.error(t("staking.claimFailed"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.h1 className="font-serif text-2xl font-bold" {...fadeInUp}>
        {t("staking.title")}
      </motion.h1>
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
        <StakingPool
          poolStats={poolStats}
          userPosition={userPosition}
          balance={balance}
          onStake={handleStake}
          onUnstake={handleUnstake}
          onClaim={handleClaim}
          isLoading={poolLoading || posLoading || isPending}
        />
      </motion.div>
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.2 }}>
        <StakingBadge
          weeks={badgeProgress.weeks}
          threshold={badgeProgress.threshold}
          earned={badgeProgress.earned}
          progress={badgeProgress.progress}
        />
      </motion.div>
    </div>
  );
}
