/**
 * ActivityPage — personal activity dashboard.
 */

import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { formatTokenAmount } from "@/lib/formatTokenAmount.js";
import { useWalletAddress } from "@/hooks/useWalletAddress.js";
import {
  getOnChatMessageCount,
  getOnChatTotalMessages,
  normalizeOnChatMessages,
} from "@/hooks/useOnChat.js";
import {
  getCurrentStreak,
  getLongestStreak,
  getLastCheckIn,
  isStreakAtRisk,
} from "@/hooks/useEASStreaks.js";
import { getUserPosition } from "@/hooks/useStaking.js";
import { useMintClubReady } from "@/lib/mintclub.js";
import { STAKING_POOL_ADDRESS } from "@/config/contracts.js";
import { ONCHAT_CACHE_TTL, SEASON_START_BLOCK } from "@/config/season.js";
import { MyActivity } from "@/components/activity/MyActivity.jsx";
import { fadeInUp } from "@/lib/motion.js";

const EAS_STALE_TIME = 30_000;
const fmt = (v) => formatTokenAmount(v != null ? formatUnits(v, 18) : "0");


export default function ActivityPage() {
  const { address } = useWalletAddress();

  const sdkEnabled = useMintClubReady();

  // OnChat queries
  const { data: messageCount, isLoading: messageCountLoading } = useQuery({
    queryKey: ["onchat", "messages", address],
    queryFn: () => getOnChatMessageCount(address, SEASON_START_BLOCK),
    staleTime: ONCHAT_CACHE_TTL,
    enabled: !!address,
  });

  const { data: totalMessages, isLoading: totalMessagesLoading } = useQuery({
    queryKey: ["onchat", "total"],
    queryFn: () => getOnChatTotalMessages(),
    staleTime: ONCHAT_CACHE_TTL,
  });

  // EAS streak queries — 30s cache per CLAUDE.md
  const { data: currentStreakRaw } = useQuery({
    queryKey: ["eas", "currentStreak", address],
    queryFn: () => getCurrentStreak(address),
    staleTime: EAS_STALE_TIME,
    enabled: !!address,
  });

  const { data: longestStreakRaw } = useQuery({
    queryKey: ["eas", "longestStreak", address],
    queryFn: () => getLongestStreak(address),
    staleTime: EAS_STALE_TIME,
    enabled: !!address,
  });

  const { data: lastCheckInRaw } = useQuery({
    queryKey: ["eas", "lastCheckIn", address],
    queryFn: () => getLastCheckIn(address),
    staleTime: EAS_STALE_TIME,
    enabled: !!address,
  });

  // Staking position query — guarded by SDK availability
  const { data: userPos } = useQuery({
    queryKey: ["stakingPosition", STAKING_POOL_ADDRESS, address],
    queryFn: () => getUserPosition(STAKING_POOL_ADDRESS, address),
    staleTime: 15_000,
    enabled: sdkEnabled && !!STAKING_POOL_ADDRESS && !!address,
  });

  // Derive onChat
  const onChatLoading = !!address && (messageCountLoading || totalMessagesLoading);
  const onChatPct = normalizeOnChatMessages(messageCount, totalMessages);
  const onChat =
    messageCount != null ? { messageCount, percentage: onChatPct } : null;

  // Derive streak — only populated when all three queries have returned data
  const streakReady =
    currentStreakRaw != null &&
    longestStreakRaw != null &&
    lastCheckInRaw != null;

  const streak = streakReady
    ? {
        current: Number(currentStreakRaw),
        longest: Number(longestStreakRaw),
        isAtRisk: isStreakAtRisk(Number(lastCheckInRaw)),
      }
    : {};

  // Derive staking — formatted with formatUnits(18)
  const staking =
    userPos != null
      ? {
          staked: fmt(userPos.staked),
          pendingRewards: fmt(userPos.pendingRewards),
        }
      : {};

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <MyActivity
          streak={streak}
          staking={staking}
          onChat={onChat}
          onChatLoading={onChatLoading}
        />
      </motion.div>
    </div>
  );
}
