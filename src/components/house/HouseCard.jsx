/**
 * HouseCard — Individual House card displaying info and join action.
 *
 * Props:
 *   house    — House config object from houses.js
 *   supply   — Current NFT supply count
 *   price    — Current mint price string
 *   onJoin   — Callback when join button clicked, receives house.id
 *   isActive — Whether this card is the active carousel slide
 */

import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Progress } from "@/components/ui/progress.jsx";
import { HOUSE_MAX_SUPPLY } from "@/config/houses.js";
import { tapSpring } from "@/lib/motion.js";

export function HouseCard({ house, supply, price, onJoin, joining = false, isActive = false }) {
  const { t } = useTranslation();

  return (
    <Card
      className="relative overflow-hidden transition-shadow"
      style={
        isActive
          ? { boxShadow: `0 0 24px 4px ${house.colors.primary}40` }
          : undefined
      }
    >
      <CardHeader className="items-center text-center">
        <span className="text-5xl leading-none">{house.symbol}</span>
        <h3 className="font-serif text-xl font-bold mt-2">
          {t(house.nameKey)}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t(house.descriptionKey)}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("house.members", { count: supply })}
          </span>
          <span className="text-muted-foreground">{t("house.cap")}</span>
        </div>
        <Progress value={(supply / HOUSE_MAX_SUPPLY) * 100} />

        <div className="flex items-center justify-between text-sm pt-2">
          <span className="text-muted-foreground">{t("house.price")}</span>
          <span className="font-mono font-medium">{price} $SEKI</span>
        </div>
      </CardContent>

      <CardFooter className="justify-center">
        <motion.div {...tapSpring} className="w-full">
          <Button
            className="w-full"
            style={{ backgroundColor: house.colors.primary }}
            onClick={() => onJoin(house.id)}
            disabled={joining}
          >
            {joining ? t("house.joining") : t("house.join", { houseName: house.id })}
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
  );
}
