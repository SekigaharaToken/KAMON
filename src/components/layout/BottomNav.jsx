import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const gridCols = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export const BottomNav = ({ items }) => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
      <div
        className={cn("mx-auto grid max-w-3xl", gridCols[items.length])}
      >
        {items.map(({ to, icon: Icon, labelKey }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs transition-colors",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
