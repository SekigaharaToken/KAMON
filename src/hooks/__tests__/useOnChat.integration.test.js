import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeOnChat, computeWalletScore } from "@/lib/scoring.js";

/**
 * useOnChat integration test — exercises getLogsPaginated mock
 * and composes with scoring normalizers.
 */

const mockGetLogsPaginated = vi.fn();
const mockReadContract = vi.fn();

vi.mock("@/lib/getLogsPaginated.js", () => ({
  getLogsPaginated: (...args) => mockGetLogsPaginated(...args),
}));

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: mockReadContract,
    })),
  };
});

vi.mock("@/config/chains.js", () => ({
  activeChain: { id: 8453, name: "Base" },
  isLocalDev: false,
}));

vi.mock("@/config/contracts.js", () => ({
  ONCHAT_ADDRESS: "0x0000000000000000000000000000000000000001",
}));

vi.mock("@/config/season.js", () => ({
  ONCHAT_CHANNEL_SLUG: "sekigahara",
  SCORING_WEIGHTS: { dojo: 0.4, staking: 0.3, onchat: 0.3 },
  SCORING_WEIGHTS_FALLBACK: { dojo: 0.4, staking: 0.6 },
  MAX_DOJO_STREAK: 30,
  LEADERBOARD_CACHE_KEY: "kamon_leaderboard_cache",
  LEADERBOARD_CACHE_TTL: 900000,
}));

const {
  getOnChatMessageCount,
  getOnChatTotalMessages,
  normalizeOnChatMessages,
  getOnChatFallbackScore,
} = await import("@/hooks/useOnChat.js");

const TEST_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useOnChat integration — message count from logs", () => {
  it("returns count of matching log entries", async () => {
    const fakeLogs = Array.from({ length: 7 }, (_, i) => ({
      blockNumber: BigInt(1000 + i),
      args: { sender: TEST_WALLET },
    }));
    mockGetLogsPaginated.mockResolvedValueOnce(fakeLogs);

    const count = await getOnChatMessageCount(TEST_WALLET, 0n);
    expect(count).toBe(7);
  });

  it("returns null when getLogsPaginated throws", async () => {
    mockGetLogsPaginated.mockRejectedValueOnce(new Error("RPC failed"));
    const count = await getOnChatMessageCount(TEST_WALLET, 0n);
    expect(count).toBeNull();
  });
});

describe("useOnChat integration — total messages from contract", () => {
  it("returns total from readContract", async () => {
    mockReadContract.mockResolvedValueOnce(200n);
    const total = await getOnChatTotalMessages();
    expect(total).toBe(200);
  });

  it("returns null on contract error", async () => {
    mockReadContract.mockRejectedValueOnce(new Error("RPC error"));
    const total = await getOnChatTotalMessages();
    expect(total).toBeNull();
  });
});

describe("useOnChat integration — normalizeOnChatMessages", () => {
  it("computes percentage correctly", () => {
    const pct = normalizeOnChatMessages(10, 50);
    // (10/50) * 100 = 20
    expect(pct).toBe(20);
  });

  it("caps at 100", () => {
    const pct = normalizeOnChatMessages(100, 50);
    expect(pct).toBe(100);
  });

  it("returns 0 for falsy inputs", () => {
    expect(normalizeOnChatMessages(0, 50)).toBe(0);
    expect(normalizeOnChatMessages(null, 50)).toBe(0);
  });
});

describe("useOnChat integration — fallback score", () => {
  it("getOnChatFallbackScore always returns null", () => {
    expect(getOnChatFallbackScore()).toBeNull();
  });
});

describe("useOnChat integration — compose with scoring", () => {
  it("log count → normalize → computeWalletScore", async () => {
    const fakeLogs = Array.from({ length: 10 }, (_, i) => ({
      blockNumber: BigInt(1000 + i),
    }));
    mockGetLogsPaginated.mockResolvedValueOnce(fakeLogs);

    const count = await getOnChatMessageCount(TEST_WALLET, 0n);
    expect(count).toBe(10);

    const pct = normalizeOnChatMessages(count, 50);
    expect(pct).toBe(20);

    const score = computeWalletScore({
      dojoStreak: 15,
      stakePct: 10,
      onChatPct: pct,
    });
    // dojo: 50*0.4=20, staking: 10*0.3=3, onchat: 20*0.3=6 → 29
    expect(score).toBeCloseTo(29, 1);
  });

  it("error → null → fallback scoring (40/60)", async () => {
    mockGetLogsPaginated.mockRejectedValueOnce(new Error("fail"));

    const count = await getOnChatMessageCount(TEST_WALLET, 0n);
    expect(count).toBeNull();

    const fallback = getOnChatFallbackScore();
    expect(fallback).toBeNull();

    const score = computeWalletScore({
      dojoStreak: 15,
      stakePct: 10,
      onChatPct: fallback,
    });
    // fallback: dojo 50*0.4=20, staking 10*0.6=6 → 26
    expect(score).toBeCloseTo(26, 1);
  });
});
