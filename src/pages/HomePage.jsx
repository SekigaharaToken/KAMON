/**
 * HomePage — KAMON hub.
 *
 * Pre-selection: Full-screen carousel experience ("Choose Your House").
 * Post-selection: Dashboard with House info, staking overview, leaderboard preview.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useHouse } from "@/hooks/useHouse.js";
import { useFarcaster } from "@/hooks/useFarcaster.js";
import { retryAttest, getAttestedHouse } from "@/hooks/useHouseMembership.js";
import { isLocalDev } from "@/config/chains.js";
import { HOUSES } from "@/config/houses.js";
import { HouseCarousel } from "@/components/house/HouseCarousel.jsx";
import { JoinStepper } from "@/components/house/JoinStepper.jsx";
import { AbdicateStepper } from "@/components/house/AbdicateStepper.jsx";
import { BackSekiLink } from "@/components/layout/BackSekiLink.jsx";
import { Button } from "@/components/ui/button.jsx";
import { fadeInUp, staggerDelay } from "@/lib/motion.js";

function PreSelection() {
  const { t } = useTranslation();
  const { selectHouse } = useHouse();
  const { isConnected } = useAccount();
  const { profile } = useFarcaster();
  const fid = profile?.fid;
  const [joinDialog, setJoinDialog] = useState({ open: false, house: null });

  function handleJoin(houseId) {
    const house = HOUSES[houseId];
    if (!house) return;

    // On local dev or when addresses aren't configured, just select immediately
    if (isLocalDev || !house.address) {
      selectHouse(houseId);
      return;
    }

    // Require wallet for on-chain mint
    if (!isConnected) {
      toast.error(t("errors.walletNotConnected"));
      return;
    }

    // Require Farcaster sign-in for FID-gated attestation
    if (!fid) {
      toast.error(t("stepper.fidRequired"));
      return;
    }

    setJoinDialog({ open: true, house });
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <HouseCarousel onJoin={handleJoin} />
      {joinDialog.house && (
        <JoinStepper
          house={joinDialog.house}
          open={joinDialog.open}
          onOpenChange={(open) => setJoinDialog((prev) => ({ ...prev, open }))}
          onComplete={(id) => {
            selectHouse(id);
            setJoinDialog({ open: false, house: null });
          }}
        />
      )}
    </div>
  );
}

function PostSelection() {
  const { t } = useTranslation();
  const { houseConfig, selectHouse } = useHouse();
  const { address } = useAccount();
  const [abdicateOpen, setAbdicateOpen] = useState(false);
  const [attesting, setAttesting] = useState(false);
  const [needsAttest, setNeedsAttest] = useState(false);

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
        <Button variant="destructive" size="sm" onClick={() => setAbdicateOpen(true)}>
          {t("house.abdicate")}
        </Button>
        <BackSekiLink />
      </motion.div>
      <AbdicateStepper
        houseConfig={houseConfig}
        open={abdicateOpen}
        onOpenChange={setAbdicateOpen}
        onComplete={() => {
          selectHouse(null);
          toast.success(t("house.abdicateSuccess"));
        }}
      />
    </div>
  );
}

export default function HomePage() {
  const { selectedHouse } = useHouse();

  return selectedHouse ? <PostSelection /> : <PreSelection />;
}
