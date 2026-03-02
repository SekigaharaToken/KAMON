import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock child components
vi.mock("@/components/admin/AdminPanel.jsx", () => ({
  AdminPanel: ({ isOperator, seasonStatus, weekNumber }) => (
    <div
      data-testid="admin-panel"
      data-operator={String(isOperator)}
      data-season-status={seasonStatus}
      data-week-number={String(weekNumber)}
    >
      AdminPanel
    </div>
  ),
}));

vi.mock("@/components/admin/SeasonSnapshot.jsx", () => ({
  SeasonSnapshot: ({ rankings }) => (
    <div data-testid="season-snapshot" data-rankings={JSON.stringify(rankings)}>
      SeasonSnapshot
    </div>
  ),
}));

vi.mock("@/components/admin/AirdropTrigger.jsx", () => ({
  AirdropTrigger: ({ winnerMembers }) => (
    <div data-testid="airdrop-trigger" data-members={JSON.stringify(winnerMembers)}>
      AirdropTrigger
    </div>
  ),
}));

// Mock contracts so OPERATOR_ADDRESS is predictable
vi.mock("@/config/contracts.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    OPERATOR_ADDRESS: "0xoperator000000000000000000000000000000001",
    STAKING_POOL_ADDRESS: "0xpool0000000000000000000000000000000000001",
  };
});

// Mock useWalletAddress so we can control the connected address
vi.mock("@/hooks/useWalletAddress.js", () => ({
  useWalletAddress: vi.fn(() => ({ address: null, isConnected: false, canTransact: false })),
}));

// Mock useSeason pure functions
vi.mock("@/hooks/useSeason.js", () => ({
  getSeasonStatus: vi.fn(() => "active"),
  getWeekNumber: vi.fn(() => 3),
  getSeasonProgress: vi.fn(() => 25),
}));

// Mock TanStack Query so pool state resolves synchronously with a fake startTime
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // startTime = 1 (seconds) so startTimeMs = 1000 — safely non-null
    useQuery: vi.fn(() => ({ data: { startTime: 1n }, isLoading: false })),
  };
});

import AdminPage from "@/pages/AdminPage.jsx";
import { useWalletAddress } from "@/hooks/useWalletAddress.js";

describe("AdminPage", () => {
  it("renders without crashing", () => {
    render(<AdminPage />, { wrapper: TestWrapper });
    expect(screen.getByTestId("admin-panel")).toBeInTheDocument();
  });

  it("passes isOperator={false} to AdminPanel when no wallet connected", () => {
    useWalletAddress.mockReturnValue({ address: null, isConnected: false, canTransact: false });
    render(<AdminPage />, { wrapper: TestWrapper });
    const panel = screen.getByTestId("admin-panel");
    expect(panel.dataset.operator).toBe("false");
  });

  it("passes isOperator={false} when connected wallet does not match OPERATOR_ADDRESS", () => {
    useWalletAddress.mockReturnValue({
      address: "0xdeadbeef000000000000000000000000000000ff",
      isConnected: true,
      canTransact: true,
    });
    render(<AdminPage />, { wrapper: TestWrapper });
    const panel = screen.getByTestId("admin-panel");
    expect(panel.dataset.operator).toBe("false");
  });

  it("passes isOperator={true} when connected wallet matches OPERATOR_ADDRESS", () => {
    useWalletAddress.mockReturnValue({
      address: "0xOperator000000000000000000000000000000001", // mixed-case — should match
      isConnected: true,
      canTransact: true,
    });
    render(<AdminPage />, { wrapper: TestWrapper });
    const panel = screen.getByTestId("admin-panel");
    expect(panel.dataset.operator).toBe("true");
  });

  it("passes seasonStatus and weekNumber derived from useSeason to AdminPanel", () => {
    useWalletAddress.mockReturnValue({
      address: "0xOperator000000000000000000000000000000001",
      isConnected: true,
      canTransact: true,
    });
    render(<AdminPage />, { wrapper: TestWrapper });
    const panel = screen.getByTestId("admin-panel");
    expect(panel.dataset.seasonStatus).toBe("active");
    expect(panel.dataset.weekNumber).toBe("3");
  });

  it("renders SeasonSnapshot and AirdropTrigger when isOperator is true", () => {
    useWalletAddress.mockReturnValue({
      address: "0xOperator000000000000000000000000000000001",
      isConnected: true,
      canTransact: true,
    });
    render(<AdminPage />, { wrapper: TestWrapper });
    expect(screen.getByTestId("season-snapshot")).toBeInTheDocument();
    expect(screen.getByTestId("airdrop-trigger")).toBeInTheDocument();
  });

  it("does NOT render SeasonSnapshot and AirdropTrigger when isOperator is false", () => {
    useWalletAddress.mockReturnValue({ address: null, isConnected: false, canTransact: false });
    render(<AdminPage />, { wrapper: TestWrapper });
    expect(screen.queryByTestId("season-snapshot")).not.toBeInTheDocument();
    expect(screen.queryByTestId("airdrop-trigger")).not.toBeInTheDocument();
  });
});
