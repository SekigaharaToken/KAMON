/**
 * useHouseNFT — House NFT operations (ERC-1155 via bonding curve).
 *
 * In production (Base/Base Sepolia): uses Mint Club SDK.
 * In local dev (Anvil, chain 31337): uses direct viem calls to MockBond.
 *
 * Provides: getBuyPrice, mintHouseNFT, burnHouseNFT, getHouseBalance, getHouseSupply.
 */

import { isLocalDev } from "@/config/chains.js";

// Lazy imports — only load the module needed for the current chain
let sdkModule = null;
let localModule = null;

async function getSdk() {
  if (!sdkModule) {
    sdkModule = await import("@/lib/mintclub.js");
  }
  return sdkModule;
}

async function getLocal() {
  if (!localModule) {
    localModule = await import("@/lib/localBond.js");
  }
  return localModule;
}

function getNft(houseAddress) {
  // Only used for production (SDK) path
  return getSdk().then(({ mintclub }) =>
    mintclub.network("base").nft(houseAddress),
  );
}

export async function getBuyPrice(houseAddress) {
  if (!houseAddress) return null;

  if (isLocalDev) {
    const local = await getLocal();
    return local.localGetBuyPrice(houseAddress);
  }

  const nft = await getNft(houseAddress);
  return nft.getBuyPrice(1);
}

export async function mintHouseNFT(houseAddress, recipient) {
  if (!houseAddress) throw new Error("House address is required");

  if (isLocalDev) {
    const local = await getLocal();
    return local.localMintHouseNFT(houseAddress, recipient);
  }

  const nft = await getNft(houseAddress);
  return nft.buy({ amount: 1, recipient });
}

export async function burnHouseNFT(houseAddress, recipient) {
  if (!houseAddress) throw new Error("House address is required");

  if (isLocalDev) {
    const local = await getLocal();
    return local.localBurnHouseNFT(houseAddress, recipient);
  }

  const nft = await getNft(houseAddress);
  return nft.sell({ amount: 1, recipient });
}

export async function getHouseBalance(houseAddress, walletAddress) {
  if (!houseAddress) return 0n;

  if (isLocalDev) {
    const local = await getLocal();
    return local.localGetHouseBalance(houseAddress, walletAddress);
  }

  const nft = await getNft(houseAddress);
  return nft.getBalanceOf(walletAddress);
}

export async function getHouseSupply(houseAddress) {
  if (!houseAddress) return 0n;

  if (isLocalDev) {
    const local = await getLocal();
    return local.localGetHouseSupply(houseAddress);
  }

  const nft = await getNft(houseAddress);
  return nft.getTotalSupply();
}
