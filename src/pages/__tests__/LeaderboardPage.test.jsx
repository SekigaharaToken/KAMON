import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock child component to avoid deep dependency tree
vi.mock("@/components/leaderboard/Leaderboard.jsx", () => ({
  Leaderboard: () => <div data-testid="leaderboard">Leaderboard</div>,
}));

import LeaderboardPage from "@/pages/LeaderboardPage.jsx";

describe("LeaderboardPage", () => {
  it("renders without crashing", () => {
    render(<LeaderboardPage />, { wrapper: TestWrapper });
    expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
  });
});
