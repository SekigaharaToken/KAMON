import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeDojoStreak,
  normalizeStaking,
  normalizeOnChat,
  computeWalletScore,
  computeHouseScore,
  rankHouses,
} from "@/lib/scoring.js";
import {
  setLeaderboardCache,
  getLeaderboardCache,
  isLeaderboardCacheValid,
} from "@/hooks/useLeaderboard.js";

/**
 * Integration test — End-to-end scoring pipeline.
 *
 * Composes normalize → compute → rank → cache in a single flow,
 * verifying the data propagates correctly across module boundaries.
 */

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Scoring pipeline — normalize → compute", () => {
  it("produces correct 40/30/30 weighted score", () => {
    const dojo = normalizeDojoStreak(15); // 15/30 * 100 = 50
    const staking = normalizeStaking(5000, 50000); // 5000/50000 * 100 = 10
    const onChat = normalizeOnChat(10, 50); // 10/50 * 100 = 20

    expect(dojo).toBe(50);
    expect(staking).toBe(10);
    expect(onChat).toBe(20);

    const score = computeWalletScore({
      dojoStreak: 15,
      stakePct: staking,
      onChatPct: onChat,
    });

    // dojo normalized internally: 50 * 0.40 = 20
    // staking: 10 * 0.30 = 3
    // onChat: 20 * 0.30 = 6
    // total = 29
    expect(score).toBeCloseTo(29, 1);
  });

  it("uses 40/60 fallback when onChatPct is null", () => {
    normalizeDojoStreak(15); // 50
    const staking = normalizeStaking(5000, 50000); // 10

    const score = computeWalletScore({
      dojoStreak: 15,
      stakePct: staking,
      onChatPct: null,
    });

    // fallback: dojo 50 * 0.40 = 20, staking 10 * 0.60 = 6 → 26
    expect(score).toBeCloseTo(26, 1);
  });
});

describe("Scoring pipeline — computeHouseScore", () => {
  it("sums multiple wallet scores", () => {
    const scores = [
      computeWalletScore({ dojoStreak: 30, stakePct: 100, onChatPct: 100 }),
      computeWalletScore({ dojoStreak: 0, stakePct: 0, onChatPct: 0 }),
      computeWalletScore({ dojoStreak: 15, stakePct: 50, onChatPct: 50 }),
    ];

    const houseScore = computeHouseScore(scores);

    // first wallet: 100*0.4 + 100*0.3 + 100*0.3 = 100
    // second wallet: 0
    // third wallet: 50*0.4 + 50*0.3 + 50*0.3 = 50
    // total = 150
    expect(houseScore).toBeCloseTo(150, 1);
  });

  it("returns 0 for null input", () => {
    expect(computeHouseScore(null)).toBe(0);
  });
});

describe("Scoring pipeline — rankHouses", () => {
  it("sorts 5 houses descending by score", () => {
    const houses = [
      { id: "honoo", score: 50, totalStaked: 1000 },
      { id: "mizu", score: 80, totalStaked: 500 },
      { id: "mori", score: 30, totalStaked: 2000 },
      { id: "tsuchi", score: 80, totalStaked: 3000 },
      { id: "kaze", score: 10, totalStaked: 100 },
    ];

    const ranked = rankHouses(houses);

    expect(ranked[0].id).toBe("tsuchi"); // 80, higher staked
    expect(ranked[1].id).toBe("mizu"); // 80, lower staked
    expect(ranked[2].id).toBe("honoo"); // 50
    expect(ranked[3].id).toBe("mori"); // 30
    expect(ranked[4].id).toBe("kaze"); // 10
  });

  it("does not mutate original array", () => {
    const houses = [
      { id: "a", score: 10, totalStaked: 0 },
      { id: "b", score: 20, totalStaked: 0 },
    ];
    const original = [...houses];
    rankHouses(houses);
    expect(houses).toEqual(original);
  });
});

describe("Scoring pipeline — leaderboard cache round-trip", () => {
  it("stores and retrieves cache data", () => {
    const data = {
      rankings: [{ id: "honoo", score: 42 }],
      lastUpdated: Date.now(),
    };

    setLeaderboardCache(data);
    const cached = getLeaderboardCache();

    expect(cached).not.toBeNull();
    expect(cached.rankings[0].score).toBe(42);
  });

  it("isLeaderboardCacheValid returns true for fresh cache", () => {
    setLeaderboardCache({ rankings: [] });
    expect(isLeaderboardCacheValid()).toBe(true);
  });

  it("isLeaderboardCacheValid returns false after TTL expires", () => {
    const fifteenMinAgo = Date.now() - 900_001;
    setLeaderboardCache({ rankings: [], lastUpdated: fifteenMinAgo });
    expect(isLeaderboardCacheValid()).toBe(false);
  });

  it("getLeaderboardCache returns null when empty", () => {
    expect(getLeaderboardCache()).toBeNull();
  });
});
