import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";
import { StreakMeter } from "@/components/activity/StreakMeter.jsx";
import { StakingMeter } from "@/components/activity/StakingMeter.jsx";
import { OnChatCount } from "@/components/activity/OnChatCount.jsx";
import { MyActivity } from "@/components/activity/MyActivity.jsx";

/**
 * Activity component integration tests.
 * Renders each component with realistic props and verifies display.
 */

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StreakMeter", () => {
  it("renders streak days", () => {
    render(<StreakMeter currentStreak={15} longestStreak={22} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText(/Longest.*22/)).toBeInTheDocument();
  });

  it("shows At Risk badge when isAtRisk is true", () => {
    render(<StreakMeter currentStreak={5} isAtRisk={true} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText("At Risk")).toBeInTheDocument();
  });

  it("hides At Risk badge when isAtRisk is false", () => {
    render(<StreakMeter currentStreak={5} isAtRisk={false} />, {
      wrapper: TestWrapper,
    });
    expect(screen.queryByText("At Risk")).not.toBeInTheDocument();
  });
});

describe("StakingMeter", () => {
  it("renders staked amount and pending rewards", () => {
    render(<StakingMeter staked="5000" pendingRewards="120" />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText("5000")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("shows Claim Rewards button when pendingRewards > 0", () => {
    render(<StakingMeter staked="1000" pendingRewards="50.5" />, {
      wrapper: TestWrapper,
    });
    const link = screen.getByRole("link", { name: /Claim Rewards/i });
    expect(link).toHaveAttribute("href", "/staking?tab=claim");
  });

  it("hides Claim Rewards button when pendingRewards is 0", () => {
    render(<StakingMeter staked="1000" pendingRewards="0" />, {
      wrapper: TestWrapper,
    });
    expect(screen.queryByRole("link", { name: /Claim Rewards/i })).not.toBeInTheDocument();
  });

  it("renders numbers with mono font", () => {
    const { container } = render(
      <StakingMeter staked="5000" pendingRewards="120" />,
      { wrapper: TestWrapper },
    );
    const monos = container.querySelectorAll(".font-mono");
    expect(monos.length).toBeGreaterThanOrEqual(2);
  });
});

describe("OnChatCount", () => {
  it("renders message count and percentage when available", () => {
    render(<OnChatCount messageCount={42} percentage={15} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/15%/)).toBeInTheDocument();
  });

  it("shows Skeleton placeholders when isLoading and no data", () => {
    const { container } = render(
      <OnChatCount messageCount={null} isLoading={true} />,
      { wrapper: TestWrapper },
    );
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBe(2);
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
  });

  it("shows Unavailable badge when isLoading=false and no data", () => {
    render(<OnChatCount messageCount={null} isLoading={false} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  it("shows fallback text when messageCount is null and not loading", () => {
    render(<OnChatCount messageCount={null} isLoading={false} />, {
      wrapper: TestWrapper,
    });
    expect(
      screen.getByText(/OnChat data is currently unavailable/),
    ).toBeInTheDocument();
  });

  it("shows data even when isLoading is true (data already resolved)", () => {
    render(<OnChatCount messageCount={42} percentage={15} isLoading={true} />, {
      wrapper: TestWrapper,
    });
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});

describe("MyActivity", () => {
  const baseProps = {
    streak: { current: 10, longest: 20, isAtRisk: false },
    staking: { staked: "3000", pendingRewards: "50" },
    onChat: { messageCount: 8, percentage: 12 },
  };

  it("renders all three sub-components", () => {
    render(<MyActivity {...baseProps} />, { wrapper: TestWrapper });
    // StreakMeter
    expect(screen.getByText("10")).toBeInTheDocument();
    // StakingMeter
    expect(screen.getByText("3000")).toBeInTheDocument();
    // OnChatCount
    expect(screen.getByText("8")).toBeInTheDocument();
  });

});
