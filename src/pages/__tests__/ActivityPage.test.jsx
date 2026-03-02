import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { LoginModalProvider } from "@/context/LoginModalContext.jsx";

const mockUseWalletAddress = vi.fn();
const mockUseHouse = vi.fn();
const mockGetOnChatMessageCount = vi.fn();
const mockGetOnChatTotalMessages = vi.fn();
const mockGetCurrentStreak = vi.fn();
const mockGetLongestStreak = vi.fn();
const mockGetLastCheckIn = vi.fn();
const mockIsStreakAtRisk = vi.fn();
const mockGetUserPosition = vi.fn();

vi.mock("@/hooks/useWalletAddress.js", () => ({
  useWalletAddress: (...args) => mockUseWalletAddress(...args),
}));

vi.mock("@/hooks/useHouse.js", () => ({
  useHouse: (...args) => mockUseHouse(...args),
}));

vi.mock("@/hooks/useOnChat.js", () => ({
  getOnChatMessageCount: (...args) => mockGetOnChatMessageCount(...args),
  getOnChatTotalMessages: (...args) => mockGetOnChatTotalMessages(...args),
  normalizeOnChatMessages: (user, total) => {
    if (!user || !total) return 0;
    return Math.min(100, Math.round((user / total) * 100));
  },
}));

vi.mock("@/hooks/useEASStreaks.js", () => ({
  getCurrentStreak: (...args) => mockGetCurrentStreak(...args),
  getLongestStreak: (...args) => mockGetLongestStreak(...args),
  getLastCheckIn: (...args) => mockGetLastCheckIn(...args),
  isStreakAtRisk: (...args) => mockIsStreakAtRisk(...args),
}));

vi.mock("@/hooks/useStaking.js", () => ({
  getUserPosition: (...args) => mockGetUserPosition(...args),
}));

vi.mock("@/lib/mintclub.js", () => ({
  mintclub: { network: vi.fn() },
}));

vi.mock("@/config/season.js", () => ({
  ONCHAT_CACHE_TTL: 30000,
}));

vi.mock("@/config/contracts.js", () => ({
  STAKING_POOL_ADDRESS: "0xSTAKING",
  DOJO_RESOLVER_ADDRESS: "0xDOJO",
}));

// Mock MyActivity to a stub that exposes props via data attributes
vi.mock("@/components/activity/MyActivity.jsx", () => ({
  MyActivity: ({ onChat, walletAddress, streak, staking }) => (
    <div
      data-testid="my-activity"
      data-onchat={onChat ? JSON.stringify(onChat) : "null"}
      data-wallet={walletAddress ?? "null"}
      data-streak={streak ? JSON.stringify(streak) : "null"}
      data-staking={staking ? JSON.stringify(staking) : "null"}
    >
      MyActivity
    </div>
  ),
}));

import ActivityPage from "@/pages/ActivityPage.jsx";

