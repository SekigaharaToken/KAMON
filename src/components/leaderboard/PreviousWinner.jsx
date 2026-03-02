/**
 * PreviousWinner — displays the winning House from the previous season.
 *
 * Props:
 *   winner — { houseId, score, memberCount } or null/undefined
 *
 * Renders nothing when winner is absent or houseId is unrecognised.
 */

import { useTranslation } from "react-i18next";
import { HOUSES } from "@/config/houses.js";
import { Card, CardContent } from "@/components/ui/card.jsx";

export function PreviousWinner({ winner }) {
  const { t } = useTranslation();

  if (!winner) return null;

  const house = HOUSES[winner.houseId];
  if (!house) return null;

  return (
    <Card
      className="border"
      style={{ borderColor: house.colors.primary }}
      aria-label={t("leaderboard.previousWinner")}
    >
      <CardContent className="py-4 px-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          {t("leaderboard.previousWinner")}
        </p>

        <div className="flex items-center gap-4">
          {/* House symbol */}
          <span
            className="text-3xl font-serif leading-none"
            style={{ color: house.colors.primary }}
            aria-hidden="true"
          >
            {house.symbol}
          </span>

          {/* House name + stats */}
          <div className="flex-1 min-w-0">
            <p className="font-serif font-bold text-lg leading-tight">
              {t(house.nameKey)}
            </p>
            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
              <span>
                {t("leaderboard.score")}{": "}
                <span className="font-semibold tabular-nums text-foreground">
                  {Math.round(winner.score)}
                </span>
              </span>
              <span>
                {t("house.members", { count: winner.memberCount })}
              </span>
            </div>
          </div>

          {/* Score badge */}
          <div
            className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
            style={{
              backgroundColor: house.colors.primary,
              color: "#fff",
            }}
            aria-label={`Score ${Math.round(winner.score)}`}
          >
            {Math.round(winner.score)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
