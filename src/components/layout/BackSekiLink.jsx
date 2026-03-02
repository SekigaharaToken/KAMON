import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { MiniAppLink } from "@/components/ui/miniapp-link.jsx";

const HUNT_TOWN_URL = "https://hunt.town/project/SEKI";

export function BackSekiLink() {
  const { t } = useTranslation();

  return (
    <Button variant="secondary" size="sm" asChild>
      <MiniAppLink href={HUNT_TOWN_URL}>
        {t("hunt.backSeki")}
        <ExternalLink className="size-3.5" />
      </MiniAppLink>
    </Button>
  );
}
