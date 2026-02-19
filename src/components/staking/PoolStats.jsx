/**
 * PoolStats — displays staking pool overview stats.
 *
 * Props:
 *   totalStaked  — total $SEKI staked in pool
 *   seasonEnd    — formatted countdown string
 *   poolSize     — total reward pool ($DOJO)
 */

import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card.jsx";

export function PoolStats({ totalStaked = "—", seasonEnd = "—", poolSize = "—" }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">{t("staking.totalStaked")}</p>
          <p className="font-mono text-lg font-bold">{totalStaked}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("staking.seasonEnd")}</p>
          <p className="font-mono text-lg font-bold">{seasonEnd}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{t("staking.poolSize")}</p>
          <p className="font-mono text-lg font-bold">{poolSize}</p>
        </div>
      </CardContent>
    </Card>
  );
}
