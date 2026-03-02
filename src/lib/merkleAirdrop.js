/**
 * merkleAirdrop — utilities for building Merkle trees and calling
 * MerkleDistributor.createDistribution from an operator wallet.
 *
 * buildMerkleTree: pure function, no network calls.
 * createAirdrop:   requires window.ethereum (operator wallet).
 */

import { keccak256, encodePacked, createWalletClient, createPublicClient, http, custom } from "viem";
import { activeChain } from "@/config/chains.js";
import { MERKLE_DISTRIBUTOR_ADDRESS } from "@/config/contracts.js";
import { merkleDistributorAbi } from "@/config/abis/merkleDistributor.js";

// ─── Merkle tree ──────────────────────────────────────────────────────────────

/**
 * Hash a leaf address using keccak256(abi.encodePacked(address)).
 * Addresses are lowercased before hashing for determinism.
 *
 * @param {string} address — wallet address
 * @returns {`0x${string}`} 32-byte leaf hash
 */
function hashLeaf(address) {
  return keccak256(encodePacked(["address"], [address.toLowerCase()]));
}

/**
 * Sort-and-hash two sibling nodes together.
 * Sorting ensures the tree is order-independent (same proof regardless of
 * which side a sibling is on).
 *
 * @param {`0x${string}`} a
 * @param {`0x${string}`} b
 * @returns {`0x${string}`}
 */
function hashPair(a, b) {
  // Sort lexicographically so hash(a,b) === hash(b,a)
  const [left, right] = a.toLowerCase() <= b.toLowerCase() ? [a, b] : [b, a];
  return keccak256(encodePacked(["bytes32", "bytes32"], [left, right]));
}

/**
 * Build a simple Merkle tree from an array of wallet addresses.
 *
 * Algorithm:
 *   1. Hash each address to a leaf.
 *   2. Build layers bottom-up by hashing sorted adjacent pairs.
 *      If a layer has an odd number of nodes, duplicate the last node.
 *   3. Root = layers[last][0].
 *
 * @param {string[]} addresses — wallet addresses (order-stable, duplicates not checked)
 * @returns {{ root: `0x${string}`, getProof: (address: string) => `0x${string}`[] }}
 *
 * @throws {Error} if addresses is empty
 */
export function buildMerkleTree(addresses) {
  if (!addresses || addresses.length === 0) {
    throw new Error("buildMerkleTree: addresses array must not be empty");
  }

  // Normalise to lowercase
  const normalised = addresses.map((a) => a.toLowerCase());

  // Build the leaf layer
  const leaves = normalised.map(hashLeaf);

  // Edge case: single leaf — root IS the leaf, proof is []
  if (leaves.length === 1) {
    return {
      root: leaves[0],
      getProof: () => [],
    };
  }

  // Build layers bottom-up
  // layers[0] = leaf hashes, layers[n] = root
  const layers = [leaves];

  while (layers[layers.length - 1].length > 1) {
    const current = layers[layers.length - 1];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = i + 1 < current.length ? current[i + 1] : current[i]; // duplicate last if odd
      next.push(hashPair(left, right));
    }
    layers.push(next);
  }

  const root = layers[layers.length - 1][0];

  /**
   * Generate a Merkle proof for a given address.
   *
   * @param {string} address
   * @returns {`0x${string}`[]} array of sibling hashes from leaf to root
   */
  function getProof(address) {
    const target = hashLeaf(address.toLowerCase());
    const proof = [];

    let index = layers[0].indexOf(target);
    if (index === -1) return proof;

    for (let l = 0; l < layers.length - 1; l++) {
      const layer = layers[l];
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;
      // If no sibling (odd layer, last node was duplicated), sibling = self
      const sibling = siblingIndex < layer.length ? layer[siblingIndex] : layer[index];
      proof.push(sibling);
      index = Math.floor(index / 2);
    }

    return proof;
  }

  return { root, getProof };
}

// ─── Contract call ────────────────────────────────────────────────────────────

function getWalletClient() {
  if (!window.ethereum) throw new Error("No wallet connected");
  return createWalletClient({
    chain: activeChain,
    transport: custom(window.ethereum),
  });
}

function getPublicClient() {
  return createPublicClient({
    chain: activeChain,
    transport: http(),
  });
}

/**
 * Call MerkleDistributor.createDistribution from the operator wallet.
 *
 * @param {object} params
 * @param {string}   params.tokenAddress   — ERC-20 token to distribute
 * @param {bigint}   params.amountPerClaim — tokens per recipient (raw, no decimals applied here)
 * @param {string[]} params.recipients     — wallet addresses eligible to claim
 * @param {string}   params.title          — human-readable distribution title
 * @returns {Promise<`0x${string}`>} transaction hash
 *
 * @throws if recipients is empty or MERKLE_DISTRIBUTOR_ADDRESS is not configured
 */
export async function createAirdrop({ tokenAddress, amountPerClaim, recipients, title }) {
  if (!recipients || recipients.length === 0) {
    throw new Error("createAirdrop: recipients must not be empty");
  }
  if (!MERKLE_DISTRIBUTOR_ADDRESS) {
    throw new Error("createAirdrop: MERKLE_DISTRIBUTOR_ADDRESS is not configured");
  }

  const { root } = buildMerkleTree(recipients);

  const now = BigInt(Math.floor(Date.now() / 1000));
  // Distribution window: open immediately, closes in 90 days
  const startTime = now;
  const endTime = now + BigInt(90 * 24 * 60 * 60);

  const walletClient = getWalletClient();
  const [account] = await walletClient.getAddresses();

  const txHash = await walletClient.writeContract({
    address: MERKLE_DISTRIBUTOR_ADDRESS,
    abi: merkleDistributorAbi,
    functionName: "createDistribution",
    args: [
      tokenAddress,          // token
      true,                  // isERC20
      amountPerClaim,        // amountPerClaim (uint176)
      BigInt(recipients.length), // walletCount (uint40)
      startTime,             // startTime (uint40)
      endTime,               // endTime (uint40)
      root,                  // merkleRoot (bytes32)
      title,                 // title (string)
      "",                    // ipfsCID (string) — empty for now
    ],
    account,
  });

  // Wait for confirmation
  const publicClient = getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}
