import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock StakingPool to avoid deep dependency tree
vi.mock("@/components/staking/StakingPool.jsx", () => ({
  StakingPool: () => <div data-testid="staking-pool">StakingPool</div>,
}));

import StakingPage from "@/pages/StakingPage.jsx";

describe("StakingPage", () => {
  it("renders without crashing", () => {
    render(<StakingPage />, { wrapper: TestWrapper });
    expect(screen.getByTestId("staking-pool")).toBeInTheDocument();
  });

  it("renders staking title", () => {
    render(<StakingPage />, { wrapper: TestWrapper });
    // i18n key "staking.title"
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });
});
