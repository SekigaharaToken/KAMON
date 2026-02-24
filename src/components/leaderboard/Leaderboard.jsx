/**
 * Leaderboard — main leaderboard section showing 5 Houses ranked.
 *
 * Props:
 *   rankings    — array of { house, memberCount, score } sorted by rank
 *   lastUpdated — timestamp of last computation
 *   (isComputing and onRefresh reserved for future use)
 */

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { HOUSE_LIST, HOUSES } from "@/config/houses.js";
import { HouseRanking } from "./HouseRanking.jsx";
import { fadeInUp, staggerDelay } from "@/lib/motion.js";

export function Leaderboard({
  rankings = [],
  lastUpdated = null,
}) {
  const { t } = useTranslation();

  // Default to HOUSE_LIST if no rankings provided
  const displayRankings =
    rankings.length > 0
      ? rankings
      : HOUSE_LIST.map((h) => ({ house: h, memberCount: 0, score: 0 }));

  // eslint-disable-next-line react-hooks/purity -- intentional: display relative time
  const minutesAgo = lastUpdated ? Math.round((Date.now() - lastUpdated) / 60000) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold">
          {t("leaderboard.title")}
        </h2>
        {minutesAgo != null && (
          <span className="text-xs text-muted-foreground">
            Updated {minutesAgo}m ago
          </span>
        )}
      </div>

      <div className="space-y-2">
        {displayRankings.map((entry, index) => (
          <motion.div
            key={entry.house?.id ?? index}
            {...fadeInUp}
            transition={{
              ...fadeInUp.transition,
              ...staggerDelay(index),
            }}
          >
            <HouseRanking
              rank={index + 1}
              house={entry.house}
              memberCount={entry.memberCount}
              score={entry.score}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
