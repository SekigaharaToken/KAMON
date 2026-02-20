/**
 * useOnChat — OnChat message counts for leaderboard scoring.
 *
 * Queries MessageSent events from OnChat contract on Base,
 * filtered by sekigahara channel + sender wallet.
 * Falls back to null on error (triggers 40/60 scoring).
 */

import { createPublicClient, http, keccak256, toBytes, parseAbiItem } from "viem";
import { activeChain } from "@/config/chains.js";
import { ONCHAT_ADDRESS } from "@/config/contracts.js";
import { ONCHAT_CHANNEL_SLUG } from "@/config/season.js";
import { onchatAbi } from "@/config/abis/onchat.js";
import { getLogsPaginated } from "@/lib/getLogsPaginated.js";

const client = createPublicClient({
  chain: activeChain,
  transport: http(),
});

/** Pre-compute the sekigahara channel slug hash */
const CHANNEL_SLUG_HASH = keccak256(toBytes(ONCHAT_CHANNEL_SLUG));

/** MessageSent event for log filtering */
const MESSAGE_SENT_EVENT = parseAbiItem(
  "event MessageSent(bytes32 indexed slugHash, address indexed sender, uint256 indexed messageIndex, string content)"
);

/**
 * Count messages sent by a wallet in the sekigahara channel since a given block.
 * @param {string} walletAddress
 * @param {bigint} fromBlock — season start block
 * @returns {Promise<number|null>} message count, or null on error
 */
export async function getOnChatMessageCount(walletAddress, fromBlock) {
  try {
    const logs = await getLogsPaginated({
      address: ONCHAT_ADDRESS,
      event: MESSAGE_SENT_EVENT,
      args: {
        slugHash: CHANNEL_SLUG_HASH,
        sender: walletAddress,
      },
      fromBlock,
      toBlock: "latest",
    });
    return logs.length;
  } catch (err) {
    console.warn("[OnChat] Failed to query message count:", err.message);
    return null;
  }
}

/**
 * Get total message count in the sekigahara channel.
 * @returns {Promise<number|null>} total messages, or null on error
 */
export async function getOnChatTotalMessages() {
  try {
    const count = await client.readContract({
      address: ONCHAT_ADDRESS,
      abi: onchatAbi,
      functionName: "getMessageCount",
      args: [CHANNEL_SLUG_HASH],
    });
    return Number(count);
  } catch (err) {
    console.warn("[OnChat] Failed to query total messages:", err.message);
    return null;
  }
}

/**
 * Normalize user message count to 0-100 scale.
 * @param {number} userMessages
 * @param {number} maxMessages
 * @returns {number} 0-100
 */
export function normalizeOnChatMessages(userMessages, maxMessages) {
  if (!userMessages || !maxMessages) return 0;
  return Math.min(100, Math.round((userMessages / maxMessages) * 100));
}

/**
 * Get OnChat fallback score.
 * Returns null to signal fallback mode (40% DOJO + 60% Staking).
 * @returns {null}
 */
export function getOnChatFallbackScore() {
  return null;
}
