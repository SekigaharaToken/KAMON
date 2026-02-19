/**
 * StreakMeter — visual display of DOJO check-in streak.
 *
 * Props:
 *   currentStreak — current consecutive days
 *   longestStreak — all-time longest streak
 *   isAtRisk      — whether streak is about to break (>23h since last check-in)
 */

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";

export function StreakMeter({
  currentStreak = 0,
  longestStreak = 0,
  isAtRisk = false,
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("activity.dojoStreak")}
          {isAtRisk && (
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Badge variant="destructive">At Risk</Badge>
            </motion.div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-bold">{currentStreak}</span>
          <span className="text-muted-foreground text-sm">days</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Longest: {longestStreak} days
        </p>
        <Button variant="outline" className="w-full" asChild>
          <a
            href="https://dojo.sekigahara.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            Check In on DOJO
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
