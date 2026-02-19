/**
 * LeaderboardPage — displays House rankings with scoring breakdown.
 */

import { motion } from "motion/react";
import { Leaderboard } from "@/components/leaderboard/Leaderboard.jsx";
import { fadeInUp } from "@/lib/motion.js";

export default function LeaderboardPage() {
  // TODO: Wire to useLeaderboard hook for cached rankings

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <Leaderboard />
      </motion.div>
    </div>
  );
}
