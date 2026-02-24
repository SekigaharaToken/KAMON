import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockReadContract = vi.fn();
const mockWriteContract = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();
const mockGetAddresses = vi.fn();

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPublicClient: () => ({
      readContract: mockReadContract,
      waitForTransactionReceipt: mockWaitForTransactionReceipt,
    }),
    createWalletClient: () => ({
      writeContract: mockWriteContract,
      getAddresses: mockGetAddresses,
    }),
  };
});

vi.mock("@/config/env.js", () => ({
  getEnv: (key, fallback) => {
    if (key === "VITE_MOCK_BOND_ADDRESS") return "0xBOND";
    return fallback;
  },
}));

const {
  localGetBuyPrice,
  localGetSellPrice,
  localGetHouseBalance,
  localGetHouseSupply,
  localGetNextMintPrice,
  localGetMaxSupply,
  localMintHouseNFT,
  localBurnHouseNFT,
  createLocalWalletClient,
} = await import("@/lib/localBond.js");

const HOUSE = "0xHOUSE";
const WALLET = "0xWALLET";
const RESERVE_TOKEN = "0xRESERVE";

describe("localBond", () => {
  let origEthereum;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAddresses.mockResolvedValue([WALLET]);
    origEthereum = window.ethereum;
    window.ethereum = {};
  });

  afterEach(() => {
    if (origEthereum !== undefined) {
      window.ethereum = origEthereum;
    } else {
      delete window.ethereum;
    }
  });

  describe("localGetBuyPrice", () => {
    it("calls readContract with correct args", async () => {
      mockReadContract.mockResolvedValueOnce([500n, 10n]);

      const result = await localGetBuyPrice(HOUSE, 1);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0xBOND",
          functionName: "getReserveForToken",
          args: [HOUSE, 1n],
        }),
      );
      expect(result).toBe(500n);
    });

    it("defaults amount to 1", async () => {
      mockReadContract.mockResolvedValueOnce([100n, 5n]);

      await localGetBuyPrice(HOUSE);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [HOUSE, 1n],
        }),
      );
    });
  });

  describe("localGetSellPrice", () => {
    it("calls readContract with correct args", async () => {
      mockReadContract.mockResolvedValueOnce([400n, 8n]);

      const result = await localGetSellPrice(HOUSE, 2);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "getRefundForTokens",
          args: [HOUSE, 2n],
        }),
      );
      expect(result).toBe(400n);
    });
  });

  describe("localGetHouseBalance", () => {
    it("calls readContract with address and token ID 0", async () => {
      mockReadContract.mockResolvedValueOnce(3n);

      const result = await localGetHouseBalance(HOUSE, WALLET);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: HOUSE,
          functionName: "balanceOf",
          args: [WALLET, 0n],
        }),
      );
      expect(result).toBe(3n);
    });
  });

  describe("localGetHouseSupply", () => {
    it("calls readContract with totalSupply", async () => {
      mockReadContract.mockResolvedValueOnce(250n);

      const result = await localGetHouseSupply(HOUSE);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: HOUSE,
          functionName: "totalSupply",
        }),
      );
      expect(result).toBe(250n);
    });
  });

  describe("localGetNextMintPrice", () => {
    it("calls readContract on bond with priceForNextMint", async () => {
      mockReadContract.mockResolvedValueOnce(15n);

      const result = await localGetNextMintPrice(HOUSE);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0xBOND",
          functionName: "priceForNextMint",
          args: [HOUSE],
        }),
      );
      expect(result).toBe(15n);
    });
  });

  describe("localGetMaxSupply", () => {
    it("calls readContract on bond with maxSupply", async () => {
      mockReadContract.mockResolvedValueOnce(1000n);

      const result = await localGetMaxSupply(HOUSE);

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0xBOND",
          functionName: "maxSupply",
          args: [HOUSE],
        }),
      );
      expect(result).toBe(1000n);
    });
  });

  describe("localMintHouseNFT", () => {
    it("skips approve when allowance >= cost", async () => {
      // tokenBond → returns reserve token at index 4
      mockReadContract
        .mockResolvedValueOnce(["0xCreator", 100, 100, 0, RESERVE_TOKEN, 0n]) // tokenBond
        .mockResolvedValueOnce([500n, 10n]) // getReserveForToken (buy price)
        .mockResolvedValueOnce(1000n); // allowance (>= 500)

      mockWriteContract.mockResolvedValueOnce("0xMintHash");
      mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: "success" });

      await localMintHouseNFT(HOUSE, WALLET);

      // Only 1 writeContract call (mint), no approve
      expect(mockWriteContract).toHaveBeenCalledTimes(1);
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "mint",
        }),
      );
    });

    it("calls approve then mint when allowance < cost", async () => {
      mockReadContract
        .mockResolvedValueOnce(["0xCreator", 100, 100, 0, RESERVE_TOKEN, 0n]) // tokenBond
        .mockResolvedValueOnce([500n, 10n]) // buy price
        .mockResolvedValueOnce(100n); // allowance (< 500)

      mockWriteContract
        .mockResolvedValueOnce("0xApproveHash") // approve
        .mockResolvedValueOnce("0xMintHash"); // mint
      mockWaitForTransactionReceipt.mockResolvedValue({ status: "success" });

      await localMintHouseNFT(HOUSE, WALLET);

      expect(mockWriteContract).toHaveBeenCalledTimes(2);
      expect(mockWriteContract).toHaveBeenNthCalledWith(1,
        expect.objectContaining({ functionName: "approve" }),
      );
      expect(mockWriteContract).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ functionName: "mint" }),
      );
    });

    it("applies 10% slippage buffer to maxReserve", async () => {
      mockReadContract
        .mockResolvedValueOnce(["0xCreator", 100, 100, 0, RESERVE_TOKEN, 0n])
        .mockResolvedValueOnce([1000n, 10n]) // cost = 1000n
        .mockResolvedValueOnce(2000n); // allowance sufficient

      mockWriteContract.mockResolvedValueOnce("0xMintHash");
      mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: "success" });

      await localMintHouseNFT(HOUSE, WALLET);

      // maxReserve = (1000 * 110) / 100 = 1100
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.arrayContaining([1100n]),
        }),
      );
    });

    it("uses recipient when provided", async () => {
      const recipient = "0xRecipient";
      mockReadContract
        .mockResolvedValueOnce(["0xCreator", 100, 100, 0, RESERVE_TOKEN, 0n])
        .mockResolvedValueOnce([100n, 10n])
        .mockResolvedValueOnce(500n);

      mockWriteContract.mockResolvedValueOnce("0xMintHash");
      mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: "success" });

      await localMintHouseNFT(HOUSE, recipient);

      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: [HOUSE, 1n, expect.any(BigInt), recipient],
        }),
      );
    });
  });

  describe("localBurnHouseNFT", () => {
    it("calls setApprovalForAll then burn in sequence", async () => {
      mockWriteContract
        .mockResolvedValueOnce("0xApproveHash") // setApprovalForAll
        .mockResolvedValueOnce("0xBurnHash"); // burn
      mockWaitForTransactionReceipt.mockResolvedValue({ status: "success" });

      await localBurnHouseNFT(HOUSE, WALLET);

      expect(mockWriteContract).toHaveBeenCalledTimes(2);
      expect(mockWriteContract).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          address: HOUSE,
          functionName: "setApprovalForAll",
          args: ["0xBOND", true],
        }),
      );
      expect(mockWriteContract).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          address: "0xBOND",
          functionName: "burn",
          args: [HOUSE, 1n, 0n, WALLET],
        }),
      );
    });

    it("falls back to account when no recipient provided", async () => {
      mockWriteContract
        .mockResolvedValueOnce("0xApproveHash")
        .mockResolvedValueOnce("0xBurnHash");
      mockWaitForTransactionReceipt.mockResolvedValue({ status: "success" });

      await localBurnHouseNFT(HOUSE, null);

      // Should use WALLET (from getAddresses) as fallback
      expect(mockWriteContract).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          args: [HOUSE, 1n, 0n, WALLET],
        }),
      );
    });
  });

  describe("createLocalWalletClient", () => {
    it("returns null when window.ethereum is missing", () => {
      delete window.ethereum;
      const client = createLocalWalletClient();
      expect(client).toBeNull();
    });

    it("returns a client when window.ethereum is present", () => {
      window.ethereum = {};
      const client = createLocalWalletClient();
      expect(client).not.toBeNull();
    });
  });
});
