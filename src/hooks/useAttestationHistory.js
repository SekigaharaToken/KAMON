import { useQuery } from "@tanstack/react-query";
import { parseAbiItem } from "viem";
import { EAS_ADDRESS } from "@/config/contracts.js";
import { getLogsPaginated, getBlockTimestamps } from "@/lib/getLogsPaginated.js";

const attestedEvent = parseAbiItem(
  "event Attested(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schemaUID)",
);

/**
 * Queries EAS Attested event logs for a given schema and attester.
 * Paginates in 2k-block chunks to respect Base public RPC limits.
 * Returns sorted list of { uid, blockNumber, timestamp } objects.
 *
 * @param {string} schemaUid — bytes32 schema UID (lowercase)
 * @param {string} attester — Address of the attester to filter by
 * @param {Object} [options]
 * @param {bigint} [options.fromBlock=0n] — Start block for log query
 * @param {number} [options.staleTime=30000] — TanStack Query stale time in ms
 */
export function useAttestationHistory(schemaUid, attester, { fromBlock = 0n, staleTime = 30_000 } = {}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["attestationHistory", schemaUid, attester],
    queryFn: async () => {
      if (!attester || !schemaUid) return [];

      const logs = await getLogsPaginated({
        address: EAS_ADDRESS,
        event: attestedEvent,
        args: {
          attester,
          schemaUID: schemaUid,
        },
        fromBlock,
        toBlock: "latest",
      });

      const timestampByBlock = await getBlockTimestamps(logs);

      return logs.map((log) => ({
        uid: log.data,
        blockNumber: Number(log.blockNumber),
        timestamp: timestampByBlock[log.blockNumber.toString()] ?? 0,
      }));
    },
    enabled: Boolean(attester && schemaUid),
    staleTime,
  });

  const attestations = data ?? [];

  return {
    attestations,
    totalCount: attestations.length,
    isLoading,
    isError,
  };
}
