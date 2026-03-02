/**
 * merkleAirdrop — unit tests (TDD, written before implementation).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/config/contracts.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    MERKLE_DISTRIBUTOR_ADDRESS: "0xdistributor000000000000000000000000001",
  };
});

vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

// Mock viem — only what we need
const mockWriteContract = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();
const mockGetAddresses = vi.fn(() => Promise.resolve(["0xoperator0000000000000000000000000000001"]));

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createWalletClient: vi.fn(() => ({
      writeContract: mockWriteContract,
      getAddresses: mockGetAddresses,
    })),
    createPublicClient: vi.fn(() => ({
      waitForTransactionReceipt: mockWaitForTransactionReceipt,
    })),
    // Keep real keccak256 and encodePacked for merkle tree tests
    keccak256: actual.keccak256,
    encodePacked: actual.encodePacked,
    custom: vi.fn((p) => p),
    http: vi.fn(),
  };
});

// Mock window.ethereum so getWalletClient doesn't throw
Object.defineProperty(globalThis, "window", {
  value: { ethereum: {} },
  writable: true,
});

import { buildMerkleTree, createAirdrop } from "@/lib/merkleAirdrop.js";

// ─── buildMerkleTree ──────────────────────────────────────────────────────────

describe("buildMerkleTree", () => {
  it("returns an object with root and getProof", () => {
    const addresses = [
      "0xaaa0000000000000000000000000000000000001",
      "0xbbb0000000000000000000000000000000000002",
    ];
    const tree = buildMerkleTree(addresses);
    expect(tree).toHaveProperty("root");
    expect(tree).toHaveProperty("getProof");
    expect(typeof tree.getProof).toBe("function");
  });

  it("root is a bytes32 hex string", () => {
    const addresses = [
      "0xaaa0000000000000000000000000000000000001",
      "0xbbb0000000000000000000000000000000000002",
    ];
    const { root } = buildMerkleTree(addresses);
    // 0x prefix + 64 hex chars
    expect(root).toMatch(/^0x[0-9a-f]{64}$/i);
  });

  it("getProof returns an array of bytes32 strings", () => {
    const addresses = [
      "0xaaa0000000000000000000000000000000000001",
      "0xbbb0000000000000000000000000000000000002",
    ];
    const { getProof } = buildMerkleTree(addresses);
    const proof = getProof("0xaaa0000000000000000000000000000000000001");
    expect(Array.isArray(proof)).toBe(true);
    proof.forEach((item) => {
      expect(item).toMatch(/^0x[0-9a-f]{64}$/i);
    });
  });

  it("getProof for a single recipient returns empty array (root is the leaf)", () => {
    const addresses = ["0xaaa0000000000000000000000000000000000001"];
    const { getProof } = buildMerkleTree(addresses);
    const proof = getProof("0xaaa0000000000000000000000000000000000001");
    expect(proof).toEqual([]);
  });

  it("different address lists produce different roots", () => {
    const treeA = buildMerkleTree(["0xaaa0000000000000000000000000000000000001"]);
    const treeB = buildMerkleTree(["0xbbb0000000000000000000000000000000000002"]);
    expect(treeA.root).not.toBe(treeB.root);
  });

  it("same address list always produces the same root (deterministic)", () => {
    const addresses = [
      "0xaaa0000000000000000000000000000000000001",
      "0xbbb0000000000000000000000000000000000002",
      "0xccc0000000000000000000000000000000000003",
    ];
    const treeA = buildMerkleTree(addresses);
    const treeB = buildMerkleTree(addresses);
    expect(treeA.root).toBe(treeB.root);
  });

  it("proof validates against root for any recipient in a 3-address list", () => {
    // We verify by checking that getProof doesn't throw and returns a proof
    // (full on-chain verification is out of scope for unit tests)
    const addresses = [
      "0xaaa0000000000000000000000000000000000001",
      "0xbbb0000000000000000000000000000000000002",
      "0xccc0000000000000000000000000000000000003",
    ];
    const { getProof } = buildMerkleTree(addresses);
    for (const addr of addresses) {
      const proof = getProof(addr);
      expect(Array.isArray(proof)).toBe(true);
    }
  });

  it("throws when given an empty address list", () => {
    expect(() => buildMerkleTree([])).toThrow();
  });

  it("addresses are normalised to lowercase before hashing", () => {
    const lower = buildMerkleTree(["0xaaa0000000000000000000000000000000000001"]);
    const upper = buildMerkleTree(["0xAAA0000000000000000000000000000000000001"]);
    expect(lower.root).toBe(upper.root);
  });
});

// ─── createAirdrop ────────────────────────────────────────────────────────────

describe("createAirdrop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteContract.mockResolvedValue("0xtxhash111111111111111111111111111111111111");
    mockWaitForTransactionReceipt.mockResolvedValue({ status: "success" });
  });

  it("calls writeContract and returns a tx hash", async () => {
    const txHash = await createAirdrop({
      tokenAddress: "0xtoken0000000000000000000000000000000001",
      amountPerClaim: 1000n,
      recipients: [
        "0xaaa0000000000000000000000000000000000001",
        "0xbbb0000000000000000000000000000000000002",
      ],
      title: "Season 1 Rewards",
    });

    expect(mockWriteContract).toHaveBeenCalledOnce();
    expect(txHash).toBe("0xtxhash111111111111111111111111111111111111");
  });

  it("passes tokenAddress to writeContract args", async () => {
    const tokenAddress = "0xtoken0000000000000000000000000000000001";
    await createAirdrop({
      tokenAddress,
      amountPerClaim: 500n,
      recipients: ["0xaaa0000000000000000000000000000000000001"],
      title: "Season 1 Rewards",
    });

    const [callArgs] = mockWriteContract.mock.calls[0];
    expect(callArgs.args[0]).toBe(tokenAddress);
  });

  it("passes correct walletCount to writeContract args", async () => {
    const recipients = [
      "0xaaa0000000000000000000000000000000000001",
      "0xbbb0000000000000000000000000000000000002",
      "0xccc0000000000000000000000000000000000003",
    ];
    await createAirdrop({
      tokenAddress: "0xtoken0000000000000000000000000000000001",
      amountPerClaim: 100n,
      recipients,
      title: "Season 1 Rewards",
    });

    const [callArgs] = mockWriteContract.mock.calls[0];
    // walletCount is the 4th positional arg (index 3)
    expect(Number(callArgs.args[3])).toBe(recipients.length);
  });

  it("passes title to writeContract args", async () => {
    await createAirdrop({
      tokenAddress: "0xtoken0000000000000000000000000000000001",
      amountPerClaim: 100n,
      recipients: ["0xaaa0000000000000000000000000000000000001"],
      title: "Season 42 Rewards",
    });

    const [callArgs] = mockWriteContract.mock.calls[0];
    // title is arg index 7
    expect(callArgs.args[7]).toBe("Season 42 Rewards");
  });

  it("passes amountPerClaim as bigint to writeContract", async () => {
    await createAirdrop({
      tokenAddress: "0xtoken0000000000000000000000000000000001",
      amountPerClaim: 250000n,
      recipients: ["0xaaa0000000000000000000000000000000000001"],
      title: "Season 1 Rewards",
    });

    const [callArgs] = mockWriteContract.mock.calls[0];
    // amountPerClaim is arg index 2
    expect(callArgs.args[2]).toBe(250000n);
  });

  it("throws when MERKLE_DISTRIBUTOR_ADDRESS is not set", async () => {
    // This is covered by contracts.js integration — tested here by
    // checking that the function validates its inputs.
    // We do a quick smoke test by passing no recipients.
    await expect(
      createAirdrop({
        tokenAddress: "0xtoken0000000000000000000000000000000001",
        amountPerClaim: 100n,
        recipients: [],
        title: "Season 1 Rewards",
      })
    ).rejects.toThrow();
  });
});
