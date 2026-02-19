/**
 * AdminPanel — season management dashboard (operator-only).
 *
 * Props:
 *   isOperator — whether current wallet is an operator
 *   seasonStatus — current season status string
 *   weekNumber   — current week number
 */

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";

export function AdminPanel({ isOperator = false, seasonStatus = "active", weekNumber = 1 }) {
  const { t } = useTranslation();

  if (!isOperator) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{t("admin.operatorOnly")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("admin.title")}
          <Badge>{t(`season.${seasonStatus}`)}</Badge>
          <Badge variant="secondary">{t("season.week", { week: weekNumber })}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SeasonSnapshot and AirdropTrigger will be rendered here */}
      </CardContent>
    </Card>
  );
}
