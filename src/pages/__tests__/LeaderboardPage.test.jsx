import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock child component to avoid deep dependency tree
vi.mock("@/components/leaderboard/Leaderboard.jsx", () => ({
  Leaderboard: ({ rankings, lastUpdated }) => (
    <div data-testid="leaderboard" data-rankings={rankings?.length} data-last-updated={lastUpdated}>
      Leaderboard
    </div>
  ),
}));

// Mock useLeaderboard hook
vi.mock("@/hooks/useLeaderboard.js", () => ({
  useLeaderboard: vi.fn(),
}));

import { useLeaderboard } from "@/hooks/useLeaderboard.js";
import LeaderboardPage from "@/pages/LeaderboardPage.jsx";

describe("LeaderboardPage", () => {
  it("renders without crashing", () => {
    useLeaderboard.mockReturnValue({
      rankings: [],
      isLoading: false,
      isError: false,
      lastUpdated: null,
    });

    render(<LeaderboardPage />, { wrapper: TestWrapper });
    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
  });

  it("passes rankings to Leaderboard component", () => {
    const mockRankings = [
      { house: { id: "honoo" }, memberCount: 2, score: 80 },
      { house: { id: "mizu" }, memberCount: 1, score: 40 },
    ];

    useLeaderboard.mockReturnValue({
      rankings: mockRankings,
      isLoading: false,
      isError: false,
      lastUpdated: 1234567890,
    });

    render(<LeaderboardPage />, { wrapper: TestWrapper });
    const leaderboard = screen.getByTestId("leaderboard");
    expect(leaderboard).toHaveAttribute("data-rankings", "2");
    expect(leaderboard).toHaveAttribute("data-last-updated", "1234567890");
  });

  it("shows loading state when isLoading is true", () => {
    useLeaderboard.mockReturnValue({
      rankings: [],
      isLoading: true,
      isError: false,
      lastUpdated: null,
    });

    render(<LeaderboardPage />, { wrapper: TestWrapper });
    // Loading skeleton or spinner should be visible — Leaderboard not rendered during load
    expect(screen.queryByTestId("leaderboard")).not.toBeInTheDocument();
  });

  it("shows error state when isError is true", () => {
    useLeaderboard.mockReturnValue({
      rankings: [],
      isLoading: false,
      isError: true,
      lastUpdated: null,
    });

    render(<LeaderboardPage />, { wrapper: TestWrapper });
    // Should show an error message
    expect(screen.queryByTestId("leaderboard")).not.toBeInTheDocument();
  });
});
