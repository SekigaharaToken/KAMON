/**
 * StakeInput — amount input for staking $SEKI.
 *
 * Props:
 *   balance    — user's $SEKI balance string
 *   onStake    — callback with amount bigint
 *   isLoading  — whether a stake tx is pending
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import { tapSpring } from "@/lib/motion.js";

export function StakeInput({ balance = "0", onStake, isLoading = false }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");

  function handleStake() {
    if (!amount || Number(amount) <= 0) return;
    onStake?.(amount);
    setAmount("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t("swap.amount")}</span>
        <span className="text-muted-foreground">Balance: {balance} $SEKI</span>
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
          className="w-full"
          onClick={handleStake}
          disabled={isLoading || !amount || Number(amount) <= 0}
        >
          {isLoading ? "..." : t("staking.stake")}
        </Button>
      </motion.div>
    </div>
  );
}
