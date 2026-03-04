/**
 * RepairStepper — dialog to complete incomplete house membership on reload.
 *
 * Shows only the missing step(s):
 * - needsAttestation only: single-step attestation
 * - needsNFT only: single-step NFT buy
 * - both missing: full 2-step flow (same as JoinStepper)
 */

import { useTranslation } from "react-i18next";
import { useAccount, useWalletClient } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useTransactionStepper } from "@/hooks/useTransactionStepper.js";
import { mintHouseNFT } from "@/hooks/useHouseNFT.js";
import { attestHouse } from "@/hooks/useHouseMembership.js";
import { useFarcaster } from "@/hooks/useFarcaster.js";
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

export function RepairStepper({ houseConfig, needsNFT, needsAttestation, open, onOpenChange }) {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { profile } = useFarcaster();
  const fid = profile?.fid;
  const queryClient = useQueryClient();

  // Build steps dynamically based on what's missing
  const stepDefs = [];
  if (needsNFT) {
    stepDefs.push({ key: "nft", label: t("stepper.mintNFT"), description: t("stepper.mintNFTDesc") });
  }
  if (needsAttestation || needsNFT) {
    stepDefs.push({ key: "attest", label: t("stepper.registerMembership"), description: t("stepper.registerDesc") });
  }

  const stepper = useTransactionStepper(stepDefs);

  async function runNFT() {
    try {
      await mintHouseNFT(houseConfig.address, address, walletClient);
    } catch (err) {
      stepper.fail(err?.shortMessage || err?.message || t("errors.txFailed"));
      return false;
    }
    stepper.advance();
    return true;
  }

  async function runAttest() {
    try {
      await attestHouse(houseConfig.numericId, address, fid, walletClient);
    } catch (err) {
      stepper.fail(err?.shortMessage || err?.message || t("house.attestFailed"));
      return false;
    }
    stepper.advance();
    return true;
  }

  async function handleBegin() {
    stepper.start();
    if (needsNFT) {
      if (!(await runNFT())) return;
    }
    await runAttest();
  }

  async function handleRetry() {
    const failedIdx = stepper.steps.findIndex((s) => s.status === "error");
    const failedKey = stepDefs[failedIdx]?.key;
    stepper.retry();

    if (failedKey === "nft") {
      if (!(await runNFT())) return;
      await runAttest();
    } else {
      await runAttest();
    }
  }

  function handleSkip() {
    stepper.advance();
  }

  function handleDone() {
    queryClient.invalidateQueries({ queryKey: ["membershipNFT"] });
    queryClient.invalidateQueries({ queryKey: ["membershipAttest"] });
    onOpenChange(false);
    stepper.reset();
  }

  function handleOpenChange(nextOpen) {
    if (stepper.isActive) return;
    onOpenChange(nextOpen);
    if (!nextOpen) stepper.reset();
  }

  const isAttestError = stepper.steps[stepper.steps.length - 1]?.status === "error";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!stepper.isActive}
        onInteractOutside={(e) => stepper.isActive && e.preventDefault()}
        onEscapeKeyDown={(e) => stepper.isActive && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("stepper.repairTitle")}</DialogTitle>
          <DialogDescription>{t("stepper.repairDesc")}</DialogDescription>
        </DialogHeader>

        <TransactionStepper steps={stepper.steps} className="py-4" />

        <DialogFooter>
          {stepper.activeStep === -1 && !stepper.isComplete && (
            <Button onClick={handleBegin} disabled={!walletClient}>
              {t("stepper.begin")}
            </Button>
          )}

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

          {stepper.isComplete && (
            <Button onClick={handleDone}>{t("stepper.done")}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
