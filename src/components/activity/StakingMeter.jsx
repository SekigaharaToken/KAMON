/**
 * StakingMeter — visual display of user's staking position.
 *
 * Props:
 *   staked          — amount staked string
 *   pendingRewards  — pending $DOJO rewards string
 */

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";

export function StakingMeter({ staked = "0", pendingRewards = "0" }) {
  const { t } = useTranslation();
  const hasClaimable = parseFloat(pendingRewards) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activity.stakeSize")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-bold">{staked}</span>
          <span className="text-muted-foreground text-sm">$SEKI</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">
            {t("staking.claimable")}:
          </span>
          <span className="font-mono text-sm font-medium">{pendingRewards}</span>
          <span className="text-sm text-muted-foreground">$DOJO</span>
        </div>
        {hasClaimable && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/staking">{t("staking.claim")}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
