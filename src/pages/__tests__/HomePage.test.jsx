import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestWrapper } from "@/test/wrapper.jsx";

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

// Mock useHouseNFT
const mockBurnHouseNFT = vi.fn(() => Promise.resolve());
const mockGetSellPrice = vi.fn(() => Promise.resolve(10000000000000000000n));
const mockGetHouseBalance = vi.fn(() => Promise.resolve(1n));
vi.mock("@/hooks/useHouseNFT.js", () => ({
  burnHouseNFT: (...args) => mockBurnHouseNFT(...args),
  getHouseBalance: (...args) => mockGetHouseBalance(...args),
  getSellPrice: (...args) => mockGetSellPrice(...args),
}));

// Mock useHouseMembership
const mockAttestHouse = vi.fn(() => Promise.resolve());
const mockRevokeHouse = vi.fn(() => Promise.resolve());
const mockRetryAttest = vi.fn(() => Promise.resolve());
const mockGetAttestedHouse = vi.fn(() => Promise.resolve(0));
vi.mock("@/hooks/useHouseMembership.js", () => ({
  attestHouse: (...args) => mockAttestHouse(...args),
  revokeHouse: (...args) => mockRevokeHouse(...args),
  retryAttest: (...args) => mockRetryAttest(...args),
  getAttestedHouse: (...args) => mockGetAttestedHouse(...args),
}));

// Mock sonner
const mockToast = { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn(), warning: vi.fn() };
vi.mock("sonner", () => ({ toast: mockToast }));

// Mock HouseCarousel to avoid embla-carousel matchMedia issue
vi.mock("@/components/house/HouseCarousel.jsx", () => ({
  HouseCarousel: () => <div data-testid="carousel">carousel</div>,
}));

// Mock chains for SDK guard
vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

const HomePage = (await import("../HomePage.jsx")).default;

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHouse.mockReturnValue({
      selectedHouse: null,
      houseConfig: null,
      selectHouse: mockSelectHouse,
    });
  });

  it("does not render abdicate button when no house selected", () => {
    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );
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

  it("opens confirmation dialog with sell price on abdicate click", async () => {
    const user = userEvent.setup();
    mockUseHouse.mockReturnValue({
      selectedHouse: "honoo",
      houseConfig: {
        id: "honoo",
        symbol: "炎",
        nameKey: "house.honoo",
        descriptionKey: "house.description.honoo",
        address: "0x1234",
        colors: { primary: "#c92a22" },
      },
      selectHouse: mockSelectHouse,
    });

    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Abdicate"));

    await waitFor(() => {
      expect(screen.getByText(/Leave 炎 Honoo\?/)).toBeInTheDocument();
    });
    expect(mockGetSellPrice).toHaveBeenCalledWith("0x1234");
    // Check refund amount appears (10 $SEKI formatted)
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });

  it("calls burnHouseNFT and selectHouse(null) on confirm", async () => {
    const user = userEvent.setup();
    mockUseHouse.mockReturnValue({
      selectedHouse: "honoo",
      houseConfig: {
        id: "honoo",
        symbol: "炎",
        nameKey: "house.honoo",
        descriptionKey: "house.description.honoo",
        address: "0x1234",
        colors: { primary: "#c92a22" },
      },
      selectHouse: mockSelectHouse,
    });

    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );

    // Open dialog
    await user.click(screen.getByText("Abdicate"));
    await waitFor(() => {
      expect(screen.getByText(/Leave 炎 Honoo\?/)).toBeInTheDocument();
    });

    // Click the confirm "Abdicate" button inside dialog (second one)
    const abdicateButtons = screen.getAllByText("Abdicate");
    const confirmBtn = abdicateButtons[abdicateButtons.length - 1];
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockBurnHouseNFT).toHaveBeenCalledWith("0x1234", "0xabc123");
    });
    expect(mockRevokeHouse).toHaveBeenCalledWith("0xabc123");
    expect(mockSelectHouse).toHaveBeenCalledWith(null);
    expect(mockToast.success).toHaveBeenCalled();
  });

  it("shows error toast when burn fails", async () => {
    const user = userEvent.setup();
    mockBurnHouseNFT.mockRejectedValueOnce(new Error("tx failed"));
    mockUseHouse.mockReturnValue({
      selectedHouse: "honoo",
      houseConfig: {
        id: "honoo",
        symbol: "炎",
        nameKey: "house.honoo",
        descriptionKey: "house.description.honoo",
        address: "0x1234",
        colors: { primary: "#c92a22" },
      },
      selectHouse: mockSelectHouse,
    });

    render(
      <TestWrapper>
        <HomePage />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Abdicate"));
    await waitFor(() => {
      expect(screen.getByText(/Leave 炎 Honoo\?/)).toBeInTheDocument();
    });

    const abdicateButtons = screen.getAllByText("Abdicate");
    await user.click(abdicateButtons[abdicateButtons.length - 1]);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
    expect(mockSelectHouse).not.toHaveBeenCalled();
  });
});
