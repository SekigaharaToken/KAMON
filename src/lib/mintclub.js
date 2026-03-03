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
 * IMPORTANT: This module uses lazy dynamic imports to avoid top-level await,
 * which blocks the ES module graph in production bundles.
 */

import { useState, useEffect } from "react";
import { isLocalDev } from "@/config/chains.js";

let mintclub = null;
let _initPromise = null;
const _listeners = new Set();

async function initMintClub() {
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

  // Notify all listeners that SDK is ready
  for (const fn of _listeners) fn();

  return mintclub;
}

/**
 * Returns the initialized Mint Club SDK instance.
 * Lazily initializes on first call for production chains.
 * Returns null in local dev mode.
 */
export async function getMintClub() {
  if (isLocalDev) return null;
  if (mintclub) return mintclub;
  if (!_initPromise) _initPromise = initMintClub();
  return _initPromise;
}

// Eagerly start initialization for production chains (non-blocking)
if (!isLocalDev) {
  _initPromise = initMintClub();
}

/**
 * React hook that returns true once the Mint Club SDK is initialized.
 * Triggers a re-render when the SDK becomes available.
 */
export function useMintClubReady() {
  const [ready, setReady] = useState(() => !!mintclub);

  useEffect(() => {
    if (ready) return;

    const listener = () => setReady(true);
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  }, [ready]);

  return ready;
}

export { mintclub };
