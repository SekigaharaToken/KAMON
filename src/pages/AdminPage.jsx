/**
 * AdminPage — operator-only season management.
 */

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { AdminPanel } from "@/components/admin/AdminPanel.jsx";
import { SeasonSnapshot } from "@/components/admin/SeasonSnapshot.jsx";
import { AirdropTrigger } from "@/components/admin/AirdropTrigger.jsx";
import { fadeInUp } from "@/lib/motion.js";
import { useWalletAddress } from "@/hooks/useWalletAddress.js";
import { getSeasonStatus, getWeekNumber } from "@/hooks/useSeason.js";
import { OPERATOR_ADDRESS, STAKING_POOL_ADDRESS } from "@/config/contracts.js";
import { getPoolState } from "@/hooks/useStaking.js";
import { mintclub } from "@/lib/mintclub.js";

export default function AdminPage() {
  const { address } = useWalletAddress();

  const isOperator =
    !!address &&
    !!OPERATOR_ADDRESS &&
    address.toLowerCase() === OPERATOR_ADDRESS;

  // Query pool startTime to derive season state
  const { data: poolState } = useQuery({
    queryKey: ["stakingPool", STAKING_POOL_ADDRESS],
    queryFn: () => getPoolState(STAKING_POOL_ADDRESS),
    enabled: !!mintclub && !!STAKING_POOL_ADDRESS,
    staleTime: 30_000,
  });

  // startTime from pool is in seconds; convert to ms.
  // When pool data is unavailable, fall back to stable defaults.
  const startTimeMs = poolState?.startTime
    ? Number(poolState.startTime) * 1000
    : null;

  const seasonStatus = startTimeMs ? getSeasonStatus(startTimeMs) : "active";
  const weekNumber = startTimeMs ? getWeekNumber(startTimeMs) : 1;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div {...fadeInUp}>
        <AdminPanel
          isOperator={isOperator}
          seasonStatus={seasonStatus}
          weekNumber={weekNumber}
        />
      </motion.div>
      {isOperator && (
        <>
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
          >
            <SeasonSnapshot rankings={[]} onConfirm={() => {}} isLoading={false} />
          </motion.div>
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.2 }}
          >
            <AirdropTrigger
              winnerMembers={[]}
              onTrigger={() => {}}
              isLoading={false}
              txHash={null}
            />
          </motion.div>
        </>
      )}
    </div>
  );
}
