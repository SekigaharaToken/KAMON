/**
 * getHouseHolders — enumerate NFT holders from Transfer events.
 * TDD: tests written first.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/getLogsPaginated.js", () => ({
  getLogsPaginated: vi.fn(),
}));

vi.mock("@/config/chains.js", () => ({
  activeChain: { id: 8453, name: "Base" },
  isLocalDev: false,
}));

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({ readContract: vi.fn() })),
    http: vi.fn(),
    parseAbiItem: vi.fn((sig) => sig),
  };
});

import { getLogsPaginated } from "@/lib/getLogsPaginated.js";
import { getHouseHolders } from "@/lib/getHouseHolders.js";

describe("getHouseHolders", () => {
  let mockClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = { readContract: vi.fn() };
  });

  it("returns empty array when tokenAddress is falsy", async () => {
    const holders = await getHouseHolders("");
    expect(holders).toEqual([]);
    expect(getLogsPaginated).not.toHaveBeenCalled();
  });

  it("returns empty array when tokenAddress is null", async () => {
    const holders = await getHouseHolders(null);
    expect(holders).toEqual([]);
  });

  it("returns empty array when no transfer events found", async () => {
    getLogsPaginated.mockResolvedValue([]);

    const holders = await getHouseHolders("0xtoken", mockClient);
    expect(holders).toEqual([]);
  });

  it("returns deduplicated holder addresses from mint events", async () => {
    const mintLogs = [
      { args: { to: "0xaaa" } },
      { args: { to: "0xbbb" } },
      { args: { to: "0xaaa" } }, // duplicate — same holder minted twice
    ];
    getLogsPaginated.mockResolvedValue(mintLogs);
    mockClient.readContract
      .mockResolvedValueOnce(2n) // 0xaaa — balance > 0
      .mockResolvedValueOnce(1n); // 0xbbb — balance > 0

    const holders = await getHouseHolders("0xtoken", mockClient);
    expect(holders).toHaveLength(2);
    expect(holders).toContain("0xaaa");
    expect(holders).toContain("0xbbb");
  });

  it("filters out addresses with zero balance", async () => {
    const mintLogs = [
      { args: { to: "0xaaa" } },
      { args: { to: "0xbbb" } },
    ];
    getLogsPaginated.mockResolvedValue(mintLogs);
    // 0xaaa sold all tokens (balance 0), 0xbbb still holds
    mockClient.readContract
      .mockResolvedValueOnce(0n) // 0xaaa — balance zero, exclude
      .mockResolvedValueOnce(1n); // 0xbbb — still holds

    const holders = await getHouseHolders("0xtoken", mockClient);
    expect(holders).toHaveLength(1);
    expect(holders).toContain("0xbbb");
    expect(holders).not.toContain("0xaaa");
  });

  it("handles readContract errors gracefully by excluding the address", async () => {
    const mintLogs = [
      { args: { to: "0xaaa" } },
      { args: { to: "0xbbb" } },
    ];
    getLogsPaginated.mockResolvedValue(mintLogs);
    mockClient.readContract
      .mockRejectedValueOnce(new Error("RPC error")) // 0xaaa — rejected, exclude
      .mockResolvedValueOnce(1n); // 0xbbb — include

    const holders = await getHouseHolders("0xtoken", mockClient);
    expect(holders).toHaveLength(1);
    expect(holders).toContain("0xbbb");
  });

  it("ignores zero address in transfer logs", async () => {
    const mintLogs = [
      { args: { to: "0x0000000000000000000000000000000000000000" } },
      { args: { to: "0xaaa" } },
    ];
    getLogsPaginated.mockResolvedValue(mintLogs);
    mockClient.readContract.mockResolvedValueOnce(1n); // 0xaaa — balance > 0

    const holders = await getHouseHolders("0xtoken", mockClient);
    expect(holders).toHaveLength(1);
    expect(holders).toContain("0xaaa");
  });
});
