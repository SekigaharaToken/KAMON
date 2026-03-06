/**
 * useHouseAutoDetect — restores House selection from on-chain EAS attestation.
 *
 * When a wallet is connected but no House is selected in localStorage
 * (e.g., new device), queries the HouseResolver to check if the wallet
 * has an existing attestation and auto-selects the House if found.
 */

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { isLocalDev } from "@/config/chains.js";
import { getAttestedHouse } from "@/hooks/useHouseMembership.js";
import { getHouseByNumericId } from "@/config/houses.js";
import { useHouse } from "@/hooks/useHouse.js";

export function useHouseAutoDetect() {
  const { address } = useAccount();
  const { selectedHouse, selectHouse } = useHouse();

  const enabled = !isLocalDev && !!address && !selectedHouse;

  const { data: attestedHouseId } = useQuery({
    queryKey: ["houseAutoDetect", address],
    queryFn: () => getAttestedHouse(address),
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (attestedHouseId == null || attestedHouseId === 0) return;
    const house = getHouseByNumericId(attestedHouseId);
    if (house) selectHouse(house.id);
  }, [attestedHouseId, selectHouse]);
}
