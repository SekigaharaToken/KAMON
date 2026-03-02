import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock child components to avoid deep dependency tree
vi.mock("@/components/leaderboard/Leaderboard.jsx", () => ({
  Leaderboard: ({ rankings, lastUpdated }) => (
    <div
      data-testid="leaderboard"
      data-rankings={rankings?.length}
      data-last-updated={lastUpdated}
    >
      Leaderboard
    </div>
  ),
}));

vi.mock("@/components/leaderboard/PreviousWinner.jsx", () => ({
  PreviousWinner: ({ winner }) => (
    <div data-testid="previous-winner" data-house-id={winner?.houseId ?? ""}>
      {winner ? `PreviousWinner:${winner.houseId}` : null}
    </div>
  ),
}));

// Mock useLeaderboard hook
vi.mock("@/hooks/useLeaderboard.js", () => ({
  useLeaderboard: vi.fn(),
}));

// Mock seasonHistory to control localStorage reads
vi.mock("@/lib/seasonHistory.js", () => ({
  getPreviousWinner: vi.fn(),
  savePreviousWinner: vi.fn(),
}));

import { useLeaderboard } from "@/hooks/useLeaderboard.js";
import { getPreviousWinner, savePreviousWinner } from "@/lib/seasonHistory.js";
import LeaderboardPage from "@/pages/LeaderboardPage.jsx";

beforeEach(() => {
  vi.clearAllMocks();
  getPreviousWinner.mockReturnValue(null);
});

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
    // Loading skeleton should be visible — Leaderboard not rendered during load
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
    // Should show an error message, not the leaderboard
    expect(screen.queryByTestId("leaderboard")).not.toBeInTheDocument();
  });

  it("renders PreviousWinner component above the leaderboard", () => {
    useLeaderboard.mockReturnValue({
      rankings: [],
      isLoading: false,
      isError: false,
      lastUpdated: null,
    });

    render(<LeaderboardPage />, { wrapper: TestWrapper });
    const previousWinner = screen.getByTestId("previous-winner");
    const leaderboard = screen.getByTestId("leaderboard");
    expect(previousWinner).toBeInTheDocument();
    expect(leaderboard).toBeInTheDocument();

    // previous-winner should appear before leaderboard in DOM order
    expect(previousWinner.compareDocumentPosition(leaderboard)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("passes null winner to PreviousWinner when no previous winner stored", () => {
    getPreviousWinner.mockReturnValue(null);

    useLeaderboard.mockReturnValue({
      rankings: [],
      isLoading: false,
      isError: false,
      lastUpdated: null,
    });

    render(<LeaderboardPage />, { wrapper: TestWrapper });
    const pw = screen.getByTestId("previous-winner");
    expect(pw).toHaveAttribute("data-house-id", "");
  });

  it("passes winner data to PreviousWinner when previous winner is stored", () => {
    getPreviousWinner.mockReturnValue({
      seasonId: 1,
      winner: { houseId: "honoo", score: 480, memberCount: 42 },
    });

    useLeaderboard.mockReturnValue({
      rankings: [],
      isLoading: false,
      isError: false,
      lastUpdated: null,
    });

    render(<LeaderboardPage />, { wrapper: TestWrapper });
    const pw = screen.getByTestId("previous-winner");
    expect(pw).toHaveAttribute("data-house-id", "honoo");
    expect(pw).toHaveTextContent("PreviousWinner:honoo");
  });

  it("saves #1 ranked house as previous winner when rankings exist", () => {
    const mockRankings = [
      { house: { id: "mizu" }, memberCount: 15, score: 320 },
      { house: { id: "honoo" }, memberCount: 10, score: 200 },
    ];

    useLeaderboard.mockReturnValue({
      rankings: mockRankings,
      seasonStatus: "ended",
      isLoading: false,
      isError: false,
      lastUpdated: null,
    });

    render(<LeaderboardPage />, { wrapper: TestWrapper });

    // savePreviousWinner should have been called with the first-ranked house
    expect(savePreviousWinner).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ houseId: "mizu" }),
    );
  });
});
