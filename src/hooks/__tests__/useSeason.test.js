import { describe, it, expect } from "vitest";
import {
  getSeasonStatus,
  getWeekNumber,
  getTimeRemaining,
  getSeasonProgress,
} from "@/hooks/useSeason.js";
import { SEASON_ACTIVE_WEEKS } from "@/config/season.js";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

describe("getSeasonStatus", () => {
  it("returns 'active' during active weeks", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 5; // 5 weeks in
    expect(getSeasonStatus(startTime)).toBe("active");
  });

  it("returns 'cooldown' during cooldown week", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 12.5; // 12.5 weeks in
    expect(getSeasonStatus(startTime)).toBe("cooldown");
  });

  it("returns 'ended' after cooldown", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 14; // 14 weeks in
    expect(getSeasonStatus(startTime)).toBe("ended");
  });

  it("returns 'active' at the very start", () => {
    const startTime = Date.now(); // just started
    expect(getSeasonStatus(startTime)).toBe("active");
  });
});

describe("getWeekNumber", () => {
  it("returns 1 in the first week", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 0.5; // half week in
    expect(getWeekNumber(startTime)).toBe(1);
  });

  it("returns 6 in the sixth week", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 5.5;
    expect(getWeekNumber(startTime)).toBe(6);
  });

  it("returns 12 in the last active week", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 11.5;
    expect(getWeekNumber(startTime)).toBe(12);
  });

  it("caps at SEASON_ACTIVE_WEEKS", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 15;
    expect(getWeekNumber(startTime)).toBe(SEASON_ACTIVE_WEEKS);
  });
});

describe("getTimeRemaining", () => {
  it("returns positive ms during active season", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 5;
    const remaining = getTimeRemaining(startTime);
    expect(remaining).toBeGreaterThan(0);
  });

  it("returns 0 when season is over", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 14;
    expect(getTimeRemaining(startTime)).toBe(0);
  });

  it("returns approximately 7 weeks for halfway through", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 5;
    const remaining = getTimeRemaining(startTime);
    const expectedApprox = ONE_WEEK_MS * 7;
    expect(remaining).toBeGreaterThan(expectedApprox - ONE_WEEK_MS);
    expect(remaining).toBeLessThan(expectedApprox + ONE_WEEK_MS);
  });
});

describe("getSeasonProgress", () => {
  it("returns 0 at start", () => {
    const startTime = Date.now();
    expect(getSeasonProgress(startTime)).toBeCloseTo(0, 0);
  });

  it("returns ~50 halfway through", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 6;
    expect(getSeasonProgress(startTime)).toBeCloseTo(50, -1);
  });

  it("returns 100 when season is over", () => {
    const startTime = Date.now() - ONE_WEEK_MS * 14;
    expect(getSeasonProgress(startTime)).toBe(100);
  });
});
