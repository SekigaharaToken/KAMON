import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mutable ref so we can toggle SDK readiness per test
const { mockSdkReady } = vi.hoisted(() => ({
  mockSdkReady: { value: true },
}));

vi.mock("@/lib/mintclub.js", () => ({
  mintclub: null,
  getMintClub: vi.fn(() => Promise.resolve({ network: vi.fn() })),
  useMintClubReady: vi.fn(() => mockSdkReady.value),
}));

vi.mock("@/hooks/useWalletAddress.js", () => ({
  useWalletAddress: () => ({
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    isConnected: true,
    canTransact: true,
  }),
}));

vi.mock("wagmi", () => ({
  useReadContract: () => ({ data: 5000000000000000000n, refetch: vi.fn() }),
  useWalletClient: () => ({ data: { account: "0xmock", chain: { id: 8453 } } }),
}));

vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
  SUPPORTED_CHAINS: [{ id: 8453, name: "Base" }],
}));

vi.mock("@/hooks/useStaking.js", () => ({
  getPoolState: vi.fn().mockResolvedValue({
    totalStaked: 1000000000000000000000n,
    rewardPool: 500000000000000000000n,
    startTime: BigInt(Math.floor(Date.now() / 1000) - 86400),
  }),
  getUserPosition: vi.fn().mockResolvedValue({
    staked: 100000000000000000000n,
    pendingRewards: 25000000000000000000n,
  }),
  stakeTokens: vi.fn().mockResolvedValue({}),
  unstakeTokens: vi.fn().mockResolvedValue({}),
  claimRewards: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/hooks/useSeason.js", () => ({
  getTimeRemaining: vi.fn().mockReturnValue(5 * 7 * 24 * 60 * 60 * 1000),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Capture StakingPool callback props for testing
let capturedProps = {};
vi.mock("@/components/staking/StakingPool.jsx", () => ({
  StakingPool: (props) => {
    capturedProps = props;
    return (
      <div data-testid="staking-pool" data-props={JSON.stringify(props)}>
        StakingPool
      </div>
    );
  },
}));

import StakingPage from "@/pages/StakingPage.jsx";
import { stakeTokens, unstakeTokens, claimRewards } from "@/hooks/useStaking.js";
import { toast } from "sonner";

describe("StakingPage", () => {
  beforeEach(() => {
    mockSdkReady.value = true;
  });

  it("renders without crashing", () => {
    render(<StakingPage />, { wrapper: TestWrapper });
    expect(screen.getByTestId("staking-pool")).toBeInTheDocument();
  });

  it("renders staking title", () => {
    render(<StakingPage />, { wrapper: TestWrapper });
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });
});

describe("StakingPage SDK guard", () => {
  it("renders unavailable fallback when mintclub is null", () => {
    mockSdkReady.value = false;
    render(<StakingPage />, { wrapper: TestWrapper });
    expect(screen.getByText(/not available in local development/i)).toBeInTheDocument();
    expect(screen.queryByTestId("staking-pool")).not.toBeInTheDocument();
  });
});

describe("StakingPage wiring", () => {
  beforeEach(() => {
    mockSdkReady.value = true;
  });

  it("passes formatted poolStats props to StakingPool", () => {
    render(<StakingPage />, { wrapper: TestWrapper });
    const pool = screen.getByTestId("staking-pool");
    const props = JSON.parse(pool.dataset.props);
    // poolStats should have formatted string values (not bigints)
    expect(props.poolStats).toBeDefined();
    expect(typeof props.poolStats.totalStaked).toBe("string");
    expect(typeof props.poolStats.poolSize).toBe("string");
    expect(typeof props.poolStats.seasonEnd).toBe("string");
  });

  it("passes userPosition props to StakingPool", () => {
    render(<StakingPage />, { wrapper: TestWrapper });
    const pool = screen.getByTestId("staking-pool");
    const props = JSON.parse(pool.dataset.props);
    expect(props.userPosition).toBeDefined();
    expect(typeof props.userPosition.staked).toBe("string");
    expect(typeof props.userPosition.pendingRewards).toBe("string");
  });

  it("passes balance as string to StakingPool", () => {
    render(<StakingPage />, { wrapper: TestWrapper });
    const pool = screen.getByTestId("staking-pool");
    const props = JSON.parse(pool.dataset.props);
    expect(typeof props.balance).toBe("string");
    // 5000000000000000000n = "5" (formatUnits trims trailing zeros)
    expect(props.balance).toBe("5");
  });

  it("passes callback handlers to StakingPool", () => {
    render(<StakingPage />, { wrapper: TestWrapper });
    const pool = screen.getByTestId("staking-pool");
    const props = JSON.parse(pool.dataset.props);
    // Functions are not serializable to JSON, so they'll be absent/null
    // But isLoading should be present
    expect(props.isLoading).toBeDefined();
  });
});

describe("StakingPage error toasts", () => {
  beforeEach(() => {
    mockSdkReady.value = true;
    vi.clearAllMocks();
    capturedProps = {};
  });

  it("shows user-rejected toast when wallet rejects stake", async () => {
    stakeTokens.mockRejectedValueOnce(new Error("User rejected the request."));
    render(<StakingPage />, { wrapper: TestWrapper });

    await act(async () => {
      await capturedProps.onStake?.("10");
    });

    expect(toast.error).toHaveBeenCalledWith("Transaction was rejected");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows user-rejected toast when wallet rejects unstake", async () => {
    unstakeTokens.mockRejectedValueOnce(new Error("User denied transaction signature"));
    render(<StakingPage />, { wrapper: TestWrapper });

    await act(async () => {
      await capturedProps.onUnstake?.("5");
    });

    expect(toast.error).toHaveBeenCalledWith("Transaction was rejected");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows user-rejected toast when wallet rejects claim", async () => {
    claimRewards.mockRejectedValueOnce(new Error("user rejected"));
    render(<StakingPage />, { wrapper: TestWrapper });

    await act(async () => {
      await capturedProps.onClaim?.();
    });

    expect(toast.error).toHaveBeenCalledWith("Transaction was rejected");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows insufficient funds toast", async () => {
    stakeTokens.mockRejectedValueOnce(new Error("insufficient funds for gas"));
    render(<StakingPage />, { wrapper: TestWrapper });

    await act(async () => {
      await capturedProps.onStake?.("10");
    });

    expect(toast.error).toHaveBeenCalledWith("Insufficient funds for gas");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows success toast on successful stake", async () => {
    stakeTokens.mockResolvedValueOnce({ hash: "0x123" });
    render(<StakingPage />, { wrapper: TestWrapper });

    await act(async () => {
      await capturedProps.onStake?.("10");
    });

    expect(toast.success).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
