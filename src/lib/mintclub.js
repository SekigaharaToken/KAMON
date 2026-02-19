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
 */

import { isLocalDev } from "@/config/chains.js";

let mintclub = null;

if (!isLocalDev) {
  // Only import and configure the SDK for production chains
  const { createPublicClient, http } = await import("viem");
  const { base, baseSepolia } = await import("viem/chains");
  const sdk = await import("mint.club-v2-sdk");

  const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;

  const baseMainnetRpc = alchemyKey
    ? `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`
    : "https://base-rpc.publicnode.com";

  const baseSepoliaRpc = alchemyKey
    ? `https://base-sepolia.g.alchemy.com/v2/${alchemyKey}`
    : "https://base-sepolia-rpc.publicnode.com";

  const baseClient = createPublicClient({
    chain: base,
    transport: http(baseMainnetRpc),
  });

  const baseSepoliaClient = createPublicClient({
    chain: baseSepolia,
    transport: http(baseSepoliaRpc),
  });

  mintclub = sdk.mintclub;
  mintclub.withPublicClient(baseClient);
  mintclub.withPublicClient(baseSepoliaClient);
}

export { mintclub };
