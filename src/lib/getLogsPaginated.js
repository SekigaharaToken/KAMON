import { createPublicClient, http } from "viem";
import { activeChain } from "@/config/chains.js";

const client = createPublicClient({
  chain: activeChain,
  transport: http(),
});

// Base mainnet public RPC limits eth_getLogs to ~3k blocks per request.
// Use 2k to be safe on both mainnet and Sepolia.
const MAX_BLOCK_RANGE = 2_000n;

/**
 * Fetches event logs in paginated chunks to stay within RPC block range limits.
 * Works with any event on any contract address.
 *
 * @param {Object} params
 * @param {string} params.address — Contract address to query
 * @param {Object} params.event — Parsed ABI event item (from parseAbiItem)
 * @param {Object} [params.args] — Indexed event args for filtering
 * @param {bigint} params.fromBlock — Start block
 * @param {bigint|"latest"} params.toBlock — End block
 * @returns {Promise<Array>} All matching logs
 */
export async function getLogsPaginated({ address, event, args, fromBlock, toBlock }) {
  const latest = toBlock === "latest"
    ? await client.getBlockNumber()
    : toBlock;

  const allLogs = [];
  let cursor = fromBlock;

  while (cursor <= latest) {
    const end = cursor + MAX_BLOCK_RANGE - 1n > latest
      ? latest
      : cursor + MAX_BLOCK_RANGE - 1n;

    const logs = await client.getLogs({
      address,
      event,
      args,
      fromBlock: cursor,
      toBlock: end,
    });

    allLogs.push(...logs);
    cursor = end + 1n;
  }

  return allLogs;
}

/**
 * Fetches block timestamps for a list of logs.
 * Deduplicates block numbers to minimize RPC calls.
 *
 * @param {Array} logs — Array of log objects with blockNumber
 * @returns {Promise<Object>} Map of blockNumber string → timestamp number
 */
export async function getBlockTimestamps(logs) {
  const blockNumbers = [...new Set(logs.map((l) => l.blockNumber))];
  const blocks = await Promise.all(
    blockNumbers.map((n) => client.getBlock({ blockNumber: n })),
  );
  return Object.fromEntries(
    blocks.map((b) => [b.number.toString(), Number(b.timestamp)]),
  );
}
