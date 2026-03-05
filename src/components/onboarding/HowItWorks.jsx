import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Layers, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.jsx";
import { useLocalDismiss } from "@/hooks/useLocalDismiss.js";

const STORAGE_KEY = "kamon:how-it-works-dismissed";

const PAGES = [
  { icon: Shield, titleKey: "howItWorks.page1Title", descKey: "howItWorks.page1Desc" },
  { icon: Layers, titleKey: "howItWorks.page2Title", descKey: "howItWorks.page2Desc" },
  { icon: Trophy, titleKey: "howItWorks.page3Title", descKey: "howItWorks.page3Desc" },
];

export function HowItWorks() {
  const { t } = useTranslation();
  const [dismissed, dismiss] = useLocalDismiss(STORAGE_KEY);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [page, setPage] = useState(0);

  if (dismissed) return null;

  const current = PAGES[page];
  const Icon = current.icon;
  const isLast = page === PAGES.length - 1;

  return (
    <>
      {/* Dismissible bar above BottomNav */}
      <div
        data-slot="how-it-works-bar"
        className="fixed inset-x-0 bottom-16 z-40 flex items-center justify-between bg-primary px-4 py-2 text-primary-foreground"
      >
        <button
          className="flex-1 text-left text-sm font-medium"
          onClick={() => {
            setPage(0);
            setSheetOpen(true);
          }}
        >
          {t("howItWorks.barText")}
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-primary-foreground hover:bg-primary-foreground/20"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          aria-label="Dismiss how it works"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Bottom sheet with paginated content */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[80svh]" showCloseButton>
          <SheetHeader>
            <SheetTitle>{t("howItWorks.title")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("howItWorks.barText")}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col items-center gap-4 px-4 py-6 text-center">
            <Icon className="size-12 text-primary" />
            <h3 className="text-lg font-semibold">{t(current.titleKey)}</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-line">
              {t(current.descKey)}
            </p>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 pb-2">
            {PAGES.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full ${
                  i === page ? "w-6 bg-primary" : "w-2 bg-muted"
                } transition-all`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between px-4 pb-4">
            {page > 0 ? (
              <Button variant="ghost" onClick={() => setPage(page - 1)}>
                {t("howItWorks.back")}
              </Button>
            ) : (
              <div />
            )}
            {isLast ? (
              <Button onClick={() => setSheetOpen(false)}>
                {t("howItWorks.done")}
              </Button>
            ) : (
              <Button onClick={() => setPage(page + 1)}>
                {t("howItWorks.next")}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
