import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";
import { StakingBadge } from "@/components/staking/StakingBadge.jsx";

describe("StakingBadge", () => {
  it("renders without crashing", () => {
    render(
      <StakingBadge weeks={0} threshold={4} earned={false} progress={0} />,
      { wrapper: TestWrapper },
    );
  });

  it("shows week count and threshold", () => {
    render(
      <StakingBadge weeks={2} threshold={4} earned={false} progress={0.5} />,
      { wrapper: TestWrapper },
    );
    // i18n key staking.badgeProgress: "Staking Badge: Week 2 of 4"
    expect(screen.getByText(/Week 2 of 4/i)).toBeInTheDocument();
  });

  it("shows earned state when earned=true", () => {
    render(
      <StakingBadge weeks={4} threshold={4} earned progress={1} />,
      { wrapper: TestWrapper },
    );
    // staking.badgeEarned key should appear
    expect(screen.getByText(/Staking Badge Earned/i)).toBeInTheDocument();
  });

  it("does not show earned text when earned=false", () => {
    render(
      <StakingBadge weeks={2} threshold={4} earned={false} progress={0.5} />,
      { wrapper: TestWrapper },
    );
    expect(screen.queryByText(/Staking Badge Earned/i)).not.toBeInTheDocument();
  });

  it("shows description text (threshold interpolated)", () => {
    render(
      <StakingBadge weeks={1} threshold={4} earned={false} progress={0.25} />,
      { wrapper: TestWrapper },
    );
    // staking.badgeDescription should be visible
    expect(screen.getByText(/4 weeks/i)).toBeInTheDocument();
  });

  it("renders a progress bar element", () => {
    render(
      <StakingBadge weeks={2} threshold={4} earned={false} progress={0.5} />,
      { wrapper: TestWrapper },
    );
    // Should have a progressbar role or an element with specific data-testid
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toBeInTheDocument();
  });

  it("progress bar has aria-valuenow matching weeks", () => {
    render(
      <StakingBadge weeks={3} threshold={4} earned={false} progress={0.75} />,
      { wrapper: TestWrapper },
    );
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "3");
  });

  it("progress bar has aria-valuemax matching threshold", () => {
    render(
      <StakingBadge weeks={3} threshold={4} earned={false} progress={0.75} />,
      { wrapper: TestWrapper },
    );
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuemax", "4");
  });

  it("applies earned visual class when earned=true", () => {
    const { container } = render(
      <StakingBadge weeks={4} threshold={4} earned progress={1} />,
      { wrapper: TestWrapper },
    );
    // The top-level card should have a gold/earned indicator class
    expect(container.querySelector(".badge-earned")).toBeInTheDocument();
  });
});
