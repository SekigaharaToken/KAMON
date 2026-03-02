import { describe, it, expect } from "vitest";
import { SEASON_NUMBER, SEASON_ACTIVE_WEEKS, LEADERBOARD_CACHE_TTL, SCORING_WEIGHTS } from "@/config/season.js";

describe("season config", () => {
  it("exports SEASON_NUMBER as a positive number", () => {
    expect(typeof SEASON_NUMBER).toBe("number");
    expect(SEASON_NUMBER).toBeGreaterThanOrEqual(1);
  });

  it("defaults SEASON_NUMBER to 1 when env var is not set", () => {
    // In test env, VITE_SEASON_NUMBER is not set — should default to 1
    expect(SEASON_NUMBER).toBe(1);
  });

  it("exports other season constants", () => {
    expect(SEASON_ACTIVE_WEEKS).toBe(12);
    expect(LEADERBOARD_CACHE_TTL).toBe(15 * 60 * 1000);
    expect(SCORING_WEIGHTS.dojo).toBe(0.40);
  });
});
