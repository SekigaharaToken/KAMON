/**
 * computeLeaderboard — full scoring pipeline tests.
 * TDD: tests written first.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all data-fetching dependencies
vi.mock("@/lib/getHouseHolders.js", () => ({
  getHouseHolders: vi.fn(),
}));

vi.mock("@/hooks/useEASStreaks.js", () => ({
  getCurrentStreak: vi.fn(),
}));

vi.mock("@/hooks/useStaking.js", () => ({
  getUserPosition: vi.fn(),
  getPoolState: vi.fn(),
}));

vi.mock("@/hooks/useOnChat.js", () => ({
  getOnChatMessageCount: vi.fn(),
  getOnChatTotalMessages: vi.fn(),
}));

vi.mock("@/config/houses.js", () => ({
  HOUSE_LIST: [
    {
      id: "honoo",
      address: "0xfire",
      symbol: "炎",
      nameKey: "house.honoo",
      colors: { primary: "#c92a22" },
    },
    {
      id: "mizu",
      address: "0xwater",
      symbol: "水",
      nameKey: "house.mizu",
      colors: { primary: "#94bcad" },
    },
  ],
}));

vi.mock("@/config/contracts.js", () => ({
  STAKING_POOL_ADDRESS: "0xpool",
}));

import { getHouseHolders } from "@/lib/getHouseHolders.js";
import { getCurrentStreak } from "@/hooks/useEASStreaks.js";
import { getUserPosition, getPoolState } from "@/hooks/useStaking.js";
import { getOnChatMessageCount, getOnChatTotalMessages } from "@/hooks/useOnChat.js";
import { computeLeaderboard } from "@/lib/computeLeaderboard.js";

describe("computeLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ranked array with all 5 house fields present", async () => {
    getHouseHolders.mockResolvedValue(["0xaaa"]);
    getCurrentStreak.mockResolvedValue(15n);
    getPoolState.mockResolvedValue({ totalStaked: 1000n });
    getUserPosition.mockResolvedValue({ staked: 100n });
    getOnChatMessageCount.mockResolvedValue(10);
    getOnChatTotalMessages.mockResolvedValue(100);

    const result = await computeLeaderboard();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2); // matches mocked HOUSE_LIST
    result.forEach((entry) => {
      expect(entry).toHaveProperty("house");
      expect(entry).toHaveProperty("memberCount");
      expect(entry).toHaveProperty("score");
      expect(entry).toHaveProperty("totalStaked");
      expect(entry).toHaveProperty("lastUpdated");
    });
  });

  it("produces higher rank for house with more members and activity", async () => {
    // honoo: 2 active holders with high streaks
    // mizu: 0 holders
    getHouseHolders
      .mockResolvedValueOnce(["0xaaa", "0xbbb"]) // honoo
      .mockResolvedValueOnce([]); // mizu

    getCurrentStreak
      .mockResolvedValueOnce(30n) // 0xaaa
      .mockResolvedValueOnce(20n); // 0xbbb

    getPoolState.mockResolvedValue({ totalStaked: 1000n });
    getUserPosition
      .mockResolvedValueOnce({ staked: 500n }) // 0xaaa
      .mockResolvedValueOnce({ staked: 300n }); // 0xbbb

    getOnChatMessageCount
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(30);
    getOnChatTotalMessages.mockResolvedValue(100);

    const result = await computeLeaderboard();

    // honoo (index 0 in mocked HOUSE_LIST) should rank first
    expect(result[0].house.id).toBe("honoo");
    expect(result[0].score).toBeGreaterThan(result[1].score);
    expect(result[1].score).toBe(0); // mizu has no holders
  });

  it("falls back to 40/60 scoring when OnChat returns null", async () => {
    getHouseHolders
      .mockResolvedValueOnce(["0xaaa"]) // honoo
      .mockResolvedValueOnce([]); // mizu

    getCurrentStreak.mockResolvedValue(30n); // 100% dojo
    getPoolState.mockResolvedValue({ totalStaked: 100n });
    getUserPosition.mockResolvedValue({ staked: 100n }); // 100% staking

    // OnChat fails for all wallets
    getOnChatMessageCount.mockResolvedValue(null);
    getOnChatTotalMessages.mockResolvedValue(null);

    const result = await computeLeaderboard();

    // With 100% dojo (weight 0.40) and 100% staking (weight 0.60) fallback:
    // normalizeDojoStreak(30) = 100, stakePct = 100
    // score = 100*0.40 + 100*0.60 = 100
    expect(result[0].score).toBeCloseTo(100, 0);
  });

  it("returns zero score for houses with no holders", async () => {
    getHouseHolders.mockResolvedValue([]);
    getPoolState.mockResolvedValue({ totalStaked: 0n });
    getOnChatTotalMessages.mockResolvedValue(null);

    const result = await computeLeaderboard();

    result.forEach((entry) => {
      expect(entry.score).toBe(0);
      expect(entry.memberCount).toBe(0);
    });
  });

  it("includes lastUpdated timestamp in each entry", async () => {
    getHouseHolders.mockResolvedValue([]);
    getPoolState.mockResolvedValue({ totalStaked: 0n });
    getOnChatTotalMessages.mockResolvedValue(null);

    const before = Date.now();
    const result = await computeLeaderboard();
    const after = Date.now();

    result.forEach((entry) => {
      expect(entry.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(entry.lastUpdated).toBeLessThanOrEqual(after);
    });
  });

  it("handles getHouseHolders throwing by returning zero score for that house", async () => {
    getHouseHolders
      .mockRejectedValueOnce(new Error("RPC failure")) // honoo errors
      .mockResolvedValueOnce([]); // mizu ok

    getPoolState.mockResolvedValue({ totalStaked: 0n });
    getOnChatTotalMessages.mockResolvedValue(null);

    const result = await computeLeaderboard();

    // Should not throw, should return 0 for the errored house
    expect(result).toHaveLength(2);
    const honoo = result.find((e) => e.house.id === "honoo");
    expect(honoo.score).toBe(0);
  });

  it("handles getUserPosition returning null by using 0 staking score", async () => {
    getHouseHolders
      .mockResolvedValueOnce(["0xaaa"]) // honoo
      .mockResolvedValueOnce([]); // mizu

    getCurrentStreak.mockResolvedValue(30n); // 100% dojo
    getPoolState.mockResolvedValue({ totalStaked: 100n });
    getUserPosition.mockResolvedValue(null); // no staking position

    getOnChatMessageCount.mockResolvedValue(0);
    getOnChatTotalMessages.mockResolvedValue(100);

    const result = await computeLeaderboard();
    const honoo = result.find((e) => e.house.id === "honoo");

    // score = normalizeDojoStreak(30)*0.40 + 0*0.30 + 0*0.30 = 40
    expect(honoo.score).toBeCloseTo(40, 0);
  });
});
