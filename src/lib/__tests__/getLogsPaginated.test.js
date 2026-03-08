import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetBlockNumber = vi.fn();
const mockGetLogs = vi.fn();
const mockGetBlock = vi.fn();

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPublicClient: () => ({
      getBlockNumber: mockGetBlockNumber,
      getLogs: mockGetLogs,
      getBlock: mockGetBlock,
    }),
  };
});

vi.mock("@/config/chains.js", () => ({
  activeChain: { id: 8453, name: "Base" },
  isLocalDev: false,
}));

// Dynamic import so mocks are in place
const { getLogsPaginated, getBlockTimestamps } = await import(
  "@/lib/getLogsPaginated.js"
);

const mockEvent = { type: "event", name: "Transfer" };

describe("getLogsPaginated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("makes a single getLogs call when range < 10000 blocks", async () => {
    mockGetLogs.mockResolvedValueOnce([{ log: 1 }, { log: 2 }]);

    const result = await getLogsPaginated({
      address: "0x123",
      event: mockEvent,
      fromBlock: 100n,
      toBlock: 200n,
    });

    expect(mockGetLogs).toHaveBeenCalledTimes(1);
    expect(mockGetLogs).toHaveBeenCalledWith({
      address: "0x123",
      event: mockEvent,
      args: undefined,
      fromBlock: 100n,
      toBlock: 200n,
    });
    expect(result).toEqual([{ log: 1 }, { log: 2 }]);
  });

  it("paginates into correct chunks for multi-page ranges", async () => {
    // Range: 0 to 24999 = 25000 blocks = 3 pages (0-9999, 10000-19999, 20000-24999)
    mockGetLogs
      .mockResolvedValueOnce([{ log: "a" }])
      .mockResolvedValueOnce([{ log: "b" }])
      .mockResolvedValueOnce([{ log: "c" }]);

    const result = await getLogsPaginated({
      address: "0xabc",
      event: mockEvent,
      fromBlock: 0n,
      toBlock: 24999n,
    });

    expect(mockGetLogs).toHaveBeenCalledTimes(3);
    expect(mockGetLogs).toHaveBeenNthCalledWith(1, expect.objectContaining({
      fromBlock: 0n,
      toBlock: 9999n,
    }));
    expect(mockGetLogs).toHaveBeenNthCalledWith(2, expect.objectContaining({
      fromBlock: 10000n,
      toBlock: 19999n,
    }));
    expect(mockGetLogs).toHaveBeenNthCalledWith(3, expect.objectContaining({
      fromBlock: 20000n,
      toBlock: 24999n,
    }));
    expect(result).toEqual([{ log: "a" }, { log: "b" }, { log: "c" }]);
  });

  it("resolves toBlock='latest' via getBlockNumber()", async () => {
    mockGetBlockNumber.mockResolvedValueOnce(500n);
    mockGetLogs.mockResolvedValueOnce([]);

    await getLogsPaginated({
      address: "0x123",
      event: mockEvent,
      fromBlock: 0n,
      toBlock: "latest",
    });

    expect(mockGetBlockNumber).toHaveBeenCalledTimes(1);
    expect(mockGetLogs).toHaveBeenCalledWith(
      expect.objectContaining({ toBlock: 500n }),
    );
  });

  it("accumulates logs from all pages into flat array", async () => {
    mockGetLogs
      .mockResolvedValueOnce([{ a: 1 }, { a: 2 }])
      .mockResolvedValueOnce([{ a: 3 }]);

    const result = await getLogsPaginated({
      address: "0x123",
      event: mockEvent,
      fromBlock: 0n,
      toBlock: 15000n,
    });

    expect(result).toHaveLength(3);
    expect(result).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it("returns empty array when no logs found", async () => {
    mockGetLogs.mockResolvedValueOnce([]);

    const result = await getLogsPaginated({
      address: "0x123",
      event: mockEvent,
      fromBlock: 100n,
      toBlock: 200n,
    });

    expect(result).toEqual([]);
  });

  it("passes args when provided", async () => {
    mockGetLogs.mockResolvedValueOnce([]);

    await getLogsPaginated({
      address: "0x123",
      event: mockEvent,
      args: { sender: "0xabc" },
      fromBlock: 0n,
      toBlock: 100n,
    });

    expect(mockGetLogs).toHaveBeenCalledWith(
      expect.objectContaining({ args: { sender: "0xabc" } }),
    );
  });
});

describe("getBlockTimestamps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deduplicates block numbers before calling getBlock", async () => {
    const logs = [
      { blockNumber: 100n },
      { blockNumber: 200n },
      { blockNumber: 100n }, // duplicate
    ];

    mockGetBlock
      .mockResolvedValueOnce({ number: 100n, timestamp: 1000n })
      .mockResolvedValueOnce({ number: 200n, timestamp: 2000n });

    const result = await getBlockTimestamps(logs);

    expect(mockGetBlock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      "100": 1000,
      "200": 2000,
    });
  });

  it("returns empty object for empty logs", async () => {
    const result = await getBlockTimestamps([]);
    expect(result).toEqual({});
    expect(mockGetBlock).not.toHaveBeenCalled();
  });
});
