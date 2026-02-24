import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock chains — must come before importing the module under test
vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 84532, name: "Base Sepolia" },
}));

vi.mock("@/config/contracts.js", () => ({
  EAS_ADDRESS: "0x4200000000000000000000000000000000000021",
  HOUSE_RESOLVER_ADDRESS: "0x1234567890abcdef1234567890abcdef12345678",
  HOUSE_SCHEMA_UID: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
}));

const mockReadContract = vi.fn();
const mockWriteContract = vi.fn();
const mockGetAddresses = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();

vi.mock("viem", () => ({
  createPublicClient: () => ({
    readContract: mockReadContract,
    waitForTransactionReceipt: mockWaitForTransactionReceipt,
  }),
  createWalletClient: () => ({
    writeContract: mockWriteContract,
    getAddresses: mockGetAddresses,
  }),
  http: () => ({}),
  custom: () => ({}),
  encodeAbiParameters: vi.fn((types, values) =>
    `0x${values[0].toString(16).padStart(64, "0")}`
  ),
}));

// Provide window.ethereum for wallet client creation
globalThis.window = { ethereum: {} };

describe("useHouseMembership", () => {
  let mod;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetAddresses.mockResolvedValue(["0xAlice"]);
    mockWriteContract.mockResolvedValue("0xtxhash");
    mockWaitForTransactionReceipt.mockResolvedValue({});
    // Fresh import each test to avoid stale module state
    mod = await import("@/hooks/useHouseMembership.js");
  });

  describe("getAttestedHouse", () => {
    it("returns numeric houseId from resolver", async () => {
      mockReadContract.mockResolvedValue(3);
      const result = await mod.getAttestedHouse("0xAlice");
      expect(result).toBe(3);
      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "getHouse",
          args: ["0xAlice"],
        }),
      );
    });

    it("returns 0 for null address", async () => {
      const result = await mod.getAttestedHouse(null);
      expect(result).toBe(0);
      expect(mockReadContract).not.toHaveBeenCalled();
    });
  });

  describe("getIsMultiHouseHolder", () => {
    it("returns boolean from resolver", async () => {
      mockReadContract.mockResolvedValue(true);
      const result = await mod.getIsMultiHouseHolder("0xAlice");
      expect(result).toBe(true);
      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "isMultiHouseHolder",
          args: ["0xAlice"],
        }),
      );
    });

    it("returns false for null address", async () => {
      const result = await mod.getIsMultiHouseHolder(null);
      expect(result).toBe(false);
    });
  });

  describe("getMemberAttestationUID", () => {
    it("returns bytes32 UID from resolver", async () => {
      const uid = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      mockReadContract.mockResolvedValue(uid);
      const result = await mod.getMemberAttestationUID("0xAlice");
      expect(result).toBe(uid);
    });

    it("returns zero bytes for null address", async () => {
      const result = await mod.getMemberAttestationUID(null);
      expect(result).toBe(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );
    });
  });

  describe("attestHouse", () => {
    it("calls EAS.attest with encoded houseId", async () => {
      await mod.attestHouse(1, "0xAlice");

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0x4200000000000000000000000000000000000021",
          functionName: "attest",
          account: "0xAlice",
        }),
      );

      // Verify the schema UID is passed correctly
      const callArgs = mockWriteContract.mock.calls[0][0];
      expect(callArgs.args[0].schema).toBe(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      );
      expect(callArgs.args[0].data.recipient).toBe("0xAlice");
      expect(callArgs.args[0].data.revocable).toBe(true);
    });

    it("waits for transaction receipt", async () => {
      await mod.attestHouse(1, "0xAlice");
      expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({
        hash: "0xtxhash",
      });
    });
  });

  describe("revokeHouse", () => {
    it("fetches attestation UID then calls EAS.revoke", async () => {
      const uid = "0xdeadbeef" + "0".repeat(56);
      mockReadContract.mockResolvedValue(uid);

      await mod.revokeHouse("0xAlice");

      // Should read attestation UID first
      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "getAttestationUID",
          args: ["0xAlice"],
        }),
      );

      // Then call revoke
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "revoke",
        }),
      );

      const callArgs = mockWriteContract.mock.calls[0][0];
      expect(callArgs.args[0].data.uid).toBe(uid);
    });

    it("throws if no attestation exists", async () => {
      mockReadContract.mockResolvedValue(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );

      await expect(mod.revokeHouse("0xAlice")).rejects.toThrow(
        "No attestation to revoke",
      );
    });
  });

  describe("retryAttest", () => {
    it("is the same function as attestHouse", () => {
      expect(mod.retryAttest).toBe(mod.attestHouse);
    });
  });
});
