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
import { useQueries, useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { toast } from "sonner";
import { useHouse } from "@/hooks/useHouse.js";
import { useFarcaster } from "@/hooks/useFarcaster.js";
import { useMembershipStatus } from "@/hooks/useMembershipStatus.js";
import { getIsMultiHouseHolder } from "@/hooks/useHouseMembership.js";
import { getBuyPrice, getHouseSupply } from "@/hooks/useHouseNFT.js";
import { isLocalDev } from "@/config/chains.js";
import { HOUSES, HOUSE_LIST } from "@/config/houses.js";
import { useMintClubReady } from "@/lib/mintclub.js";
import { HouseCarousel } from "@/components/house/HouseCarousel.jsx";
import { JoinStepper } from "@/components/house/JoinStepper.jsx";
import { AbdicateStepper } from "@/components/house/AbdicateStepper.jsx";
import { RepairStepper } from "@/components/house/RepairStepper.jsx";
import { BackSekiLink } from "@/components/layout/BackSekiLink.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";
import { fadeInUp, staggerDelay } from "@/lib/motion.js";

/**
 * Fetch supply and price for all 5 houses via useQueries.
 * Returns { supplies, prices } objects keyed by house id.
 * Falls back to empty objects when mintclub SDK is unavailable (local dev).
 */
function useHouseCarouselData() {
  const sdkAvailable = useMintClubReady();

  const supplyQueries = useQueries({
    queries: HOUSE_LIST.map((house) => ({
      queryKey: ["houseSupply", house.id],
      queryFn: () => getHouseSupply(house.address),
      enabled: sdkAvailable && !!house.address,
      staleTime: 30_000,
    })),
  });

  const priceQueries = useQueries({
    queries: HOUSE_LIST.map((house) => ({
      queryKey: ["housePrice", house.id],
      queryFn: () => getBuyPrice(house.address),
      enabled: sdkAvailable && !!house.address,
      staleTime: 30_000,
    })),
  });

  if (!sdkAvailable) {
    return { supplies: {}, prices: {} };
  }

  const supplies = {};
  const prices = {};

  HOUSE_LIST.forEach((house, index) => {
    const supplyData = supplyQueries[index]?.data;
    const priceData = priceQueries[index]?.data;

    if (supplyData != null) {
      supplies[house.id] = supplyData.toString();
    }

    if (priceData != null) {
      prices[house.id] = formatUnits(priceData, 18);
    }
  });

  return { supplies, prices };
}

function PreSelection() {
  const { t } = useTranslation();
  const { selectHouse } = useHouse();
  const { isConnected } = useAccount();
  const { profile } = useFarcaster();
  const fid = profile?.fid;
  const [joinDialog, setJoinDialog] = useState({ open: false, house: null });

  const { supplies, prices } = useHouseCarouselData();

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
      <HouseCarousel supplies={supplies} prices={prices} onJoin={handleJoin} />
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
  const [switchMode, setSwitchMode] = useState(false);
  const [repairDismissed, setRepairDismissed] = useState(false);

  // Check if user holds NFTs in multiple houses
  const { data: isMultiHouseHolder } = useQuery({
    queryKey: ["multiHouseHolder", address],
    queryFn: () => getIsMultiHouseHolder(address),
    enabled: !isLocalDev && !!address,
    staleTime: 30_000,
  });

  // Check membership integrity (NFT + attestation)
  const membership = useMembershipStatus();

  // Show repair dialog when membership is incomplete and user hasn't dismissed
  const showRepair = !membership.isLoading && !membership.isComplete &&
    (membership.needsNFT || membership.needsAttestation);
  const repairOpen = showRepair && !repairDismissed && !abdicateOpen;

  function handleSwitchHouse() {
    setSwitchMode(true);
    setAbdicateOpen(true);
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
      {isMultiHouseHolder && (
        <motion.div
          className="w-full max-w-sm"
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, ...staggerDelay(3) }}
        >
          <Alert>
            <AlertDescription>{t("house.multiHouseWarning")}</AlertDescription>
          </Alert>
        </motion.div>
      )}
      <motion.div
        className="flex items-center gap-3"
        {...fadeInUp}
        transition={{
          ...fadeInUp.transition,
          ...staggerDelay((isMultiHouseHolder ? 1 : 0) + 3),
        }}
      >
        <Button variant="destructive" size="sm" onClick={() => setAbdicateOpen(true)}>
          {t("house.abdicate")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleSwitchHouse}>
          {t("house.switchHouse")}
        </Button>
        <BackSekiLink />
      </motion.div>
      <AbdicateStepper
        houseConfig={houseConfig}
        open={abdicateOpen}
        onOpenChange={(open) => {
          setAbdicateOpen(open);
          if (!open) setSwitchMode(false);
        }}
        onComplete={() => {
          if (switchMode) {
            selectHouse(null);
          } else {
            selectHouse(null);
            toast.success(t("house.abdicateSuccess"));
          }
          setSwitchMode(false);
        }}
      />
      {showRepair && (
        <RepairStepper
          houseConfig={houseConfig}
          needsNFT={membership.needsNFT}
          needsAttestation={membership.needsAttestation}
          open={repairOpen}
          onOpenChange={(open) => { if (!open) setRepairDismissed(true); }}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  const { selectedHouse } = useHouse();

  return selectedHouse ? <PostSelection /> : <PreSelection />;
}
