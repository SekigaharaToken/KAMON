import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getLogsPaginated before importing module under test
const mockGetLogsPaginated = vi.fn();
vi.mock("@/lib/getLogsPaginated.js", () => ({
  getLogsPaginated: (...args) => mockGetLogsPaginated(...args),
}));

// Mock viem's createPublicClient for contract reads
const mockReadContract = vi.fn();
vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPublicClient: () => ({ readContract: mockReadContract }),
  };
});

vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

const {
  getOnChatMessageCount,
  getOnChatTotalMessages,
  normalizeOnChatMessages,
} = await import("@/hooks/useOnChat.js");

describe("useOnChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeOnChatMessages", () => {
    it("returns 0 for zero messages", () => {
      expect(normalizeOnChatMessages(0, 100)).toBe(0);
    });

    it("returns 100 for max messages", () => {
      expect(normalizeOnChatMessages(100, 100)).toBe(100);
    });

    it("returns correct percentage", () => {
      expect(normalizeOnChatMessages(50, 200)).toBe(25);
    });

    it("caps at 100", () => {
      expect(normalizeOnChatMessages(200, 100)).toBe(100);
    });

    it("returns 0 for null inputs", () => {
      expect(normalizeOnChatMessages(null, 100)).toBe(0);
      expect(normalizeOnChatMessages(50, null)).toBe(0);
      expect(normalizeOnChatMessages(50, 0)).toBe(0);
    });
  });

  describe("getOnChatMessageCount", () => {
    it("counts MessageSent events for a wallet", async () => {
      mockGetLogsPaginated.mockResolvedValue([
        { args: { sender: "0xabc" } },
        { args: { sender: "0xabc" } },
        { args: { sender: "0xabc" } },
      ]);

      const count = await getOnChatMessageCount("0xabc", 1000000n);
      expect(count).toBe(3);
      expect(mockGetLogsPaginated).toHaveBeenCalledTimes(1);

      // Verify correct filter args
      const callArgs = mockGetLogsPaginated.mock.calls[0][0];
      expect(callArgs.address).toBe("0x898D291C2160A9CB110398e9dF3693b7f2c4af2D");
      expect(callArgs.args.sender).toBe("0xabc");
      expect(callArgs.fromBlock).toBe(1000000n);
      expect(callArgs.toBlock).toBe("latest");
    });

    it("returns 0 when no events found", async () => {
      mockGetLogsPaginated.mockResolvedValue([]);
      const count = await getOnChatMessageCount("0xdef", 0n);
      expect(count).toBe(0);
    });

    it("returns null on error (fallback mode)", async () => {
      mockGetLogsPaginated.mockRejectedValue(new Error("RPC error"));
      const count = await getOnChatMessageCount("0xabc", 0n);
      expect(count).toBeNull();
    });
  });

  describe("getOnChatTotalMessages", () => {
    it("returns total message count from contract", async () => {
      mockReadContract.mockResolvedValue(500n);
      const total = await getOnChatTotalMessages();
      expect(total).toBe(500);
    });

    it("returns null on error", async () => {
      mockReadContract.mockRejectedValue(new Error("RPC error"));
      const total = await getOnChatTotalMessages();
      expect(total).toBeNull();
    });
  });
});
