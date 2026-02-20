/**
 * ChatPage — dedicated page for the OnChat widget.
 * Route: /chat
 */

import { useTranslation } from "react-i18next";
import { OnChatWidget } from "@/components/onchat/OnChatWidget.jsx";

export default function ChatPage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-heading font-bold">
        {t("chat.title", "Chat")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("chat.description", "On-chain chat in the Sekigahara channel. Messages are stored on Base.")}
      </p>
      <OnChatWidget channel="sekigahara" height="calc(100svh - 220px)" />
    </section>
  );
}