/** Fresh QueryClient per test to avoid cache leaking */
function FreshWrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <LoginModalProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </LoginModalProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("ActivityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: streak queries return 0n, staking returns null
    mockGetCurrentStreak.mockResolvedValue(0n);
    mockGetLongestStreak.mockResolvedValue(0n);
    mockGetLastCheckIn.mockResolvedValue(0n);
    mockIsStreakAtRisk.mockReturnValue(false);
    mockGetUserPosition.mockResolvedValue(null);
  });

  it("passes onChat=null when wallet is disconnected", () => {
    mockUseWalletAddress.mockReturnValue({ address: null });
    mockUseHouse.mockReturnValue({ houseConfig: null });

    render(<ActivityPage />, { wrapper: FreshWrapper });

    const activity = screen.getByTestId("my-activity");
    expect(activity.dataset.onchat).toBe("null");
    expect(activity.dataset.wallet).toBe("null");
  });

  it("passes wallet address when connected", () => {
    mockUseWalletAddress.mockReturnValue({ address: "0xABC" });
    mockUseHouse.mockReturnValue({ houseConfig: { id: "honoo" } });
    mockGetOnChatMessageCount.mockResolvedValue(10);
    mockGetOnChatTotalMessages.mockResolvedValue(100);

    render(<ActivityPage />, { wrapper: FreshWrapper });

    const activity = screen.getByTestId("my-activity");
    expect(activity.dataset.wallet).toBe("0xABC");
  });

  it("populates onChat when queries resolve", async () => {
    mockUseWalletAddress.mockReturnValue({ address: "0xABC" });
    mockUseHouse.mockReturnValue({ houseConfig: { id: "honoo" } });
    mockGetOnChatMessageCount.mockResolvedValue(25);
    mockGetOnChatTotalMessages.mockResolvedValue(100);

    render(<ActivityPage />, { wrapper: FreshWrapper });

    await waitFor(() => {
      const activity = screen.getByTestId("my-activity");
      const onChat = JSON.parse(activity.dataset.onchat);
      expect(onChat).not.toBeNull();
      expect(onChat.messageCount).toBe(25);
      expect(onChat.percentage).toBe(25);
    });
  });

  it("gracefully degrades to onChat=null on query failure", async () => {
    mockUseWalletAddress.mockReturnValue({ address: "0xDEF" });
    mockUseHouse.mockReturnValue({ houseConfig: { id: "honoo" } });
    mockGetOnChatMessageCount.mockRejectedValue(new Error("RPC fail"));
    mockGetOnChatTotalMessages.mockResolvedValue(100);

    render(<ActivityPage />, { wrapper: FreshWrapper });

    // Wait for queries to settle — messageCount fails, so onChat stays null
    await waitFor(() => {
      const activity = screen.getByTestId("my-activity");
      expect(activity.dataset.onchat).toBe("null");
    });
  });

  it("passes streak data to MyActivity when queries resolve", async () => {
    mockUseWalletAddress.mockReturnValue({ address: "0xABC" });
    mockUseHouse.mockReturnValue({ houseConfig: { id: "honoo" } });
    mockGetOnChatMessageCount.mockResolvedValue(10);
    mockGetOnChatTotalMessages.mockResolvedValue(100);
    mockGetCurrentStreak.mockResolvedValue(7n);
    mockGetLongestStreak.mockResolvedValue(14n);
    mockGetLastCheckIn.mockResolvedValue(1000000n);
    mockIsStreakAtRisk.mockReturnValue(true);

    render(<ActivityPage />, { wrapper: FreshWrapper });

    await waitFor(() => {
      const activity = screen.getByTestId("my-activity");
      const streak = JSON.parse(activity.dataset.streak);
      expect(streak).not.toBeNull();
      expect(streak.current).toBe(7);
      expect(streak.longest).toBe(14);
      expect(streak.isAtRisk).toBe(true);
    });
  });

  it("passes streak=empty object when wallet is disconnected", () => {
    mockUseWalletAddress.mockReturnValue({ address: null });
    mockUseHouse.mockReturnValue({ houseConfig: null });

    render(<ActivityPage />, { wrapper: FreshWrapper });

    const activity = screen.getByTestId("my-activity");
    // streak should be an empty object (no data) when disconnected
    const streak = JSON.parse(activity.dataset.streak);
    expect(streak).toEqual({});
  });

  it("passes staking data to MyActivity when query resolves", async () => {
    mockUseWalletAddress.mockReturnValue({ address: "0xABC" });
    mockUseHouse.mockReturnValue({ houseConfig: { id: "honoo" } });
    mockGetOnChatMessageCount.mockResolvedValue(10);
    mockGetOnChatTotalMessages.mockResolvedValue(100);
    // 5 SEKI staked (5 * 10^18), 1 DOJO pending
    mockGetUserPosition.mockResolvedValue({
      staked: 5000000000000000000n,
      pendingRewards: 1000000000000000000n,
    });

    render(<ActivityPage />, { wrapper: FreshWrapper });

    await waitFor(() => {
      const activity = screen.getByTestId("my-activity");
      const staking = JSON.parse(activity.dataset.staking);
      expect(staking).not.toBeNull();
      expect(staking.staked).toBe("5");
      expect(staking.pendingRewards).toBe("1");
    });
  });

  it("passes staking=empty object when getUserPosition returns null", async () => {
    mockUseWalletAddress.mockReturnValue({ address: "0xABC" });
    mockUseHouse.mockReturnValue({ houseConfig: { id: "honoo" } });
    mockGetOnChatMessageCount.mockResolvedValue(10);
    mockGetOnChatTotalMessages.mockResolvedValue(100);
    mockGetUserPosition.mockResolvedValue(null);

    render(<ActivityPage />, { wrapper: FreshWrapper });

    await waitFor(() => {
      const activity = screen.getByTestId("my-activity");
      const staking = JSON.parse(activity.dataset.staking);
      expect(staking).toEqual({});
    });
  });

  it("gracefully degrades streak to empty object on query failure", async () => {
    mockUseWalletAddress.mockReturnValue({ address: "0xABC" });
    mockUseHouse.mockReturnValue({ houseConfig: { id: "honoo" } });
    mockGetOnChatMessageCount.mockResolvedValue(10);
    mockGetOnChatTotalMessages.mockResolvedValue(100);
    mockGetCurrentStreak.mockRejectedValue(new Error("EAS fail"));
    mockGetLongestStreak.mockRejectedValue(new Error("EAS fail"));

    render(<ActivityPage />, { wrapper: FreshWrapper });

    await waitFor(() => {
      const activity = screen.getByTestId("my-activity");
      const streak = JSON.parse(activity.dataset.streak);
      expect(streak).toEqual({});
    });
  });
});
