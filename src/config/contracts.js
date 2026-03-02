/**
 * Contract addresses — chain-aware via VITE_CHAIN_ID.
 * EAS predeploys are identical on all OP Stack chains.
 */

import { getEnv } from "./env.js";

const chainId = Number(getEnv("VITE_CHAIN_ID", "8453"));

/** True when running against local Anvil (chain ID 31337) */
export const IS_LOCAL_DEV = chainId === 31337;

// EAS (OP Stack Predeploys — same on Base Mainnet and Base Sepolia)
export const EAS_ADDRESS = "0x4200000000000000000000000000000000000021";
export const SCHEMA_REGISTRY_ADDRESS =
  "0x4200000000000000000000000000000000000020";

// Mint Club V2
const MINT_CLUB_MAINNET = {
  BOND: "0xc5a076cad94176c2996B32d8466Be1cE757FAa27",
  ERC20: "0xAa70bC79fD1cB4a6FBA717018351F0C3c64B79Df",
  ERC1155: "0x6c61918eECcC306D35247338FDcf025af0f6120A",
  ZAP: "0x91523b39813F3F4E406ECe406D0bEAaA9dE251fa",
  LOCKER: "0xA3dCf3Ca587D9929d540868c924f208726DC9aB6",
  MERKLE: "0x1349A9DdEe26Fe16D0D44E35B3CB9B0CA18213a4",
  STAKE: "0x9Ab05EcA10d087f23a1B22A44A714cdbBA76E802",
};

const MINT_CLUB_SEPOLIA = {
  BOND: "0x5dfA75b0185efBaEF286E80B847ce84ff8a62C2d",
  ERC20: "0x37F540de37afE8bDf6C722d87CB019F30e5E406a",
  ERC1155: "0x4bF67e5C9baD43DD89dbe8fCAD3c213C868fe881",
  ZAP: "0x40c7DC399e01029a51cAb316f8Bca7D20DE31bad",
  LOCKER: "0x2c6B3fe4D6de27363cFEC95f703889EaF6b770fB",
  MERKLE: "0xCbb23973235feA43E62C41a0c67717a92a2467f2",
  STAKE: "",
};

// Local dev uses MockBond (deployed via scripts/dev-local.sh)
const MINT_CLUB_LOCAL = {
  BOND: getEnv("VITE_MOCK_BOND_ADDRESS", ""),
  ERC20: "",
  ERC1155: "",
  ZAP: "",
  LOCKER: "",
  MERKLE: "",
  STAKE: "",
};

export const MINT_CLUB =
  chainId === 31337 ? MINT_CLUB_LOCAL :
  chainId === 84532 ? MINT_CLUB_SEPOLIA :
  MINT_CLUB_MAINNET;

// Project tokens (loaded from env — set after Mint Club creation)
export const SEKI_TOKEN_ADDRESS =
  getEnv("VITE_SEKI_TOKEN_ADDRESS", "");
export const APP_TOKEN_ADDRESS =
  getEnv("VITE_APP_TOKEN_ADDRESS", "");

// Mint Club SDK network name matching chain ID
// Local dev doesn't use the SDK, but hooks check this for routing
export const MINT_CLUB_NETWORK =
  chainId === 31337 ? "local" :
  chainId === 84532 ? "basesepolia" :
  "base";

// Placeholder token for swap UI until bonding curve is live
// CATTBUTT on Base mainnet: https://mint.club/token/base/CATTBUTT
const PLACEHOLDER_SWAP_TOKEN = "0xC5aAEFD024Aa95C59712A931b3295e237fFD3f81";
const PLACEHOLDER_SWAP_NETWORK = "base";

// Use real app token on mainnet; on testnet (or when unconfigured) use placeholder
const hasMainnetToken = APP_TOKEN_ADDRESS && chainId === 8453;
export const SWAP_TOKEN_ADDRESS = hasMainnetToken ? APP_TOKEN_ADDRESS : PLACEHOLDER_SWAP_TOKEN;
export const SWAP_NETWORK = hasMainnetToken ? MINT_CLUB_NETWORK : PLACEHOLDER_SWAP_NETWORK;

// Token configs for the swap UI tabs
const hasMainnetSeki = SEKI_TOKEN_ADDRESS && chainId === 8453;
export const SEKI_SWAP_TOKEN_ADDRESS = hasMainnetSeki ? SEKI_TOKEN_ADDRESS : PLACEHOLDER_SWAP_TOKEN;
export const SEKI_SWAP_NETWORK = hasMainnetSeki ? MINT_CLUB_NETWORK : PLACEHOLDER_SWAP_NETWORK;

export const SWAP_TOKENS = [
  {
    key: "dojo",
    label: "$DOJO",
    address: SWAP_TOKEN_ADDRESS,
    network: SWAP_NETWORK,
    reserveLabel: APP_TOKEN_ADDRESS ? "$SEKI" : "ETH",
    priceKey: "swap.priceDojo",
    buyKey: "swap.buyDojo",
    sellKey: "swap.sellDojo",
  },
  {
    key: "seki",
    label: "$SEKI",
    address: SEKI_SWAP_TOKEN_ADDRESS,
    network: SEKI_SWAP_NETWORK,
    reserveLabel: "$HUNT",
    priceKey: "swap.priceSeki",
    buyKey: "swap.buySeki",
    sellKey: "swap.sellSeki",
  },
];

// --- KAMON-specific addresses ---

// $DOJO reward token
export const DOJO_TOKEN_ADDRESS =
  getEnv("VITE_DOJO_TOKEN_ADDRESS", "").toLowerCase();

// DojoResolver for streak reads
export const DOJO_RESOLVER_ADDRESS =
  getEnv("VITE_DOJO_RESOLVER_ADDRESS", "").toLowerCase();

// DOJO EAS schema UID
export const DOJO_SCHEMA_UID =
  getEnv("VITE_DOJO_SCHEMA_UID", "").toLowerCase();

// House NFT addresses (loaded from env, normalized)
export const HOUSE_ADDRESSES = {
  honoo: getEnv("VITE_HOUSE_FIRE_ADDRESS", "").toLowerCase(),
  mizu: getEnv("VITE_HOUSE_WATER_ADDRESS", "").toLowerCase(),
  mori: getEnv("VITE_HOUSE_FOREST_ADDRESS", "").toLowerCase(),
  tsuchi: getEnv("VITE_HOUSE_EARTH_ADDRESS", "").toLowerCase(),
  kaze: getEnv("VITE_HOUSE_WIND_ADDRESS", "").toLowerCase(),
};

// Staking pool address
export const STAKING_POOL_ADDRESS =
  getEnv("VITE_STAKING_POOL_ADDRESS", "").toLowerCase();

// House membership resolver (EAS)
export const HOUSE_RESOLVER_ADDRESS =
  getEnv("VITE_HOUSE_RESOLVER_ADDRESS", "").toLowerCase();

// House membership EAS schema UID
export const HOUSE_SCHEMA_UID =
  getEnv("VITE_HOUSE_SCHEMA_UID", "").toLowerCase();

// OnChat contract (env-aware; falls back to Base mainnet)
export const ONCHAT_ADDRESS = getEnv("VITE_ONCHAT_ADDRESS", "0x898D291C2160A9CB110398e9dF3693b7f2c4af2D");

// Operator wallet address for admin actions (lowercase for comparison)
export const OPERATOR_ADDRESS = getEnv("VITE_OPERATOR_ADDRESS", "").toLowerCase();
