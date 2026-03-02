import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  getLeaderboardCache,
  setLeaderboardCache,
  isLeaderboardCacheValid,
  useLeaderboard,
} from "@/hooks/useLeaderboard.js";
import { LEADERBOARD_CACHE_KEY, LEADERBOARD_CACHE_TTL } from "@/config/season.js";

// Mock computeLeaderboard so the hook can be tested in isolation
vi.mock("@/lib/computeLeaderboard.js", () => ({
  computeLeaderboard: vi.fn(),
}));

import { computeLeaderboard } from "@/lib/computeLeaderboard.js";

const MOCK_RANKINGS = [
  { house: { id: "honoo" }, memberCount: 2, score: 80, totalStaked: 100, lastUpdated: Date.now() },
  { house: { id: "mizu" }, memberCount: 1, score: 40, totalStaked: 50, lastUpdated: Date.now() },
];

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

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

describe("useLeaderboard — hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("returns loading state initially", () => {
    computeLeaderboard.mockResolvedValue(MOCK_RANKINGS);

    const { result } = renderHook(() => useLeaderboard(), {
      wrapper: makeWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.rankings).toEqual([]);
  });

  it("returns rankings after successful fetch", async () => {
    computeLeaderboard.mockResolvedValue(MOCK_RANKINGS);

    const { result } = renderHook(() => useLeaderboard(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rankings).toEqual(MOCK_RANKINGS);
    expect(result.current.isError).toBe(false);
  });

  it("caches result in localStorage after fetch", async () => {
    computeLeaderboard.mockResolvedValue(MOCK_RANKINGS);

    const { result } = renderHook(() => useLeaderboard(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Cache should be populated
    expect(isLeaderboardCacheValid()).toBe(true);
    const cached = getLeaderboardCache();
    expect(cached.rankings).toEqual(MOCK_RANKINGS);
  });

  it("returns cached data without calling computeLeaderboard when cache is valid", async () => {
    // Pre-populate cache
    setLeaderboardCache({ rankings: MOCK_RANKINGS });

    const { result } = renderHook(() => useLeaderboard(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should use cache, not call computeLeaderboard
    expect(computeLeaderboard).not.toHaveBeenCalled();
    expect(result.current.rankings).toEqual(MOCK_RANKINGS);
  });

  it("calls computeLeaderboard when cache is expired", async () => {
    // Set expired cache
    const expired = {
      rankings: MOCK_RANKINGS,
      lastUpdated: Date.now() - LEADERBOARD_CACHE_TTL - 1000,
    };
    localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(expired));

    computeLeaderboard.mockResolvedValue(MOCK_RANKINGS);

    const { result } = renderHook(() => useLeaderboard(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(computeLeaderboard).toHaveBeenCalledOnce();
  });

  it("returns isError and empty rankings when computeLeaderboard throws", async () => {
    computeLeaderboard.mockRejectedValue(new Error("Pipeline failed"));

    const { result } = renderHook(() => useLeaderboard(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.rankings).toEqual([]);
  });
});
