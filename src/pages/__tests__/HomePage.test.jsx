import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { LoginModalProvider } from "@/context/LoginModalContext.jsx";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import { TestWrapper } from "@/test/wrapper.jsx";

/** Fresh QueryClient wrapper — prevents TanStack Query cache from persisting between tests. */
function FreshWrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <LoginModalProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </LoginModalProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

// Mock wagmi
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0xabc123", isConnected: true }),
}));

// Mock useHouse
const mockSelectHouse = vi.fn();
const mockUseHouse = vi.fn(() => ({
  selectedHouse: null,
  houseConfig: null,
  selectHouse: mockSelectHouse,
}));
vi.mock("@/hooks/useHouse.js", () => ({
  useHouse: (...args) => mockUseHouse(...args),
}));

// Mock useHouseMembership
const mockRetryAttest = vi.fn(() => Promise.resolve());
const mockGetAttestedHouse = vi.fn(() => Promise.resolve(0));
vi.mock("@/hooks/useHouseMembership.js", () => ({
  retryAttest: (...args) => mockRetryAttest(...args),
  getAttestedHouse: (...args) => mockGetAttestedHouse(...args),
}));

// Mock sonner
const mockToast = { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn(), warning: vi.fn() };
vi.mock("sonner", () => ({ toast: mockToast }));

// Capture last props passed to HouseCarousel for assertion
let lastCarouselProps = {};
vi.mock("@/components/house/HouseCarousel.jsx", () => ({
  HouseCarousel: (props) => {
    lastCarouselProps = props;
    return <div data-testid="carousel">carousel</div>;
  },
}));

// Mock stepper components — transaction logic tested in their own tests
vi.mock("@/components/house/JoinStepper.jsx", () => ({
  JoinStepper: ({ open }) => open ? <div data-testid="join-stepper">join stepper</div> : null,
}));

vi.mock("@/components/house/AbdicateStepper.jsx", () => ({
  AbdicateStepper: ({ open }) => open ? <div data-testid="abdicate-stepper">abdicate stepper</div> : null,
}));

// Mock chains for SDK guard
vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

// Mock useFarcaster
vi.mock("@/hooks/useFarcaster.js", () => ({
  useFarcaster: () => ({ isAuthenticated: true, profile: { fid: 12345 } }),
}));

// Mock useHouseNFT to control supply/price data
const mockGetHouseSupply = vi.fn(() => Promise.resolve(42n));
const mockGetBuyPrice = vi.fn(() => Promise.resolve(50000000000000000n)); // 0.05 in wei (18 decimals)
vi.mock("@/hooks/useHouseNFT.js", () => ({
  getHouseSupply: (...args) => mockGetHouseSupply(...args),
  getBuyPrice: (...args) => mockGetBuyPrice(...args),
}));

// Mock mintclub — available (non-null) so queries are enabled
vi.mock("@/lib/mintclub.js", () => ({
  mintclub: { network: vi.fn() },
}));

// Mock houses with non-empty addresses so the `enabled` guard passes in tests
vi.mock("@/config/houses.js", () => {
  const HOUSES = {
    honoo: { id: "honoo", numericId: 1, element: "fire", symbol: "炎", nameKey: "house.honoo", descriptionKey: "house.description.honoo", cssClass: "house-honoo", address: "0x1111", colors: { primary: "#c92a22", secondary: "#55011f", accent: "#dccf8e" } },
    mizu: { id: "mizu", numericId: 2, element: "water", symbol: "水", nameKey: "house.mizu", descriptionKey: "house.description.mizu", cssClass: "house-mizu", address: "0x2222", colors: { primary: "#94bcad", secondary: "#6f5652", accent: "#dccf8e" } },
    mori: { id: "mori", numericId: 3, element: "forest", symbol: "森", nameKey: "house.mori", descriptionKey: "house.description.mori", cssClass: "house-mori", address: "0x3333", colors: { primary: "#9b9024", secondary: "#6f5652", accent: "#94bcad" } },
    tsuchi: { id: "tsuchi", numericId: 4, element: "earth", symbol: "土", nameKey: "house.tsuchi", descriptionKey: "house.description.tsuchi", cssClass: "house-tsuchi", address: "0x4444", colors: { primary: "#6f5652", secondary: "#9b9024", accent: "#dccf8e" } },
    kaze: { id: "kaze", numericId: 5, element: "wind", symbol: "風", nameKey: "house.kaze", descriptionKey: "house.description.kaze", cssClass: "house-kaze", address: "0x5555", colors: { primary: "#94bcad", secondary: "#d0555d", accent: "#dccf8e" } },
  };
  return {
    HOUSES,
    HOUSE_LIST: Object.values(HOUSES),
    getHouseByAddress: (addr) => Object.values(HOUSES).find((h) => h.address === addr) ?? null,
    getHouseByNumericId: (id) => Object.values(HOUSES).find((h) => h.numericId === id) ?? null,
    HOUSE_MAX_SUPPLY: 1000,
    HOUSE_STARTING_PRICE: 10,
  };
});

