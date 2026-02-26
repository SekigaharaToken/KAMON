import { render, screen } from "@testing-library/react";
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

// Mock HouseCarousel to avoid embla-carousel matchMedia issue
vi.mock("@/components/house/HouseCarousel.jsx", () => ({
  HouseCarousel: () => <div data-testid="carousel">carousel</div>,
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
});
