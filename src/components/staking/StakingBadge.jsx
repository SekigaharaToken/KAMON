/**
 * StakingBadge — visual progress indicator for the Staking Badge NFT.
 *
 * Shows how many weeks the user has been staking toward the 4-week
 * threshold. Displays a gold badge and celebration text when earned.
 *
 * Props:
 *   weeks     — number of full weeks staked so far
 *   threshold — required weeks (from STAKING_BADGE_WEEKS config)
 *   earned    — whether the badge has been earned
 *   progress  — 0–1 fraction (Math.min(1, weeks / threshold))
 */

import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card.jsx";

export function StakingBadge({ weeks = 0, threshold = 4, earned = false, progress = 0 }) {
  const { t } = useTranslation();

  return (
    <Card className={earned ? "badge-earned border-yellow-500" : ""}>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl ${earned ? "text-yellow-500" : "text-muted-foreground"}`}
            aria-hidden="true"
          >
            {earned ? "★" : "☆"}
          </span>
          <div className="flex-1">
            {earned ? (
              <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                {t("staking.badgeEarned")}
              </p>
            ) : (
              <p className="text-sm font-medium">
                {t("staking.badgeProgress", { weeks, threshold })}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("staking.badgeDescription", { threshold })}
            </p>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={weeks}
          aria-valuemin={0}
          aria-valuemax={threshold}
          aria-label={t("staking.badgeProgress", { weeks, threshold })}
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              earned ? "bg-yellow-500" : "bg-primary"
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
