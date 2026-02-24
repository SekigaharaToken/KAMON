import { describe, it, expect, vi } from "vitest";

/**
 * useEASStreaks tests — verify DojoResolver contract reads.
 *
 * Mocks viem's readContract since we can't hit real contracts in tests.
 */

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: vi.fn(),
    })),
  };
});

vi.mock("@/config/contracts.js", () => ({
  DOJO_RESOLVER_ADDRESS: "0x1234567890abcdef1234567890abcdef12345678",
}));

const {
  getCurrentStreak,
  getLongestStreak,
  getLastCheckIn,
  isStreakAtRisk,
} = await import("@/hooks/useEASStreaks.js");

const TEST_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("useEASStreaks — getCurrentStreak", () => {
  it("is a function", () => {
    expect(typeof getCurrentStreak).toBe("function");
  });

  it("returns null for missing wallet", async () => {
    const result = await getCurrentStreak(null);
    expect(result).toBeNull();
  });
});

describe("useEASStreaks — getLongestStreak", () => {
  it("is a function", () => {
    expect(typeof getLongestStreak).toBe("function");
  });

  it("returns null for missing wallet", async () => {
    const result = await getLongestStreak(null);
    expect(result).toBeNull();
  });
});

describe("useEASStreaks — getLastCheckIn", () => {
  it("is a function", () => {
    expect(typeof getLastCheckIn).toBe("function");
  });

  it("returns null for missing wallet", async () => {
    const result = await getLastCheckIn(null);
    expect(result).toBeNull();
  });
});

describe("useEASStreaks — isStreakAtRisk", () => {
  it("returns true when last check-in > 23 hours ago", () => {
    const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - 24 * 3600;
    expect(isStreakAtRisk(twentyFourHoursAgo)).toBe(true);
  });

  it("returns false when last check-in < 23 hours ago", () => {
    const tenHoursAgo = Math.floor(Date.now() / 1000) - 10 * 3600;
    expect(isStreakAtRisk(tenHoursAgo)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isStreakAtRisk(null)).toBe(false);
  });
});
