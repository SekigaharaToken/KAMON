/**
 * getHouseHolders — enumerate current NFT holders for a House ERC-1155 token.
 *
 * Mint Club ERC-1155 tokens are not enumerable, so we reconstruct the holder
 * list by querying TransferSingle events where from == zero address (mints).
 * We then check each unique recipient's current balance and keep only those
 * with balance > 0 (excluding wallets that have since sold).
 */

import { createPublicClient, http, parseAbiItem } from "viem";
import { activeChain } from "@/config/chains.js";
import { getLogsPaginated } from "@/lib/getLogsPaginated.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/** TransferSingle event (ERC-1155 standard) */
const TRANSFER_SINGLE_EVENT = parseAbiItem(
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)"
);

/** ERC-1155 balanceOf ABI fragment */
const BALANCE_OF_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
];

/** Mint Club ERC-1155 token ID is always 0 */
const TOKEN_ID = 0n;

/**
 * Enumerate current holders of a House ERC-1155 token.
 *
 * Strategy:
 *   1. Query TransferSingle events where `from` == zero address (mints).
 *   2. Deduplicate `to` addresses (excludes zero address itself).
 *   3. Check each address's current balance — keep only those with balance > 0.
 *
 * @param {string} tokenAddress — ERC-1155 contract address
 * @param {object} [publicClient] — optional viem public client (for testing)
 * @returns {Promise<string[]>} array of holder addresses
 */
export async function getHouseHolders(tokenAddress, publicClient) {
  if (!tokenAddress) return [];

  const client = publicClient ?? createPublicClient({
    chain: activeChain,
    transport: http(),
  });

  // 1. Fetch all mint logs (from == zero address)
  const logs = await getLogsPaginated({
    address: tokenAddress,
    event: TRANSFER_SINGLE_EVENT,
    args: { from: ZERO_ADDRESS },
    fromBlock: 0n,
    toBlock: "latest",
  });

  // 2. Deduplicate recipient addresses, excluding zero address
  const uniqueAddresses = [
    ...new Set(
      logs
        .map((log) => log.args.to)
        .filter(
          (addr) => addr && addr.toLowerCase() !== ZERO_ADDRESS
        )
    ),
  ];

  if (uniqueAddresses.length === 0) return [];

  // 3. Filter for addresses with current balance > 0
  const balanceChecks = await Promise.allSettled(
    uniqueAddresses.map((addr) =>
      client.readContract({
        address: tokenAddress,
        abi: BALANCE_OF_ABI,
        functionName: "balanceOf",
        args: [addr, TOKEN_ID],
      })
    )
  );

  return uniqueAddresses.filter((_, i) => {
    const result = balanceChecks[i];
    return result.status === "fulfilled" && result.value > 0n;
  });
}
