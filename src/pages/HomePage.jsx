/**
 * HomePage — KAMON hub.
 *
 * Pre-selection: Full-screen carousel experience ("Choose Your House").
 * Post-selection: Dashboard with House info, staking overview, leaderboard preview.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useHouse } from "@/hooks/useHouse.js";
import { burnHouseNFT, getHouseBalance, getSellPrice, mintHouseNFT } from "@/hooks/useHouseNFT.js";
import { attestHouse, revokeHouse, retryAttest, getAttestedHouse } from "@/hooks/useHouseMembership.js";
import { isLocalDev } from "@/config/chains.js";
import { HOUSES } from "@/config/houses.js";
import { useLoginModal } from "@/hooks/useLoginModal.js";
import { HouseCarousel } from "@/components/house/HouseCarousel.jsx";
import { BackSekiLink } from "@/components/layout/BackSekiLink.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.jsx";
import { fadeInUp, staggerDelay } from "@/lib/motion.js";

function PreSelection() {
  const { t } = useTranslation();
  const { selectHouse } = useHouse();
  const { address, isConnected } = useAccount();
  const { openLoginModal } = useLoginModal();
  const [joining, setJoining] = useState(false);

  async function handleJoin(houseId) {
    if (!isConnected) {
      openLoginModal();
      return;
    }

    const house = HOUSES[houseId];
    if (!house?.address) return;

    setJoining(true);
    try {
      if (isLocalDev) {
        selectHouse(houseId);
        toast.success(t("house.joinSuccess"));
        return;
      }
      // Step 1: Mint NFT (wallet popup #1)
      await mintHouseNFT(house.address, address);

      // Step 2: Attest membership (wallet popup #2)
      try {
        toast.loading(t("house.attesting"), { id: "attest" });
        await attestHouse(house.numericId, address);
        toast.dismiss("attest");
      } catch {
        toast.dismiss("attest");
        toast.warning(t("house.attestFailed"));
        // NFT minted but attest failed — user can retry from dashboard
      }

      // Step 3: Update UI state
      selectHouse(houseId);
      toast.success(t("house.joinSuccess"));
    } catch {
      toast.error(t("house.joinFailed"));
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <HouseCarousel onJoin={handleJoin} joining={joining} />
    </div>
  );
}

function PostSelection() {
  const { t } = useTranslation();
  const { houseConfig, selectHouse } = useHouse();
  const { address } = useAccount();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [abdicating, setAbdicating] = useState(false);
  const [attesting, setAttesting] = useState(false);
  const [needsAttest, setNeedsAttest] = useState(false);
  const [refund, setRefund] = useState(null);

  // Check if user needs attestation (has house but no on-chain record)
  useState(() => {
    if (isLocalDev || !houseConfig || !address) return;
    getAttestedHouse(address).then((attested) => {
      if (attested === 0) setNeedsAttest(true);
    });
  });

  async function handleRetryAttest() {
    if (!houseConfig?.numericId || !address) return;
    setAttesting(true);
    try {
      toast.loading(t("house.attesting"), { id: "attest" });
      await retryAttest(houseConfig.numericId, address);
      toast.dismiss("attest");
      toast.success(t("house.joinSuccess"));
      setNeedsAttest(false);
    } catch {
      toast.dismiss("attest");
      toast.error(t("house.attestFailed"));
    } finally {
      setAttesting(false);
    }
  }

  async function handleOpenDialog() {
    if (isLocalDev) {
      setRefund("0");
    } else {
      try {
        const price = await getSellPrice(houseConfig.address);
        setRefund(price != null ? formatUnits(price, 18) : "?");
      } catch {
        setRefund("?");
      }
    }
    setDialogOpen(true);
  }

  async function handleAbdicate() {
    setAbdicating(true);
    try {
      if (isLocalDev) {
        selectHouse(null);
        toast.success(t("house.abdicateSuccess"));
        setDialogOpen(false);
        return;
      }

      // Check NFT balance first — if 0, just clear frontend state
      const balance = await getHouseBalance(houseConfig.address, address);
      if (balance === 0n) {
        selectHouse(null);
        toast.success(t("house.abdicateSuccess"));
        setDialogOpen(false);
        return;
      }

      // Step 1: Burn NFT (wallet popup #1)
      await burnHouseNFT(houseConfig.address, address);

      // Step 2: Revoke attestation (wallet popup #2)
      try {
        toast.loading(t("house.revoking"), { id: "revoke" });
        await revokeHouse(address);
        toast.dismiss("revoke");
      } catch {
        toast.dismiss("revoke");
        toast.warning(t("house.revokeFailed"));
        // Stale attestation is harmless — NFT balance is 0
      }

      // Step 3: Clear UI state
      selectHouse(null);
      toast.success(t("house.abdicateSuccess"));
      setDialogOpen(false);
    } catch {
      toast.error(t("house.abdicateFailed"));
    } finally {
      setAbdicating(false);
    }
  }

  const houseName = t(houseConfig.nameKey);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <motion.h1 className="font-serif text-3xl font-bold" {...fadeInUp}>
        {houseName}
      </motion.h1>
      <motion.p
        className="text-muted-foreground text-center"
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, ...staggerDelay(1) }}
      >
        {t(houseConfig.descriptionKey)}
      </motion.p>
      <motion.p
        className="text-sm text-muted-foreground"
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, ...staggerDelay(2) }}
      >
        {t("house.myHouse")}
      </motion.p>
      {needsAttest && (
        <motion.div
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, ...staggerDelay(3) }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryAttest}
            disabled={attesting}
          >
            {attesting ? t("house.attesting") : t("house.retryAttest")}
          </Button>
        </motion.div>
      )}
      <motion.div
        className="flex items-center gap-3"
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, ...staggerDelay(needsAttest ? 4 : 3) }}
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" onClick={handleOpenDialog}>
              {t("house.abdicate")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("house.abdicateConfirm", { houseName })}
              </DialogTitle>
              <DialogDescription>
                {t("house.abdicateDescription", { refund: refund ?? "..." })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={abdicating}
              >
                {t("auth.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleAbdicate}
                disabled={abdicating}
              >
                {abdicating ? t("house.abdicating") : t("house.abdicate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <BackSekiLink />
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const { selectedHouse } = useHouse();

  return selectedHouse ? <PostSelection /> : <PreSelection />;
}
