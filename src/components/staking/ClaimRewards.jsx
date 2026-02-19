/**
 * ClaimRewards — display pending $DOJO and claim button.
 *
 * Props:
 *   pendingAmount — pending $DOJO rewards string
 *   onClaim       — callback to claim rewards
 *   isLoading     — whether a claim tx is pending
 */

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.jsx";
import { tapSpring } from "@/lib/motion.js";

export function ClaimRewards({ pendingAmount = "0", onClaim, isLoading = false }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-center">
      <div>
        <p className="text-sm text-muted-foreground">{t("staking.claimable")}</p>
        <p className="font-mono text-3xl font-bold">{pendingAmount}</p>
        <p className="text-sm text-muted-foreground">$DOJO</p>
      </div>
      <motion.div {...tapSpring}>
        <Button
          className="w-full"
          onClick={onClaim}
          disabled={isLoading || pendingAmount === "0"}
        >
          {isLoading ? "..." : t("staking.claim")}
        </Button>
      </motion.div>
    </div>
  );
}
