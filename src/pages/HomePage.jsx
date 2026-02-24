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
import { burnHouseNFT, getSellPrice } from "@/hooks/useHouseNFT.js";
import { isLocalDev } from "@/config/chains.js";
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
  const { selectHouse } = useHouse();

  function handleJoin(houseId) {
    selectHouse(houseId);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <HouseCarousel onJoin={handleJoin} />
    </div>
  );
}

function PostSelection() {
  const { t } = useTranslation();
  const { houseConfig, selectHouse } = useHouse();
  const { address } = useAccount();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [abdicating, setAbdicating] = useState(false);
  const [refund, setRefund] = useState(null);

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
        // Skip NFT burn in local dev — just clear state
        selectHouse(null);
        toast.success(t("house.abdicateSuccess"));
        setDialogOpen(false);
        return;
      }
      await burnHouseNFT(houseConfig.address, address);
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
      <motion.div
        className="flex items-center gap-3"
        {...fadeInUp}
        transition={{ ...fadeInUp.transition, ...staggerDelay(3) }}
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
