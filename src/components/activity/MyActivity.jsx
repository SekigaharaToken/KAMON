/**
 * MyActivity — personal stats section combining all activity meters.
 *
 * Props:
 *   houseConfig     — current House config
 *   walletAddress   — user's wallet address
 *   streak          — { current, longest, isAtRisk }
 *   staking         — { staked, pendingRewards }
 *   onChat          — { messageCount, percentage } or null
 */

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { KamonRenderer } from "@/components/house/KamonRenderer.jsx";
import { StreakMeter } from "./StreakMeter.jsx";
import { StakingMeter } from "./StakingMeter.jsx";
import { OnChatCount } from "./OnChatCount.jsx";
import { fadeInUp, staggerDelay } from "@/lib/motion.js";

export function MyActivity({
  houseConfig = null,
  walletAddress = null,
  streak = {},
  staking = {},
  onChat = null,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold">{t("activity.title")}</h2>

      {houseConfig && walletAddress && (
        <motion.div className="flex justify-center" {...fadeInUp}>
          <KamonRenderer
            houseId={houseConfig.id}
            walletAddress={walletAddress}
            size={160}
          />
        </motion.div>
      )}

      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, ...staggerDelay(1) }}>
        <StreakMeter
          currentStreak={streak.current ?? 0}
          longestStreak={streak.longest ?? 0}
          isAtRisk={streak.isAtRisk ?? false}
        />
      </motion.div>

      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, ...staggerDelay(2) }}>
        <StakingMeter
          staked={staking.staked ?? "0"}
          pendingRewards={staking.pendingRewards ?? "0"}
        />
      </motion.div>

      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, ...staggerDelay(3) }}>
        <OnChatCount
          messageCount={onChat?.messageCount ?? null}
          percentage={onChat?.percentage ?? null}
        />
      </motion.div>
    </div>
  );
}
