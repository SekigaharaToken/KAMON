import { describe, it, expect } from "vitest";
import {
  normalizeDojoStreak,
  normalizeStaking,
  normalizeOnChat,
  computeWalletScore,
  computeValidatedWalletScore,
  computeHouseScore,
  rankHouses,
} from "@/lib/scoring.js";

describe("normalizeDojoStreak", () => {
  it("returns 0 for zero streak", () => {
    expect(normalizeDojoStreak(0)).toBe(0);
  });

  it("returns 50 for 15-day streak", () => {
    expect(normalizeDojoStreak(15)).toBe(50);
  });

  it("returns 100 for 30-day streak", () => {
    expect(normalizeDojoStreak(30)).toBe(100);
  });

  it("caps at 100 for streaks above 30", () => {
    expect(normalizeDojoStreak(60)).toBe(100);
  });

  it("returns 0 for null/undefined", () => {
    expect(normalizeDojoStreak(null)).toBe(0);
    expect(normalizeDojoStreak(undefined)).toBe(0);
  });
});

describe("normalizeStaking", () => {
  it("returns 0 when totalStake is 0", () => {
    expect(normalizeStaking(100, 0)).toBe(0);
  });

  it("returns 100 when user has all stake", () => {
    expect(normalizeStaking(100, 100)).toBe(100);
  });

  it("returns correct percentage", () => {
    expect(normalizeStaking(50, 1000)).toBe(5);
  });

  it("returns 0 for null userStake", () => {
    expect(normalizeStaking(null, 1000)).toBe(0);
  });
});

describe("normalizeOnChat", () => {
  it("returns 0 for zero messages", () => {
    expect(normalizeOnChat(0, 100)).toBe(0);
  });

  it("returns 100 for max messages", () => {
    expect(normalizeOnChat(100, 100)).toBe(100);
  });

  it("returns 0 for null maxMessages", () => {
    expect(normalizeOnChat(50, 0)).toBe(0);
  });

  it("caps at 100", () => {
    expect(normalizeOnChat(200, 100)).toBe(100);
  });
});

describe("computeWalletScore", () => {
  it("computes 40/30/30 weighted score", () => {
    const score = computeWalletScore({
      dojoStreak: 30, // normalized to 100
      stakePct: 100,
      onChatPct: 100,
    });
    // 100*0.40 + 100*0.30 + 100*0.30 = 100
    expect(score).toBe(100);
  });

  it("returns 0 for all zeros", () => {
    const score = computeWalletScore({
      dojoStreak: 0,
      stakePct: 0,
      onChatPct: 0,
    });
    expect(score).toBe(0);
  });

  it("uses 40/60 fallback when OnChat is null", () => {
    const score = computeWalletScore({
      dojoStreak: 30, // normalized to 100
      stakePct: 100,
      onChatPct: null,
    });
    // 100*0.40 + 100*0.60 = 100
    expect(score).toBe(100);
  });

  it("uses 40/60 fallback when OnChat is undefined", () => {
    const score = computeWalletScore({
      dojoStreak: 15, // normalized to 50
      stakePct: 50,
      onChatPct: undefined,
    });
    // 50*0.40 + 50*0.60 = 50
    expect(score).toBe(50);
  });
});

describe("computeValidatedWalletScore", () => {
  it("returns 0 when isMultiHolder is true", () => {
    const score = computeValidatedWalletScore({
      dojoStreak: 30,
      stakePct: 100,
      onChatPct: 100,
      isMultiHolder: true,
    });
    expect(score).toBe(0);
  });

  it("delegates to computeWalletScore when isMultiHolder is false", () => {
    const validated = computeValidatedWalletScore({
      dojoStreak: 30,
      stakePct: 100,
      onChatPct: 100,
      isMultiHolder: false,
    });
    const normal = computeWalletScore({
      dojoStreak: 30,
      stakePct: 100,
      onChatPct: 100,
    });
    expect(validated).toBe(normal);
    expect(validated).toBe(100);
  });

  it("uses fallback when onChatPct is null and not multi-holder", () => {
    const score = computeValidatedWalletScore({
      dojoStreak: 30,
      stakePct: 100,
      onChatPct: null,
      isMultiHolder: false,
    });
    expect(score).toBe(100); // 100*0.40 + 100*0.60
  });
});

describe("computeHouseScore", () => {
  it("sums all member scores", () => {
    expect(computeHouseScore([10, 20, 30])).toBe(60);
  });

  it("returns 0 for empty array", () => {
    expect(computeHouseScore([])).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(computeHouseScore(null)).toBe(0);
  });
});

describe("rankHouses", () => {
  it("sorts by score descending", () => {
    const houses = [
      { id: "a", score: 10 },
      { id: "b", score: 30 },
      { id: "c", score: 20 },
    ];
    const ranked = rankHouses(houses);
    expect(ranked.map((h) => h.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by totalStaked", () => {
    const houses = [
      { id: "a", score: 50, totalStaked: 100 },
      { id: "b", score: 50, totalStaked: 200 },
    ];
    const ranked = rankHouses(houses);
    expect(ranked[0].id).toBe("b");
  });

  it("does not mutate input", () => {
    const houses = [
      { id: "a", score: 10 },
      { id: "b", score: 20 },
    ];
    const original = [...houses];
    rankHouses(houses);
    expect(houses).toEqual(original);
  });
});
