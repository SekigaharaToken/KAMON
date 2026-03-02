import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

vi.mock("@/hooks/useWalletAddress.js", () => ({
  useWalletAddress: () => ({ address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", isConnected: true, canTransact: true }),
}));

vi.mock("wagmi", () => ({
  useReadContract: () => ({ data: undefined }),
}));

vi.mock("@/lib/mintclub.js", () => ({
  mintclub: {
    network: () => ({
      token: () => ({
        getBuyEstimation: vi.fn().mockResolvedValue([50000000000000000n, 1000000000000000n]),
      }),
    }),
  },
}));

vi.mock("mint.club-v2-sdk", () => ({
  mintclub: {
    withPublicClient: vi.fn(),
    network: () => ({
      token: () => ({
        buy: vi.fn(),
        sell: vi.fn(),
        getBuyEstimation: vi.fn().mockResolvedValue([50000000000000000n, 1000000000000000n]),
        getSellEstimation: vi.fn().mockResolvedValue([45000000000000000n, 500000000000000n]),
      }),
    }),
  },
  wei: (num) => BigInt(num) * 10n ** 18n,
}));

// Provide configured SWAP_TOKENS so swap UI renders in test env
vi.mock("@/config/contracts.js", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    SWAP_TOKENS: [
      {
        key: "dojo",
        label: "$DOJO",
        address: "0xC5aAEFD024Aa95C59712A931b3295e237fFD3f81",
        network: "base",
        reserveLabel: "ETH",
        priceKey: "swap.priceDojo",
        buyKey: "swap.buyDojo",
        sellKey: "swap.sellDojo",
      },
    ],
  };
});

const SwapPage = (await import("@/pages/SwapPage.jsx")).default;

describe("SwapPage", () => {
  it("renders the page title", () => {
    render(<SwapPage />, { wrapper: TestWrapper });
    expect(screen.getByRole("heading", { level: 1, name: "Swap" })).toBeInTheDocument();
  });

  it("renders the price display", () => {
    render(<SwapPage />, { wrapper: TestWrapper });
    expect(screen.getByText(/Current \$DOJO Price/)).toBeInTheDocument();
  });

  it("renders the swap panel", () => {
    render(<SwapPage />, { wrapper: TestWrapper });
    expect(screen.getByRole("tab", { name: /buy/i })).toBeInTheDocument();
  });
});

describe("SwapPage — unconfigured tokens", () => {
  it("shows not-configured message when SWAP_TOKENS is empty", async () => {
    vi.resetModules();
    vi.doMock("@/config/contracts.js", () => ({
      SWAP_TOKENS: [],
    }));
    // Re-mock dependencies needed by SwapPage
    vi.doMock("@/lib/mintclub.js", () => ({ mintclub: null }));
    vi.doMock("mint.club-v2-sdk", () => ({
      mintclub: null,
      wei: (num) => BigInt(num) * 10n ** 18n,
    }));
    const { default: SwapPageEmpty } = await import("@/pages/SwapPage.jsx");
    render(<SwapPageEmpty />, { wrapper: TestWrapper });
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
  });
});
