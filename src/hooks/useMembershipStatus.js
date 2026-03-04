/**
 * useMembershipStatus — checks NFT balance + attestation to detect incomplete membership.
 *
 * Returns { hasNFT, hasAttestation, isComplete, needsNFT, needsAttestation, isLoading }
 * Enabled only when: !isLocalDev && selectedHouse && address && houseConfig?.address
 */

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useHouse } from "@/hooks/useHouse.js";
import { isLocalDev } from "@/config/chains.js";
import { getHouseBalance } from "@/hooks/useHouseNFT.js";
import { getAttestedHouse } from "@/hooks/useHouseMembership.js";

export function useMembershipStatus() {
  const { address } = useAccount();
  const { selectedHouse, houseConfig } = useHouse();

  const enabled = !isLocalDev && !!selectedHouse && !!address && !!houseConfig?.address;

  const { data: nftBalance, isLoading: nftLoading } = useQuery({
    queryKey: ["membershipNFT", houseConfig?.address, address],
    queryFn: () => getHouseBalance(houseConfig.address, address),
    enabled,
    staleTime: 15_000,
  });

  const { data: attestedHouse, isLoading: attestLoading } = useQuery({
    queryKey: ["membershipAttest", address],
    queryFn: () => getAttestedHouse(address),
    enabled,
    staleTime: 15_000,
  });

  if (!enabled) {
    return {
      hasNFT: false,
      hasAttestation: false,
      isComplete: false,
      needsNFT: false,
      needsAttestation: false,
      isLoading: false,
    };
  }

  const isLoading = nftLoading || attestLoading;
  const hasNFT = nftBalance != null && nftBalance > 0n;
  const hasAttestation = attestedHouse != null && attestedHouse > 0;
  const isComplete = hasNFT && hasAttestation;
  const needsNFT = !hasNFT;
  const needsAttestation = hasNFT && !hasAttestation;

  return { hasNFT, hasAttestation, isComplete, needsNFT, needsAttestation, isLoading };
}
