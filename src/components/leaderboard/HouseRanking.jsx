/**
 * HouseRanking — single House row in the leaderboard.
 *
 * Props:
 *   rank       — 1-5
 *   house      — House config object
 *   memberCount — number of members
 *   score      — total House score
 */

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge.jsx";

const RANK_STYLES = {
  1: "text-yellow-500 font-bold",
  2: "text-gray-400 font-semibold",
  3: "text-amber-700 font-semibold",
};

export function HouseRanking({ rank, house, memberCount = 0, score = 0 }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <span className={`font-mono text-2xl w-8 ${RANK_STYLES[rank] ?? ""}`}>
        {rank}
      </span>
      <span className="text-2xl">{house.symbol}</span>
      <div className="flex-1">
        <p className="font-serif font-bold">{t(house.nameKey)}</p>
        <p className="text-sm text-muted-foreground">
          {t("leaderboard.members")}: {memberCount}
        </p>
      </div>
      <Badge
        style={{ backgroundColor: house.colors.primary, color: "white" }}
      >
        {Math.round(score)}
      </Badge>
    </div>
  );
}
