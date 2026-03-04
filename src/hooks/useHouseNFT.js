/**
 * useHouseNFT — House NFT operations (ERC-1155 via bonding curve).
 *
 * In production (Base/Base Sepolia): uses Mint Club SDK.
 * In local dev (Anvil, chain 31337): uses direct viem calls to MockBond.
 *
 * Provides: getBuyPrice, getSellPrice, mintHouseNFT, burnHouseNFT, getHouseBalance, getHouseSupply.
 */

import { isLocalDev } from "@/config/chains.js";
import { MINT_CLUB_NETWORK } from "@/config/contracts.js";
import { mintclub, ensureInitialized } from "@/lib/mintclub.js";

// Lazy import — only load localBond for local dev
let localModule = null;

async function getLocal() {
  if (!localModule) {
    localModule = await import("@/lib/localBond.js");
  }
  return localModule;
}

function getNft(houseAddress) {
  ensureInitialized();
  return mintclub.network(MINT_CLUB_NETWORK).nft(houseAddress);
}

export async function getSellPrice(houseAddress) {
  if (!houseAddress) return null;

  if (isLocalDev) {
    const local = await getLocal();
    return local.localGetSellPrice(houseAddress);
  }

  const nft = getNft(houseAddress);
  const [refundAmount] = await nft.getSellEstimation(1n);
  return refundAmount;
}

export async function getBuyPrice(houseAddress) {
  if (!houseAddress) return null;

  if (isLocalDev) {
    const local = await getLocal();
    return local.localGetBuyPrice(houseAddress);
  }

  const nft = getNft(houseAddress);
  const [reserveAmount] = await nft.getBuyEstimation(1n);
  return reserveAmount;
}

export async function mintHouseNFT(houseAddress, recipient, walletClient) {
  if (!houseAddress) throw new Error("House address is required");

  if (isLocalDev) {
    const local = await getLocal();
    return local.localMintHouseNFT(houseAddress, recipient);
  }

  if (!walletClient) throw new Error("Wallet client is required");
  ensureInitialized();
  mintclub.withWalletClient(walletClient);
  const nft = mintclub.network(MINT_CLUB_NETWORK).nft(houseAddress);
  const receipt = await nft.buy({ amount: 1, recipient });
  if (!receipt) throw new Error("Transaction was not completed");
  return receipt;
}

export async function burnHouseNFT(houseAddress, recipient, walletClient) {
  if (!houseAddress) throw new Error("House address is required");

  if (isLocalDev) {
    const local = await getLocal();
    return local.localBurnHouseNFT(houseAddress, recipient);
  }

  if (!walletClient) throw new Error("Wallet client is required");
  ensureInitialized();
  mintclub.withWalletClient(walletClient);
  const nft = mintclub.network(MINT_CLUB_NETWORK).nft(houseAddress);
  const receipt = await nft.sell({ amount: 1, recipient });
  if (!receipt) throw new Error("Transaction was not completed");
  return receipt;
}

export async function getHouseBalance(houseAddress, walletAddress) {
  if (!houseAddress) return 0n;

  if (isLocalDev) {
    const local = await getLocal();
    return local.localGetHouseBalance(houseAddress, walletAddress);
  }

  const nft = getNft(houseAddress);
  return nft.getBalanceOf(walletAddress);
}

export async function getHouseSupply(houseAddress) {
  if (!houseAddress) return 0n;

  if (isLocalDev) {
    const local = await getLocal();
    return local.localGetHouseSupply(houseAddress);
  }

  const nft = getNft(houseAddress);
  return nft.getTotalSupply();
}
