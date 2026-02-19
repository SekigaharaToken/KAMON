import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestWrapper } from "@/test/wrapper.jsx";

// Force non-local dev mode for these tests
vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
  base: { id: 8453, name: "Base" },
  baseSepolia: { id: 84532, name: "Base Sepolia" },
  SUPPORTED_CHAINS: [{ id: 8453, name: "Base" }],
}));

const mockBuy = vi.fn();
const mockSell = vi.fn();
const mockGetBuyEstimation = vi.fn();
const mockGetSellEstimation = vi.fn();

vi.mock("mint.club-v2-sdk", () => ({
  mintclub: {
    withPublicClient: vi.fn(),
    network: () => ({
      token: () => ({
        buy: mockBuy,
        sell: mockSell,
        getBuyEstimation: mockGetBuyEstimation,
        getSellEstimation: mockGetSellEstimation,
      }),
    }),
  },
  wei: (num) => BigInt(num) * 10n ** 18n,
}));

const mockUseWalletAddress = vi.fn(() => ({
  address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  isConnected: true,
  canTransact: true,
}));

vi.mock("@/hooks/useWalletAddress.js", () => ({
  useWalletAddress: (...args) => mockUseWalletAddress(...args),
}));

vi.mock("wagmi", () => ({
  useReadContract: () => ({ data: undefined }),
}));

const { SwapPanel } = await import("@/components/swap/SwapPanel.jsx");

const defaultTokenConfig = {
  key: "token",
  label: "$TOKEN",
  address: "0xC5aAEFD024Aa95C59712A931b3295e237fFD3f81",
  network: "base",
  reserveLabel: "ETH",
  priceKey: "swap.priceToken",
  buyKey: "swap.buyToken",
  sellKey: "swap.sellToken",
};

describe("SwapPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuy.mockResolvedValue("0xbuytxhash");
    mockSell.mockResolvedValue("0xselltxhash");
    mockGetBuyEstimation.mockResolvedValue([50000000000000000n]);
    mockGetSellEstimation.mockResolvedValue([45000000000000000n]);
    mockUseWalletAddress.mockReturnValue({
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      isConnected: true,
      canTransact: true,
    });
  });

  it("renders buy and sell tabs", () => {
    render(<SwapPanel tokenConfig={defaultTokenConfig} />, { wrapper: TestWrapper });
    expect(screen.getByRole("tab", { name: /buy/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /sell/i })).toBeInTheDocument();
  });

  it("renders amount input", () => {
    render(<SwapPanel tokenConfig={defaultTokenConfig} />, { wrapper: TestWrapper });
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("has a submit button", () => {
    render(<SwapPanel tokenConfig={defaultTokenConfig} />, { wrapper: TestWrapper });
    expect(
      screen.getByRole("button", { name: /buy \$token/i }),
    ).toBeInTheDocument();
  });

  it("switches to sell mode when sell tab clicked", async () => {
    const user = userEvent.setup();
    render(<SwapPanel tokenConfig={defaultTokenConfig} />, { wrapper: TestWrapper });
    await user.click(screen.getByRole("tab", { name: /sell/i }));
    expect(
      screen.getByRole("button", { name: /sell \$token/i }),
    ).toBeInTheDocument();
  });

  it("disables submit when amount is empty", () => {
    render(<SwapPanel tokenConfig={defaultTokenConfig} />, { wrapper: TestWrapper });
    const btn = screen.getByRole("button", { name: /buy \$token/i });
    expect(btn).toBeDisabled();
  });

  it("enables submit when amount is entered", () => {
    render(<SwapPanel tokenConfig={defaultTokenConfig} />, { wrapper: TestWrapper });
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "10" } });
    const btn = screen.getByRole("button", { name: /buy \$token/i });
    expect(btn).not.toBeDisabled();
  });

  it("shows connect wallet message when not connected", () => {
    mockUseWalletAddress.mockReturnValue({ address: undefined, isConnected: false });
    render(<SwapPanel tokenConfig={defaultTokenConfig} />, { wrapper: TestWrapper });
    expect(screen.getByText(/connect/i)).toBeInTheDocument();
  });
});
