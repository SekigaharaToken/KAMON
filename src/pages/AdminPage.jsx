/**
 * AdminPage — operator-only season management.
 */

import { motion } from "motion/react";
import { AdminPanel } from "@/components/admin/AdminPanel.jsx";
import { SeasonSnapshot } from "@/components/admin/SeasonSnapshot.jsx";
import { AirdropTrigger } from "@/components/admin/AirdropTrigger.jsx";
import { fadeInUp } from "@/lib/motion.js";

export default function AdminPage() {
  // TODO: Wire to useWalletAddress for operator check, useSeason for status

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <AdminPanel isOperator={false} />
      </motion.div>
      {/* SeasonSnapshot and AirdropTrigger shown only when isOperator */}
    </div>
  );
}
