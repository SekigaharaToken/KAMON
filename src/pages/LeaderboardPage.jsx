/**
 * LeaderboardPage — displays House rankings with scoring breakdown.
 * Computes scores client-side via useLeaderboard (15-min cached).
 *
 * Also displays the previous season winner above the current rankings,
 * and saves the current #1 as the next previous winner whenever
 * rankings are available (so the data is ready for the next season).
 */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Leaderboard } from "@/components/leaderboard/Leaderboard.jsx";
import { PreviousWinner } from "@/components/leaderboard/PreviousWinner.jsx";
import { useLeaderboard } from "@/hooks/useLeaderboard.js";
import { getPreviousWinner, savePreviousWinner } from "@/lib/seasonHistory.js";
import { fadeInUp } from "@/lib/motion.js";

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { rankings, isLoading, isError, lastUpdated } = useLeaderboard();

  // Read previous winner from localStorage on every render (synchronous)
  const previousWinnerData = getPreviousWinner();
  const previousWinner = previousWinnerData?.winner ?? null;

  // When rankings are available, persist the current #1 for the next season
  useEffect(() => {
    if (!rankings || rankings.length === 0) return;
    const top = rankings[0];
    if (!top?.house?.id) return;
    savePreviousWinner(
      // Use a placeholder seasonId of 0 — the actual season ID wiring
      // can be added when a useSeason hook exposes a numeric seasonId.
      0,
      {
        houseId: top.house.id,
        score: top.score ?? 0,
        memberCount: top.memberCount ?? 0,
      },
    );
  }, [rankings]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <motion.div {...fadeInUp}>
          <div className="space-y-4">
            <div className="h-7 w-40 bg-muted animate-pulse rounded" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <motion.div {...fadeInUp}>
          <p className="text-destructive text-sm">
            {t("leaderboard.errorLoading", "Failed to load leaderboard. Please try again.")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <PreviousWinner winner={previousWinner} />
      </motion.div>
      <motion.div {...fadeInUp}>
        <Leaderboard rankings={rankings} lastUpdated={lastUpdated} />
      </motion.div>
    </div>
  );
}
