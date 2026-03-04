/**
 * Pre-configured Mint Club SDK instance with a CORS-friendly RPC.
 *
 * The SDK's built-in public RPC list for Base fails from browsers
 * (CORS blocks, 403s, 401s). We inject a working publicClient
 * for both Base mainnet and Base Sepolia so all SDK calls succeed.
 *
 * In local dev mode (VITE_CHAIN_ID=31337), the SDK is not initialized
 * because it doesn't support custom chains. Instead, useHouseNFT.js
 * routes calls through src/lib/localBond.js which uses direct viem calls.
 *
 * Follows AMATERASU's pattern: direct synchronous import of the SDK
 * singleton with lazy initialization via ensureInitialized().
 */

import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { mintclub } from "mint.club-v2-sdk";

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;

  const baseMainnetRpc = alchemyKey
    ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
    : "https://base-rpc.publicnode.com";

  const baseSepoliaRpc = alchemyKey
    ? `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`
    : "https://base-sepolia-rpc.publicnode.com";

  mintclub.withPublicClient(
    createPublicClient({ chain: base, transport: http(baseMainnetRpc) }),
  );
  mintclub.withPublicClient(
    createPublicClient({ chain: baseSepolia, transport: http(baseSepoliaRpc) }),
  );
}

/**
 * Async accessor for callers that used the old lazy-init API.
 * Returns the same singleton after ensuring initialization.
 */
async function getMintClub() {
  ensureInitialized();
  return mintclub;
}

/**
 * React hook — always returns true since initialization is now synchronous.
 * Kept for backward compatibility with components that gate on SDK readiness.
 */
function useMintClubReady() {
  return true;
}

export { mintclub, ensureInitialized, getMintClub, useMintClubReady };
