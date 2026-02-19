/**
 * StakingMeter — visual display of user's staking position.
 *
 * Props:
 *   staked          — amount staked string
 *   pendingRewards  — pending $DOJO rewards string
 */

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";

export function StakingMeter({ staked = "0", pendingRewards = "0" }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activity.stakeSize")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-bold">{staked}</span>
          <span className="text-muted-foreground text-sm">$SEKI</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("staking.claimable")}: {pendingRewards} $DOJO
        </p>
      </CardContent>
    </Card>
  );
}
