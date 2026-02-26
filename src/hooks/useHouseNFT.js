/**
 * useHouseNFT — House NFT operations (ERC-1155 via bonding curve).
 *
 * In production (Base/Base Sepolia): uses Mint Club SDK.
 * In local dev (Anvil, chain 31337): uses direct viem calls to MockBond.
 *
 * Provides: getBuyPrice, getSellPrice, mintHouseNFT, burnHouseNFT, getHouseBalance, getHouseSupply.
 */

import { isLocalDev, activeChain } from "@/config/chains.js";
import { MINT_CLUB_NETWORK } from "@/config/contracts.js";

// Lazy imports — only load the module needed for the current chain
let sdkModule = null;
let localModule = null;
let walletClientInjected = false;

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

/**
 * Ensure the SDK has a wallet client for write operations.
 * Must be called before buy()/sell() — the SDK won't prompt a wallet
 * popup if it doesn't have one pre-configured.
 */
async function ensureWalletClient() {
  if (walletClientInjected || !window.ethereum) return;
  const { createWalletClient, custom } = await import("viem");
  const { mintclub } = await getSdk();
  const [address] = await window.ethereum.request({ method: "eth_accounts" });
  if (!address) return;
  const walletClient = createWalletClient({
    account: address,
    chain: activeChain,
    transport: custom(window.ethereum),
  });
  mintclub.withWalletClient(walletClient);
  walletClientInjected = true;
}

function getNft(houseAddress) {
  // Only used for production (SDK) path
  return getSdk().then(({ mintclub }) =>
    mintclub.network(MINT_CLUB_NETWORK).nft(houseAddress),
  );
}

export async function getSellPrice(houseAddress) {
  if (!houseAddress) return null;

  if (isLocalDev) {
    const local = await getLocal();
    return local.localGetSellPrice(houseAddress);
  }

  const nft = await getNft(houseAddress);
  const [refundAmount] = await nft.getSellEstimation(1n);
  return refundAmount;
}

export async function getBuyPrice(houseAddress) {
  if (!houseAddress) return null;

  if (isLocalDev) {
    const local = await getLocal();
    return local.localGetBuyPrice(houseAddress);
  }

  const nft = await getNft(houseAddress);
  const [reserveAmount] = await nft.getBuyEstimation(1n);
  return reserveAmount;
}

export async function mintHouseNFT(houseAddress, recipient) {
  if (!houseAddress) throw new Error("House address is required");

  if (isLocalDev) {
    const local = await getLocal();
    return local.localMintHouseNFT(houseAddress, recipient);
  }

  await ensureWalletClient();
  const nft = await getNft(houseAddress);
  return nft.buy({
    amount: 1,
    recipient,
    onError: (e) => { throw e; },
  });
}

export async function burnHouseNFT(houseAddress, recipient) {
  if (!houseAddress) throw new Error("House address is required");

  if (isLocalDev) {
    const local = await getLocal();
    return local.localBurnHouseNFT(houseAddress, recipient);
  }

  await ensureWalletClient();
  const nft = await getNft(houseAddress);
  return nft.sell({
    amount: 1,
    recipient,
    onError: (e) => { throw e; },
  });
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
