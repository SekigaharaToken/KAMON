import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeDojoStreak } from "@/lib/scoring.js";

/**
 * useEASStreaks integration test — exercises readContract with mock values
 * and composes results through the scoring normalizer.
 */

const mockReadContract = vi.fn();

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: mockReadContract,
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
} = await import("@/hooks/useEASStreaks.js");

const TEST_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useEASStreaks integration — readContract returns values", () => {
  it("getCurrentStreak returns bigint from contract", async () => {
    mockReadContract.mockResolvedValueOnce(15n);
    const result = await getCurrentStreak(TEST_WALLET);
    expect(result).toBe(15n);
    expect(mockReadContract).toHaveBeenCalledOnce();
  });

  it("getLongestStreak returns bigint from contract", async () => {
    mockReadContract.mockResolvedValueOnce(22n);
    const result = await getLongestStreak(TEST_WALLET);
    expect(result).toBe(22n);
  });

  it("getLastCheckIn returns timestamp bigint", async () => {
    const ts = BigInt(Math.floor(Date.now() / 1000));
    mockReadContract.mockResolvedValueOnce(ts);
    const result = await getLastCheckIn(TEST_WALLET);
    expect(result).toBe(ts);
  });
});

describe("useEASStreaks integration — error paths", () => {
  it("getCurrentStreak throws on contract error", async () => {
    mockReadContract.mockRejectedValueOnce(new Error("RPC error"));
    await expect(getCurrentStreak(TEST_WALLET)).rejects.toThrow("RPC error");
  });

  it("getLongestStreak throws on contract error", async () => {
    mockReadContract.mockRejectedValueOnce(new Error("RPC error"));
    await expect(getLongestStreak(TEST_WALLET)).rejects.toThrow("RPC error");
  });

  it("getLastCheckIn throws on contract error", async () => {
    mockReadContract.mockRejectedValueOnce(new Error("RPC error"));
    await expect(getLastCheckIn(TEST_WALLET)).rejects.toThrow("RPC error");
  });
});

describe("useEASStreaks integration — compose with scoring", () => {
  it("streak bigint → Number → normalizeDojoStreak", async () => {
    mockReadContract.mockResolvedValueOnce(15n);
    const streak = await getCurrentStreak(TEST_WALLET);
    const normalized = normalizeDojoStreak(Number(streak));
    // 15/30 * 100 = 50
    expect(normalized).toBe(50);
  });

  it("max streak (30+) normalizes to 100", async () => {
    mockReadContract.mockResolvedValueOnce(45n);
    const streak = await getCurrentStreak(TEST_WALLET);
    const normalized = normalizeDojoStreak(Number(streak));
    expect(normalized).toBe(100);
  });

  it("zero streak normalizes to 0", async () => {
    mockReadContract.mockResolvedValueOnce(0n);
    const streak = await getCurrentStreak(TEST_WALLET);
    const normalized = normalizeDojoStreak(Number(streak));
    expect(normalized).toBe(0);
  });
});
