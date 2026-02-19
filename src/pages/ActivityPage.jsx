/**
 * ActivityPage — personal activity dashboard.
 */

import { motion } from "motion/react";
import { useHouse } from "@/hooks/useHouse.js";
import { MyActivity } from "@/components/activity/MyActivity.jsx";
import { fadeInUp } from "@/lib/motion.js";

export default function ActivityPage() {
  const { houseConfig } = useHouse();

  // TODO: Wire to useWalletAddress, useEASStreaks, useStaking, useOnChat
  // For now, render the structure with placeholder data

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <MyActivity houseConfig={houseConfig} />
      </motion.div>
    </div>
  );
}
