/**
 * OnChatWidget — embedded OnChat chat interface.
 * Loads the OnChat widget script and mounts it.
 * Lazy-load with React.lazy for code splitting.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton.jsx";

const WIDGET_SCRIPT_URL = "https://onchat.sebayaki.com/widget.js";

export function OnChatWidget({
  channel = "sekigahara",
  height = "600px",
  theme = "tokyo-night",
  hideBrand = false,
}) {
  const { t } = useTranslation();
  const widgetRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      try {
        if (!window.OnChat) {
          throw new Error("OnChat failed to load");
        }
        if (widgetRef.current) {
          window.OnChat.mount("#onchat-widget", {
            channel,
            height,
            theme,
            hideBrand,
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[OnChat] Widget error:", err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError("Failed to load OnChat");
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      const existing = document.querySelector(
        `script[src="${WIDGET_SCRIPT_URL}"]`,
      );
      if (existing) document.body.removeChild(existing);
    };
  }, [channel, height, theme, hideBrand]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-destructive bg-card p-6 text-center text-destructive"
        style={{ height }}
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div
          className="flex items-center justify-center rounded-lg border bg-card"
          style={{ height }}
        >
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-8 w-8 rounded-full" />
            <p className="text-sm text-muted-foreground">
              {t("chat.loading", "Loading OnChat...")}
            </p>
          </div>
        </div>
      )}
      <div
        id="onchat-widget"
        ref={widgetRef}
        style={{ display: isLoading ? "none" : "block" }}
      />
    </>
  );
}
