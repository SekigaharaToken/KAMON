/**
 * ScoreBreakdown — dialog showing 40/30/30 scoring formula.
 *
 * Props:
 *   dojoScore    — DOJO component (0-100)
 *   stakingScore — Staking component (0-100)
 *   onChatScore  — OnChat component (0-100, null if unavailable)
 */

import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress.jsx";

export function ScoreBreakdown({ dojoScore = 0, stakingScore = 0, onChatScore = null }) {
  const { t } = useTranslation();
  const isOnChatAvailable = onChatScore !== null;

  return (
    <div className="space-y-4">
      <h3 className="font-serif font-bold">{t("leaderboard.breakdown")}</h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>{t("leaderboard.dojoStreaks")}</span>
            <span className="font-mono">{dojoScore}</span>
          </div>
          <Progress value={dojoScore} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>{t("leaderboard.staking")}</span>
            <span className="font-mono">{stakingScore}</span>
          </div>
          <Progress value={stakingScore} />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>{t("leaderboard.onChat")}</span>
            <span className="font-mono">
              {isOnChatAvailable ? onChatScore : "N/A"}
            </span>
          </div>
          <Progress value={isOnChatAvailable ? onChatScore : 0} />
        </div>
      </div>
      {!isOnChatAvailable && (
        <p className="text-xs text-muted-foreground">
          OnChat unavailable. Using 40% DOJO + 60% Staking fallback.
        </p>
      )}
    </div>
  );
}
