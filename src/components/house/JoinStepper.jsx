/**
 * JoinStepper — 2-step transaction dialog for joining a House.
 *
 * Step 1: Mint House NFT (wallet popup)
 * Step 2: Register Membership attestation (wallet popup, non-fatal)
 *
 * Dialog is locked during active transactions to prevent accidental dismissal.
 */

import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";
import { useTransactionStepper } from "@/hooks/useTransactionStepper.js";
import { mintHouseNFT } from "@/hooks/useHouseNFT.js";
import { attestHouse } from "@/hooks/useHouseMembership.js";
import { useFarcaster } from "@/hooks/useFarcaster.js";
import { isLocalDev } from "@/config/chains.js";
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

export function JoinStepper({ house, open, onOpenChange, onComplete }) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { profile } = useFarcaster();
  const fid = profile?.fid;
  const fidRequired = !isLocalDev && !fid;

  const stepper = useTransactionStepper([
    { label: t("stepper.mintNFT"), description: t("stepper.mintNFTDesc") },
    { label: t("stepper.registerMembership"), description: t("stepper.registerDesc") },
  ]);

  const houseName = house ? t(house.nameKey) : "";

  async function handleBegin() {
    stepper.start();

    // Step 1: Mint NFT
    try {
      await mintHouseNFT(house.address, address);
    } catch (err) {
      stepper.fail(err?.shortMessage || err?.message || t("errors.txFailed"));
      return;
    }

    stepper.advance();

    // Step 2: Attest membership (non-fatal)
    try {
      await attestHouse(house.numericId, address, fid);
    } catch (err) {
      stepper.fail(err?.shortMessage || err?.message || t("house.attestFailed"));
      return;
    }

    stepper.advance();
  }

  function handleRetry() {
    stepper.reset();
    handleBegin();
  }

  function handleSkip() {
    // Skip attestation (non-fatal) — complete the flow
    stepper.advance();
  }

  function handleDone() {
    onComplete(house.id);
    onOpenChange(false);
    stepper.reset();
  }

  function handleOpenChange(nextOpen) {
    if (stepper.isActive) return; // locked during transaction
    onOpenChange(nextOpen);
    if (!nextOpen) stepper.reset();
  }

  const isAttestError = stepper.steps[1]?.status === "error";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!stepper.isActive}
        onInteractOutside={(e) => stepper.isActive && e.preventDefault()}
        onEscapeKeyDown={(e) => stepper.isActive && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("stepper.joinTitle", { houseName })}</DialogTitle>
          <DialogDescription>
            {t("stepper.confirmWallet")}
          </DialogDescription>
        </DialogHeader>

        <TransactionStepper steps={stepper.steps} className="py-4" />

        <DialogFooter>
          {/* Initial state: Begin button */}
          {stepper.activeStep === -1 && !stepper.isComplete && (
            <div className="flex flex-col items-end gap-2">
              {fidRequired && (
                <p className="text-sm text-muted-foreground">
                  {t("stepper.fidRequired")}
                </p>
              )}
              <Button
                onClick={handleBegin}
                disabled={fidRequired}
                style={house ? { backgroundColor: house.colors.primary } : undefined}
              >
                {t("stepper.begin")}
              </Button>
            </div>
          )}

          {/* Error state */}
          {stepper.steps.some((s) => s.status === "error") && (
            <div className="flex gap-2">
              {isAttestError && (
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