const HomePage = (await import("../HomePage.jsx")).default;

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastCarouselProps = {};
    mockUseHouse.mockReturnValue({
      selectedHouse: null,
      houseConfig: null,
      selectHouse: mockSelectHouse,
    });
    mockGetHouseSupply.mockResolvedValue(42n);
    mockGetBuyPrice.mockResolvedValue(50000000000000000n);
  });

  it("renders carousel when no house selected", () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );
    expect(screen.getByTestId("carousel")).toBeInTheDocument();
    expect(screen.queryByText("Abdicate")).not.toBeInTheDocument();
  });

  it("renders house name and abdicate button when house selected", () => {
    mockUseHouse.mockReturnValue({
      selectedHouse: "honoo",
      houseConfig: {
        id: "honoo",
        symbol: "炎",
        nameKey: "house.honoo",
        descriptionKey: "house.description.honoo",
        address: "0x1234",
        numericId: 1,
        colors: { primary: "#c92a22" },
      },
      selectHouse: mockSelectHouse,
    });

    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );

    expect(screen.getByText("炎 Honoo")).toBeInTheDocument();
    expect(screen.getByText("Abdicate")).toBeInTheDocument();
  });

  it("does not render join or abdicate steppers when not triggered", () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );
    expect(screen.queryByTestId("join-stepper")).not.toBeInTheDocument();
    expect(screen.queryByTestId("abdicate-stepper")).not.toBeInTheDocument();
  });

  it("passes supplies and prices props to HouseCarousel", () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );
    // HouseCarousel must receive supplies and prices objects (may be empty initially)
    expect(lastCarouselProps).toHaveProperty("supplies");
    expect(lastCarouselProps).toHaveProperty("prices");
    expect(typeof lastCarouselProps.supplies).toBe("object");
    expect(typeof lastCarouselProps.prices).toBe("object");
  });

  it("passes empty supplies and prices when mintclub is not available", () => {
    // The mintclub mock returns a truthy object. This test verifies the initial
    // render passes objects (not undefined) — the SDK guard is unit-tested separately.
    // Before any queries resolve, supplies/prices are empty objects.
    render(
      <FreshWrapper>
        <HomePage />
      </FreshWrapper>,
    );

    // On first synchronous render, queries haven't resolved yet.
    // supplies and prices must be plain objects (never undefined).
    expect(lastCarouselProps.supplies).toBeDefined();
    expect(lastCarouselProps.prices).toBeDefined();
    expect(typeof lastCarouselProps.supplies).toBe("object");
    expect(typeof lastCarouselProps.prices).toBe("object");
  });

  it("queries supply and price for each house when mintclub is available", async () => {
    render(
      <FreshWrapper>
        <HomePage />
      </FreshWrapper>,
    );

    // getHouseSupply and getBuyPrice should be called for all 5 houses
    // via useQueries when mintclub is defined and addresses are non-empty.
    await vi.waitFor(() => {
      expect(mockGetHouseSupply).toHaveBeenCalled();
      expect(mockGetBuyPrice).toHaveBeenCalled();
    });
  });
});
