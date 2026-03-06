/**
 * OnChatCount — display OnChat message count and contribution.
 *
 * Props:
 *   messageCount — user's messages this season (null if unavailable)
 *   percentage   — normalized percentage (0-100, null if unavailable)
 *   isLoading    — true while OnChat queries are in flight
 */

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";

export function OnChatCount({ messageCount = null, percentage = null, isLoading = false }) {
  const { t } = useTranslation();
  const isAvailable = messageCount !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("activity.onChatMessages")}
          {!isLoading && !isAvailable && (
            <Badge variant="secondary">{t("activity.onChatUnavailable")}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && !isAvailable ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : isAvailable ? (
          <div className="space-y-1">
            <span className="font-mono text-4xl font-bold">{messageCount}</span>
            <p className="text-sm text-muted-foreground">
              {t("activity.contribution")}: {percentage}%
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("activity.onChatFallback")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
