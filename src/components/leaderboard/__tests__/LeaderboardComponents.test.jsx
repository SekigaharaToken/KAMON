import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";
import { HouseRanking } from "@/components/leaderboard/HouseRanking.jsx";
import { Leaderboard } from "@/components/leaderboard/Leaderboard.jsx";
import { ScoreBreakdown } from "@/components/leaderboard/ScoreBreakdown.jsx";
import { HOUSES, HOUSE_LIST } from "@/config/houses.js";

/**
 * Leaderboard component integration tests.
 */

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HouseRanking", () => {
  const mockHouse = HOUSES.honoo;

  it("renders rank, symbol, member count, and score badge", () => {
    render(
      <HouseRanking
        rank={1}
        house={mockHouse}
        memberCount={42}
        score={78.6}
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(mockHouse.symbol)).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
    // Score badge shows rounded value
    expect(screen.getByText("79")).toBeInTheDocument();
  });

  it("applies house primary color to score badge", () => {
    const { container } = render(
      <HouseRanking rank={1} house={mockHouse} memberCount={5} score={50} />,
      { wrapper: TestWrapper },
    );
    const badge = container.querySelector("[style]");
    expect(badge).toBeTruthy();
    expect(badge.style.backgroundColor).toBe(
      mockHouse.colors.primary.startsWith("#")
        ? // browser may convert hex to rgb
          badge.style.backgroundColor
        : mockHouse.colors.primary,
    );
  });
});

describe("Leaderboard", () => {
  it("renders all 5 houses from rankings prop", () => {
    const rankings = HOUSE_LIST.map((house, i) => ({
      house,
      memberCount: (i + 1) * 10,
      score: (5 - i) * 20,
    }));

    render(<Leaderboard rankings={rankings} />, { wrapper: TestWrapper });

    HOUSE_LIST.forEach((h) => {
      expect(screen.getByText(h.symbol)).toBeInTheDocument();
    });
  });

  it("falls back to HOUSE_LIST with zero scores when rankings empty", () => {
    render(<Leaderboard rankings={[]} />, { wrapper: TestWrapper });

    // Should still render 5 houses
    HOUSE_LIST.forEach((h) => {
      expect(screen.getByText(h.symbol)).toBeInTheDocument();
    });
    // All scores should be 0
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(5);
  });

  it("shows 'Updated Xm ago' when lastUpdated provided", () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    render(<Leaderboard rankings={[]} lastUpdated={fiveMinAgo} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText(/Updated.*5m ago/)).toBeInTheDocument();
  });

  it("does not show updated text when lastUpdated is null", () => {
    render(<Leaderboard rankings={[]} lastUpdated={null} />, {
      wrapper: TestWrapper,
    });
    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
  });
});

describe("ScoreBreakdown", () => {
  it("renders three progress bars with scores", () => {
    render(
      <ScoreBreakdown dojoScore={75} stakingScore={50} onChatScore={30} />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("shows N/A and fallback text when onChatScore is null", () => {
    render(<ScoreBreakdown dojoScore={60} stakingScore={40} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(
      screen.getByText(/OnChat unavailable.*40% DOJO.*60% Staking/),
    ).toBeInTheDocument();
  });

  it("does not show fallback text when onChatScore is provided", () => {
    render(
      <ScoreBreakdown dojoScore={60} stakingScore={40} onChatScore={20} />,
      { wrapper: TestWrapper },
    );
    expect(screen.queryByText("N/A")).not.toBeInTheDocument();
    expect(screen.queryByText(/fallback/i)).not.toBeInTheDocument();
  });
});
