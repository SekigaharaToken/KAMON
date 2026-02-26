/**
 * useHouseMembership — EAS attestation for single-house membership.
 *
 * Reads: getHouse, isMultiHouseHolder, getAttestationUID from HouseResolver.
 * Writes: EAS.attest() and EAS.revoke() for membership registration.
 *
 * In local dev (isLocalDev): skips attestation calls, returns mock values.
 */

import { createPublicClient, createWalletClient, http, custom, encodeAbiParameters } from "viem";
import { isLocalDev, activeChain } from "@/config/chains.js";
import {
  EAS_ADDRESS,
  HOUSE_RESOLVER_ADDRESS,
  HOUSE_SCHEMA_UID,
} from "@/config/contracts.js";
import { houseResolverAbi } from "@/config/abis/houseResolver.js";
import { easAbi } from "@/config/abis/eas.js";

const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

function getPublicClient() {
  return createPublicClient({
    chain: activeChain,
    transport: http(),
  });
}

function getWalletClient() {
  if (!window.ethereum) throw new Error("No wallet connected");
  return createWalletClient({
    chain: activeChain,
    transport: custom(window.ethereum),
  });
}

/**
 * Encode houseId + fid as ABI-encoded (uint8, uint256) for EAS attestation data.
 * Matches Solidity's abi.encode(uint8, uint256) — HouseResolver V2 schema.
 */
function encodeMembershipData(houseId, fid) {
  return encodeAbiParameters(
    [{ type: "uint8" }, { type: "uint256" }],
    [houseId, BigInt(fid)],
  );
}

/**
 * Get the attested house for a wallet. Returns 0 if none.
 * @param {string} walletAddress
 * @returns {Promise<number>}
 */
export async function getAttestedHouse(walletAddress) {
  if (!walletAddress) return 0;
  if (isLocalDev) return 0;
  if (!HOUSE_RESOLVER_ADDRESS) return 0;

  const client = getPublicClient();
  const result = await client.readContract({
    address: HOUSE_RESOLVER_ADDRESS,
    abi: houseResolverAbi,
    functionName: "getHouse",
    args: [walletAddress],
  });
  return Number(result);
}

/**
 * Check if a wallet holds NFTs from multiple houses.
 * @param {string} walletAddress
 * @returns {Promise<boolean>}
 */
export async function getIsMultiHouseHolder(walletAddress) {
  if (!walletAddress) return false;
  if (isLocalDev) return false;
  if (!HOUSE_RESOLVER_ADDRESS) return false;

  const client = getPublicClient();
  return client.readContract({
    address: HOUSE_RESOLVER_ADDRESS,
    abi: houseResolverAbi,
    functionName: "isMultiHouseHolder",
    args: [walletAddress],
  });
}

/**
 * Get the attestation UID for a wallet's membership. Needed for revocation.
 * @param {string} walletAddress
 * @returns {Promise<string>} bytes32 UID or zero bytes
 */
export async function getMemberAttestationUID(walletAddress) {
  if (!walletAddress) return ZERO_BYTES32;
  if (isLocalDev) return ZERO_BYTES32;
  if (!HOUSE_RESOLVER_ADDRESS) return ZERO_BYTES32;

  const client = getPublicClient();
  return client.readContract({
    address: HOUSE_RESOLVER_ADDRESS,
    abi: houseResolverAbi,
    functionName: "getAttestationUID",
    args: [walletAddress],
  });
}

/**
 * Attest house membership via EAS. Creates an on-chain attestation
 * that the HouseResolver validates (checks NFT balance, single-house, FID uniqueness).
 *
 * @param {number} houseId — 1-5 (honoo, mizu, mori, tsuchi, kaze)
 * @param {string} walletAddress — recipient wallet
 * @param {number} fid — Farcaster user ID
 * @returns {Promise<string>} attestation UID (tx hash on success)
 */
export async function attestHouse(houseId, walletAddress, fid) {
  if (isLocalDev) return ZERO_BYTES32;
  if (!HOUSE_SCHEMA_UID || !HOUSE_RESOLVER_ADDRESS) return ZERO_BYTES32;

  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: EAS_ADDRESS,
    abi: easAbi,
    functionName: "attest",
    args: [
      {
        schema: HOUSE_SCHEMA_UID,
        data: {
          recipient: walletAddress,
          expirationTime: 0n,
          revocable: true,
          refUID: ZERO_BYTES32,
          data: encodeMembershipData(houseId, fid),
          value: 0n,
        },
      },
    ],
    account,
  });

  // Wait for receipt to confirm
  const publicClient = getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash });

  return hash;
}

/**
 * Revoke house membership via EAS.
 *
 * @param {string} walletAddress — the wallet whose membership to revoke
 * @returns {Promise<string>} tx hash
 */
export async function revokeHouse(walletAddress) {
  if (isLocalDev) return ZERO_BYTES32;
  if (!HOUSE_SCHEMA_UID || !HOUSE_RESOLVER_ADDRESS) return ZERO_BYTES32;

  const uid = await getMemberAttestationUID(walletAddress);
  if (uid === ZERO_BYTES32) {
    throw new Error("No attestation to revoke");
  }

  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: EAS_ADDRESS,
    abi: easAbi,
    functionName: "revoke",
    args: [
      {
        schema: HOUSE_SCHEMA_UID,
        data: {
          uid,
          value: 0n,
        },
      },
    ],
    account,
  });

  const publicClient = getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash });

  return hash;
}

/**
 * Get the wallet address registered for a given FID.
 * @param {number} fid — Farcaster user ID
 * @returns {Promise<string>} wallet address or zero address
 */
export async function getWalletByFid(fid) {
  if (!fid) return "0x0000000000000000000000000000000000000000";
  if (isLocalDev) return "0x0000000000000000000000000000000000000000";
  if (!HOUSE_RESOLVER_ADDRESS) return "0x0000000000000000000000000000000000000000";

  const client = getPublicClient();
  return client.readContract({
    address: HOUSE_RESOLVER_ADDRESS,
    abi: houseResolverAbi,
    functionName: "getWalletByFid",
    args: [BigInt(fid)],
  });
}

/**
 * Retry attestation — same as attestHouse, for manual retry when attest fails after mint.
 */
export const retryAttest = attestHouse;
