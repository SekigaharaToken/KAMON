/**
 * AirdropTrigger — executes reward airdrop to winning House members.
 *
 * Props:
 *   winnerMembers — array of { address, reward } for winning House
 *   onTrigger     — callback to execute airdrop
 *   isLoading     — whether airdrop is in progress
 *   txHash        — transaction hash if completed
 */

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";

export function AirdropTrigger({
  winnerMembers = [],
  onTrigger,
  isLoading = false,
  txHash = null,
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.airdrop")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {winnerMembers.length} recipients
        </p>
        {txHash ? (
          <p className="font-mono text-xs break-all text-green-600">
            tx: {txHash}
          </p>
        ) : (
          <Button
            onClick={onTrigger}
            disabled={isLoading || winnerMembers.length === 0}
            variant="destructive"
          >
            {isLoading ? "Processing..." : "Execute Airdrop"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
