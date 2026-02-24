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

vi.mock("@/config/season.js", () => ({
  ONCHAT_CACHE_TTL: 30000,
}));

// Mock MyActivity to a stub that exposes props via data attributes
vi.mock("@/components/activity/MyActivity.jsx", () => ({
  MyActivity: ({ onChat, walletAddress }) => (
    <div
      data-testid="my-activity"
      data-onchat={onChat ? JSON.stringify(onChat) : "null"}
      data-wallet={walletAddress ?? "null"}
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
});
