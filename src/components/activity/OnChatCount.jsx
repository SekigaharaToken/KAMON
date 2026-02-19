/**
 * OnChatCount — display OnChat message count and contribution.
 *
 * Props:
 *   messageCount — user's messages this season (null if unavailable)
 *   percentage   — normalized percentage (0-100, null if unavailable)
 */

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";

export function OnChatCount({ messageCount = null, percentage = null }) {
  const { t } = useTranslation();
  const isAvailable = messageCount !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("activity.onChatMessages")}
          {!isAvailable && (
            <Badge variant="secondary">Unavailable</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAvailable ? (
          <div className="space-y-1">
            <span className="font-mono text-4xl font-bold">{messageCount}</span>
            <p className="text-sm text-muted-foreground">
              {t("activity.contribution")}: {percentage}%
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            OnChat data is currently unavailable. Scoring uses DOJO + Staking fallback.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
