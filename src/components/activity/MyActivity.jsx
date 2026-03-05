/**
 * MyActivity — personal stats section combining all activity meters.
 *
 * Props:
 *   streak          — { current, longest, isAtRisk }
 *   staking         — { staked, pendingRewards }
 *   onChat          — { messageCount, percentage } or null
 */

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { StreakMeter } from "./StreakMeter.jsx";
import { StakingMeter } from "./StakingMeter.jsx";
import { OnChatCount } from "./OnChatCount.jsx";
import { fadeInUp, staggerDelay } from "@/lib/motion.js";

export function MyActivity({
  streak = {},
  staking = {},
  onChat = null,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold">{t("activity.title")}</h2>

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
