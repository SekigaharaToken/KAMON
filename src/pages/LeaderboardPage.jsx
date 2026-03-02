/**
 * LeaderboardPage — displays House rankings with scoring breakdown.
 * Computes scores client-side via useLeaderboard (15-min cached).
 */

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Leaderboard } from "@/components/leaderboard/Leaderboard.jsx";
import { useLeaderboard } from "@/hooks/useLeaderboard.js";
import { fadeInUp } from "@/lib/motion.js";

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const { rankings, isLoading, isError, lastUpdated } = useLeaderboard();

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
        <Leaderboard rankings={rankings} lastUpdated={lastUpdated} />
      </motion.div>
    </div>
  );
}
