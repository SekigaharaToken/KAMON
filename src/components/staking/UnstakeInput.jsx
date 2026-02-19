/**
 * UnstakeInput — amount input for unstaking $SEKI.
 *
 * Props:
 *   staked     — user's current staked amount string
 *   onUnstake  — callback with amount
 *   isLoading  — whether an unstake tx is pending
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Alert } from "@/components/ui/alert.jsx";
import { tapSpring } from "@/lib/motion.js";

export function UnstakeInput({ staked = "0", onUnstake, isLoading = false }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");

  function handleUnstake() {
    if (!amount || Number(amount) <= 0) return;
    onUnstake?.(amount);
    setAmount("");
  }

  return (
    <div className="space-y-3">
      <Alert variant="destructive" className="text-sm">
        Unstaking stops your reward stream. You can restake at any time.
      </Alert>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t("swap.amount")}</span>
        <span className="text-muted-foreground">Staked: {staked} $SEKI</span>
      </div>
      <Input
        type="number"
        min="0"
        step="any"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <motion.div {...tapSpring}>
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleUnstake}
          disabled={isLoading || !amount || Number(amount) <= 0}
        >
          {isLoading ? "..." : t("staking.unstake")}
        </Button>
      </motion.div>
    </div>
  );
}
