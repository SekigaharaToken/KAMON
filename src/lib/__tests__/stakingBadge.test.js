import { describe, it, expect } from "vitest";
import { getStakingWeeks, getBadgeProgress } from "@/lib/stakingBadge.js";
import { STAKING_BADGE_WEEKS } from "@/config/season.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

describe("getStakingWeeks", () => {
  it("returns 0 for null timestamp", () => {
    expect(getStakingWeeks(null)).toBe(0);
  });

  it("returns 0 for undefined timestamp", () => {
    expect(getStakingWeeks(undefined)).toBe(0);
  });

  it("returns 0 for a timestamp in the future", () => {
    const future = Date.now() + WEEK_MS;
    expect(getStakingWeeks(future)).toBe(0);
  });

  it("returns 0 when staked less than 1 full week ago", () => {
    const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;
    expect(getStakingWeeks(sixDaysAgo)).toBe(0);
  });

  it("returns 1 after exactly 1 week", () => {
    const oneWeekAgo = Date.now() - WEEK_MS;
    expect(getStakingWeeks(oneWeekAgo)).toBe(1);
  });

  it("returns 1 after 1 week and 6 days (not yet 2 full weeks)", () => {
    const thirteenDaysAgo = Date.now() - 13 * 24 * 60 * 60 * 1000;
    expect(getStakingWeeks(thirteenDaysAgo)).toBe(1);
  });

  it("returns 2 after exactly 2 weeks", () => {
    const twoWeeksAgo = Date.now() - 2 * WEEK_MS;
    expect(getStakingWeeks(twoWeeksAgo)).toBe(2);
  });

  it("returns 4 after exactly 4 weeks", () => {
    const fourWeeksAgo = Date.now() - 4 * WEEK_MS;
    expect(getStakingWeeks(fourWeeksAgo)).toBe(4);
  });

  it("returns 10 after 10 weeks", () => {
    const tenWeeksAgo = Date.now() - 10 * WEEK_MS;
    expect(getStakingWeeks(tenWeeksAgo)).toBe(10);
  });

  it("accepts a BigInt timestamp (seconds)", () => {
    const oneWeekAgoSeconds = BigInt(Math.floor((Date.now() - WEEK_MS) / 1000));
    expect(getStakingWeeks(oneWeekAgoSeconds)).toBe(1);
  });
});

describe("getBadgeProgress", () => {
  it("returns all zero/false for null timestamp", () => {
    const result = getBadgeProgress(null);
    expect(result.weeks).toBe(0);
    expect(result.threshold).toBe(STAKING_BADGE_WEEKS);
    expect(result.earned).toBe(false);
    expect(result.progress).toBe(0);
  });

  it("returns correct shape for 0 weeks", () => {
    const result = getBadgeProgress(Date.now());
    expect(result).toMatchObject({
      weeks: 0,
      threshold: STAKING_BADGE_WEEKS,
      earned: false,
      progress: 0,
    });
  });

  it("returns progress 0.5 after 2 weeks (threshold is 4)", () => {
    const twoWeeksAgo = Date.now() - 2 * WEEK_MS;
    const result = getBadgeProgress(twoWeeksAgo);
    expect(result.weeks).toBe(2);
    expect(result.threshold).toBe(4);
    expect(result.earned).toBe(false);
    expect(result.progress).toBeCloseTo(0.5);
  });

  it("returns progress 0.25 after 1 week", () => {
    const oneWeekAgo = Date.now() - WEEK_MS;
    const result = getBadgeProgress(oneWeekAgo);
    expect(result.progress).toBeCloseTo(0.25);
    expect(result.earned).toBe(false);
  });

  it("returns earned=true and progress=1 after 4 weeks", () => {
    const fourWeeksAgo = Date.now() - 4 * WEEK_MS;
    const result = getBadgeProgress(fourWeeksAgo);
    expect(result.weeks).toBe(4);
    expect(result.earned).toBe(true);
    expect(result.progress).toBe(1);
  });

  it("clamps progress to 1 even if staked longer than threshold", () => {
    const eightWeeksAgo = Date.now() - 8 * WEEK_MS;
    const result = getBadgeProgress(eightWeeksAgo);
    expect(result.weeks).toBe(8);
    expect(result.earned).toBe(true);
    expect(result.progress).toBe(1);
  });

  it("returns earned=true when weeks exactly equals threshold", () => {
    const exactlyFourWeeksAgo = Date.now() - STAKING_BADGE_WEEKS * WEEK_MS;
    const result = getBadgeProgress(exactlyFourWeeksAgo);
    expect(result.earned).toBe(true);
  });
});
