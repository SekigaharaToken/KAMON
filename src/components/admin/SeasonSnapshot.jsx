/**
 * SeasonSnapshot — generates final leaderboard snapshot for season end.
 *
 * Props:
 *   rankings  — final leaderboard rankings
 *   onConfirm — callback to confirm snapshot
 *   isLoading — whether snapshot is being generated
 */

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";

export function SeasonSnapshot({ rankings = [], onConfirm, isLoading = false }) {
  const { t } = useTranslation();
  const winner = rankings[0] ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.snapshot")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {winner ? (
          <div>
            <p className="text-sm text-muted-foreground">Winner:</p>
            <p className="font-serif text-xl font-bold">
              {winner.house?.symbol} {winner.house?.id}
            </p>
            <p className="text-sm text-muted-foreground">
              Members: {winner.memberCount} | Score: {Math.round(winner.score)}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">No rankings available.</p>
        )}
        <Button onClick={onConfirm} disabled={isLoading || !winner}>
          {isLoading ? "Generating..." : "Confirm Snapshot"}
        </Button>
      </CardContent>
    </Card>
  );
}
