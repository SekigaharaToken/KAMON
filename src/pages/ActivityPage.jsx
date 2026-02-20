/**
 * ActivityPage — personal activity dashboard.
 */

import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useHouse } from "@/hooks/useHouse.js";
import { useWalletAddress } from "@/hooks/useWalletAddress.js";
import {
  getOnChatMessageCount,
  getOnChatTotalMessages,
  normalizeOnChatMessages,
} from "@/hooks/useOnChat.js";
import { ONCHAT_CACHE_TTL } from "@/config/season.js";
import { MyActivity } from "@/components/activity/MyActivity.jsx";
import { fadeInUp } from "@/lib/motion.js";

export default function ActivityPage() {
  const { houseConfig } = useHouse();
  const { address } = useWalletAddress();

  // TODO: Wire to useEASStreaks, useStaking

  const { data: messageCount } = useQuery({
    queryKey: ["onchat", "messages", address],
    queryFn: () => getOnChatMessageCount(address, 0n),
    staleTime: ONCHAT_CACHE_TTL,
    enabled: !!address,
  });

  const { data: totalMessages } = useQuery({
    queryKey: ["onchat", "total"],
    queryFn: () => getOnChatTotalMessages(),
    staleTime: ONCHAT_CACHE_TTL,
  });

  const onChatPct = normalizeOnChatMessages(messageCount, totalMessages);
  const onChat =
    messageCount != null ? { messageCount, percentage: onChatPct } : null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <MyActivity
          houseConfig={houseConfig}
          walletAddress={address}
          onChat={onChat}
        />
      </motion.div>
    </div>
  );
}
