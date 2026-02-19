/**
 * StakingPage — $SEKI staking pool with Stake/Claim/Unstake tabs.
 *
 * Shows pool stats at top, user position in middle, action tabs at bottom.
 * Preview state when wallet not connected.
 */

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { StakingPool } from "@/components/staking/StakingPool.jsx";
import { fadeInUp } from "@/lib/motion.js";

export default function StakingPage() {
  const { t } = useTranslation();

  // TODO: Wire to useStaking + useSeason hooks when wallet connection is available
  // For now, render the UI structure with placeholder data

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.h1 className="font-serif text-2xl font-bold" {...fadeInUp}>
        {t("staking.title")}
      </motion.h1>
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
        <StakingPool />
      </motion.div>
    </div>
  );
}
