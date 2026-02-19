/**
 * StakingPool — main staking section with tabs (Stake/Claim/Unstake).
 *
 * Assembles PoolStats, StakeInput, ClaimRewards, UnstakeInput
 * with animated tab switching.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs as TabsPrimitive } from "radix-ui";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedTabsList, AnimatedTabsTrigger } from "@/components/ui/animated-tabs.jsx";
import { PoolStats } from "./PoolStats.jsx";
import { StakeInput } from "./StakeInput.jsx";
import { UnstakeInput } from "./UnstakeInput.jsx";
import { ClaimRewards } from "./ClaimRewards.jsx";
import { tabContent } from "@/lib/motion.js";

export function StakingPool({
  poolStats = {},
  userPosition = {},
  balance = "0",
  onStake,
  onUnstake,
  onClaim,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("stake");

  return (
    <div className="space-y-6">
      <PoolStats
        totalStaked={poolStats.totalStaked ?? "—"}
        seasonEnd={poolStats.seasonEnd ?? "—"}
        poolSize={poolStats.poolSize ?? "—"}
      />

      <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab}>
        <AnimatedTabsList activeValue={activeTab} className="w-full">
          <AnimatedTabsTrigger value="stake" layoutId="staking-tab">
            {t("staking.stake")}
          </AnimatedTabsTrigger>
          <AnimatedTabsTrigger value="claim" layoutId="staking-tab">
            {t("staking.claim")}
          </AnimatedTabsTrigger>
          <AnimatedTabsTrigger value="unstake" layoutId="staking-tab">
            {t("staking.unstake")}
          </AnimatedTabsTrigger>
        </AnimatedTabsList>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeTab === "stake" && (
              <motion.div key="stake" {...tabContent}>
                <StakeInput
                  balance={balance}
                  onStake={onStake}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
            {activeTab === "claim" && (
              <motion.div key="claim" {...tabContent}>
                <ClaimRewards
                  pendingAmount={userPosition.pendingRewards ?? "0"}
                  onClaim={onClaim}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
            {activeTab === "unstake" && (
              <motion.div key="unstake" {...tabContent}>
                <UnstakeInput
                  staked={userPosition.staked ?? "0"}
                  onUnstake={onUnstake}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TabsPrimitive.Root>
    </div>
  );
}
