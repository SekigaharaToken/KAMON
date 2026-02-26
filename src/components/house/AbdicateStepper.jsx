/**
 * AbdicateStepper — 2-step transaction dialog for leaving a House.
 *
 * Step 1: Sell House NFT back to bonding curve (wallet popup)
 * Step 2: Revoke Membership attestation (wallet popup, non-fatal)
 *
 * Pre-flight: fetches sell price for display, checks NFT balance.
 * If balance is 0, completes immediately (no wallet popups needed).
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useTransactionStepper } from "@/hooks/useTransactionStepper.js";
import { burnHouseNFT, getHouseBalance, getSellPrice } from "@/hooks/useHouseNFT.js";
import { revokeHouse } from "@/hooks/useHouseMembership.js";
import { TransactionStepper } from "@/components/ui/stepper.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.jsx";

export function AbdicateStepper({ houseConfig, open, onOpenChange, onComplete }) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const [refund, setRefund] = useState(null);

  const houseName = houseConfig ? t(houseConfig.nameKey) : "";

  const stepper = useTransactionStepper([
    {
      label: t("stepper.burnNFT"),
      description: t("stepper.burnNFTDesc", { refund: refund ?? "..." }),
    },
    { label: t("stepper.revokeMembership"), description: t("stepper.revokeDesc") },
  ]);

  // Fetch sell price when dialog opens
  useEffect(() => {
    if (!open || !houseConfig?.address) return;
    getSellPrice(houseConfig.address)
      .then((price) => setRefund(price != null ? formatUnits(price, 18) : "?"))
      .catch(() => setRefund("?"));
  }, [open, houseConfig?.address]);

  async function handleConfirm() {
    // Pre-flight: check NFT balance
    try {
      const balance = await getHouseBalance(houseConfig.address, address);
      if (balance === 0n) {
        onComplete();
        onOpenChange(false);
        return;
      }
    } catch {
      // If balance check fails, proceed with burn attempt
    }

    stepper.start();

    // Step 1: Burn NFT
    try {
      await burnHouseNFT(houseConfig.address, address);
    } catch (err) {
      stepper.fail(err?.shortMessage || err?.message || t("errors.txFailed"));
      return;
    }

    stepper.advance();

    // Step 2: Revoke attestation (non-fatal)
    try {
      await revokeHouse(address);
    } catch (err) {
      stepper.fail(err?.shortMessage || err?.message || t("house.revokeFailed"));
      return;
    }

    stepper.advance();
  }

  function handleRetry() {
    stepper.reset();
    handleConfirm();
  }

  function handleSkip() {
    stepper.advance();
  }

  function handleDone() {
    onComplete();
    onOpenChange(false);
    stepper.reset();
  }

  function handleOpenChange(nextOpen) {
    if (stepper.isActive) return;
    onOpenChange(nextOpen);
    if (!nextOpen) {
      stepper.reset();
      setRefund(null);
    }
  }

  const isRevokeError = stepper.steps[1]?.status === "error";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!stepper.isActive}
        onInteractOutside={(e) => stepper.isActive && e.preventDefault()}
        onEscapeKeyDown={(e) => stepper.isActive && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("stepper.abdicateTitle", { houseName })}</DialogTitle>
          <DialogDescription>
            {t("house.abdicateDescription", { refund: refund ?? "..." })}
          </DialogDescription>
        </DialogHeader>

        <TransactionStepper steps={stepper.steps} className="py-4" />

        <DialogFooter>
          {/* Initial state: Confirm button */}
          {stepper.activeStep === -1 && !stepper.isComplete && (
            <Button variant="destructive" onClick={handleConfirm}>
              {t("stepper.confirm")}
            </Button>
          )}

          {/* Error state */}
          {stepper.steps.some((s) => s.status === "error") && (
            <div className="flex gap-2">
              {isRevokeError && (
                <Button variant="outline" onClick={handleSkip}>
                  {t("stepper.skip")}
                </Button>
              )}
              <Button variant="outline" onClick={handleRetry}>
                {t("stepper.retry")}
              </Button>
            </div>
          )}

          {/* Complete state: Done button */}
          {stepper.isComplete && (
            <Button onClick={handleDone}>
              {t("stepper.done")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
