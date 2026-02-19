/**
 * Local Bond adapter — direct viem calls to MockBond contract.
 *
 * The Mint Club SDK doesn't support localhost/Anvil chains.
 * In local dev mode (VITE_CHAIN_ID=31337), this module replaces
 * the SDK for House NFT operations by calling our MockBond directly.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  custom,
} from "viem";
import { localhost } from "viem/chains";
import { getEnv } from "@/config/env.js";

const ANVIL_RPC = "http://localhost:8545";

// Anvil chain with correct ID
const anvilChain = {
  ...localhost,
  id: 31337,
  name: "Anvil",
};

const MOCK_BOND_ABI = parseAbi([
  "function mint(address token, uint256 amount, uint256 maxReserveAmount, address receiver) external returns (uint256)",
  "function burn(address token, uint256 amount, uint256 minRefund, address receiver) external returns (uint256)",
  "function getReserveForToken(address token, uint256 amount) external view returns (uint256 reserveAmount, uint256 royalty)",
  "function getRefundForTokens(address token, uint256 amount) external view returns (uint256 refundAmount, uint256 royalty)",
  "function priceForNextMint(address token) external view returns (uint128)",
  "function maxSupply(address token) external pure returns (uint128)",
  "function tokenBond(address token) external view returns (address creator, uint16 mintRoyalty, uint16 burnRoyalty, uint40 createdAt, address reserveToken, uint256 reserveBalance)",
]);

const MOCK_MULTI_TOKEN_ABI = parseAbi([
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function setApprovalForAll(address operator, bool approved) external",
]);

const MOCK_ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
]);

export function createLocalPublicClient() {
  return createPublicClient({
    chain: anvilChain,
    transport: http(ANVIL_RPC),
  });
}

export function createLocalWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }
  return createWalletClient({
    chain: anvilChain,
    transport: custom(window.ethereum),
  });
}

function getBondAddress() {
  return getEnv("VITE_MOCK_BOND_ADDRESS", "");
}

/**
 * Get the buy price for `amount` NFTs of a House token.
 */
export async function localGetBuyPrice(houseAddress, amount = 1) {
  const client = createLocalPublicClient();
  const [reserveAmount] = await client.readContract({
    address: getBondAddress(),
    abi: MOCK_BOND_ABI,
    functionName: "getReserveForToken",
    args: [houseAddress, BigInt(amount)],
  });
  return reserveAmount;
}

/**
 * Get the sell refund for `amount` NFTs of a House token.
 */
export async function localGetSellPrice(houseAddress, amount = 1) {
  const client = createLocalPublicClient();
  const [refundAmount] = await client.readContract({
    address: getBondAddress(),
    abi: MOCK_BOND_ABI,
    functionName: "getRefundForTokens",
    args: [houseAddress, BigInt(amount)],
  });
  return refundAmount;
}

/**
 * Buy (mint) House NFTs via the MockBond bonding curve.
 * Handles ERC-20 approval for the reserve token ($SEKI) automatically.
 */
export async function localMintHouseNFT(houseAddress, recipient) {
  const publicClient = createLocalPublicClient();
  const walletClient = createLocalWalletClient();
  if (!walletClient) throw new Error("No wallet connected");

  const [account] = await walletClient.getAddresses();
  const bondAddress = getBondAddress();

  // Get reserve token address from the bond
  const bondData = await publicClient.readContract({
    address: bondAddress,
    abi: MOCK_BOND_ABI,
    functionName: "tokenBond",
    args: [houseAddress],
  });
  const reserveToken = bondData[4]; // reserveToken is 5th field

  // Get buy price
  const cost = await localGetBuyPrice(houseAddress, 1);

  // Check and set ERC-20 allowance
  const currentAllowance = await publicClient.readContract({
    address: reserveToken,
    abi: MOCK_ERC20_ABI,
    functionName: "allowance",
    args: [account, bondAddress],
  });

  if (currentAllowance < cost) {
    const approveHash = await walletClient.writeContract({
      address: reserveToken,
      abi: MOCK_ERC20_ABI,
      functionName: "approve",
      args: [bondAddress, cost],
      account,
      chain: anvilChain,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  // Mint via Bond
  const maxReserve = (cost * 110n) / 100n; // 10% slippage buffer
  const mintHash = await walletClient.writeContract({
    address: bondAddress,
    abi: MOCK_BOND_ABI,
    functionName: "mint",
    args: [houseAddress, 1n, maxReserve, recipient || account],
    account,
    chain: anvilChain,
  });

  return publicClient.waitForTransactionReceipt({ hash: mintHash });
}

/**
 * Sell (burn) House NFTs back to the MockBond bonding curve.
 * Handles ERC-1155 approval for the Bond automatically.
 */
export async function localBurnHouseNFT(houseAddress, recipient) {
  const publicClient = createLocalPublicClient();
  const walletClient = createLocalWalletClient();
  if (!walletClient) throw new Error("No wallet connected");

  const [account] = await walletClient.getAddresses();
  const bondAddress = getBondAddress();

  // Set approval for Bond to burn the NFT
  const approveHash = await walletClient.writeContract({
    address: houseAddress,
    abi: MOCK_MULTI_TOKEN_ABI,
    functionName: "setApprovalForAll",
    args: [bondAddress, true],
    account,
    chain: anvilChain,
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  // Burn via Bond
  const burnHash = await walletClient.writeContract({
    address: bondAddress,
    abi: MOCK_BOND_ABI,
    functionName: "burn",
    args: [houseAddress, 1n, 0n, recipient || account],
    account,
    chain: anvilChain,
  });

  return publicClient.waitForTransactionReceipt({ hash: burnHash });
}

/**
 * Get the NFT balance for a wallet.
 */
export async function localGetHouseBalance(houseAddress, walletAddress) {
  const client = createLocalPublicClient();
  return client.readContract({
    address: houseAddress,
    abi: MOCK_MULTI_TOKEN_ABI,
    functionName: "balanceOf",
    args: [walletAddress, 0n], // token ID always 0
  });
}

/**
 * Get the total supply of a House NFT.
 */
export async function localGetHouseSupply(houseAddress) {
  const client = createLocalPublicClient();
  return client.readContract({
    address: houseAddress,
    abi: MOCK_MULTI_TOKEN_ABI,
    functionName: "totalSupply",
  });
}

/**
 * Get the price for the next single mint.
 */
export async function localGetNextMintPrice(houseAddress) {
  const client = createLocalPublicClient();
  return client.readContract({
    address: getBondAddress(),
    abi: MOCK_BOND_ABI,
    functionName: "priceForNextMint",
    args: [houseAddress],
  });
}

/**
 * Get the max supply (always 1000 in mock).
 */
export async function localGetMaxSupply(houseAddress) {
  const client = createLocalPublicClient();
  return client.readContract({
    address: getBondAddress(),
    abi: MOCK_BOND_ABI,
    functionName: "maxSupply",
    args: [houseAddress],
  });
}
