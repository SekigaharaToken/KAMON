import { describe, it, expect, beforeEach } from "vitest";
import {
  getLeaderboardCache,
  setLeaderboardCache,
  isLeaderboardCacheValid,
} from "@/hooks/useLeaderboard.js";
import { LEADERBOARD_CACHE_KEY, LEADERBOARD_CACHE_TTL } from "@/config/season.js";

describe("useLeaderboard — cache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no cache exists", () => {
    expect(getLeaderboardCache()).toBeNull();
  });

  it("stores and retrieves leaderboard data", () => {
    const data = {
      rankings: [
        { id: "honoo", score: 500 },
        { id: "mizu", score: 400 },
      ],
      lastUpdated: Date.now(),
    };
    setLeaderboardCache(data);

    const cached = getLeaderboardCache();
    expect(cached.rankings).toEqual(data.rankings);
  });

  it("includes timestamp in cache", () => {
    const before = Date.now();
    setLeaderboardCache({ rankings: [] });
    const cached = getLeaderboardCache();
    expect(cached.lastUpdated).toBeGreaterThanOrEqual(before);
  });
});

describe("useLeaderboard — isLeaderboardCacheValid", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns false when no cache exists", () => {
    expect(isLeaderboardCacheValid()).toBe(false);
  });

  it("returns true for fresh cache", () => {
    setLeaderboardCache({ rankings: [] });
    expect(isLeaderboardCacheValid()).toBe(true);
  });

  it("returns false for expired cache", () => {
    const expired = {
      rankings: [],
      lastUpdated: Date.now() - LEADERBOARD_CACHE_TTL - 1000,
    };
    localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(expired));
    expect(isLeaderboardCacheValid()).toBe(false);
  });
});
