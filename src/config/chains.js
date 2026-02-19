import { base, baseSepolia } from "wagmi/chains";
import { getEnv } from "./env.js";

export { base, baseSepolia };

/** Anvil local dev chain (chain ID 31337) */
export const anvil = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://localhost:8545"] },
  },
  testnet: true,
};

const chainId = Number(getEnv("VITE_CHAIN_ID", "8453"));

export const isLocalDev = chainId === 31337;

export const activeChain =
  chainId === 31337 ? anvil :
  chainId === 84532 ? baseSepolia :
  base;

export const SUPPORTED_CHAINS = [activeChain];
