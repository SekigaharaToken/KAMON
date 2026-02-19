/**
 * HomePage — KAMON hub.
 *
 * Pre-selection: Full-screen carousel experience ("Choose Your House").
 * Post-selection: Dashboard with House info, staking overview, leaderboard preview.
 */

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { useHouse } from "@/hooks/useHouse.js";
import { HouseCarousel } from "@/components/house/HouseCarousel.jsx";
import { BackSekiLink } from "@/components/layout/BackSekiLink.jsx";
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
  const { houseConfig } = useHouse();

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <motion.h1 className="font-serif text-3xl font-bold" {...fadeInUp}>
        {t(houseConfig.nameKey)}
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
      <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, ...staggerDelay(3) }}>
        <BackSekiLink />
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const { selectedHouse } = useHouse();

  return selectedHouse ? <PostSelection /> : <PreSelection />;
}
