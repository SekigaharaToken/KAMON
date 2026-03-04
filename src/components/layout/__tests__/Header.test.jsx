import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock wagmi hooks
const mockDisconnect = vi.fn();
const mockUseAccount = vi.fn(() => ({ address: undefined, isConnected: false }));
vi.mock("wagmi", () => ({
  useAccount: (...args) => mockUseAccount(...args),
  useDisconnect: () => ({ disconnect: mockDisconnect }),
}));

// Mock next-themes (useTheme)
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock useFarcaster
const mockSignOut = vi.fn();
const mockUseFarcaster = vi.fn(() => ({
  isAuthenticated: false,
  profile: null,
  signOut: mockSignOut,
}));
vi.mock("@/hooks/useFarcaster.js", () => ({
  useFarcaster: (...args) => mockUseFarcaster(...args),
}));

// Mock useHouse (Header now imports it for avatar house info)
const mockUseHouse = vi.fn(() => ({ selectedHouse: null, houseConfig: null, selectHouse: vi.fn() }));
vi.mock("@/hooks/useHouse.js", () => ({
  useHouse: (...args) => mockUseHouse(...args),
}));

// Mock useMembershipStatus
const mockUseMembershipStatus = vi.fn(() => ({
  hasNFT: false,
  hasAttestation: false,
  isComplete: false,
  needsNFT: false,
  needsAttestation: false,
  isLoading: false,
}));
vi.mock("@/hooks/useMembershipStatus.js", () => ({
  useMembershipStatus: (...args) => mockUseMembershipStatus(...args),
}));

const { Header } = await import("../Header.jsx");

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAccount.mockReturnValue({ address: undefined, isConnected: false });
    mockUseFarcaster.mockReturnValue({
      isAuthenticated: false,
      profile: null,
      signOut: mockSignOut,
    });
    mockUseHouse.mockReturnValue({ selectedHouse: null, houseConfig: null, selectHouse: vi.fn() });
    mockUseMembershipStatus.mockReturnValue({
      hasNFT: false, hasAttestation: false, isComplete: false,
      needsNFT: false, needsAttestation: false, isLoading: false,
    });
  });

  it("renders the app name", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );
    expect(screen.getByText("KAMON")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Swap")).toBeInTheDocument();
    expect(screen.getByText("Staking")).toBeInTheDocument();
    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });

  it("shows Connect Wallet button when not connected", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
  });

  it("renders theme toggle button", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );
    expect(screen.getByLabelText("Toggle theme")).toBeInTheDocument();
  });

  it("renders language switcher button", () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );
    expect(screen.getByLabelText("Change language")).toBeInTheDocument();
  });

  it("calls both wagmi disconnect and farcaster signOut when disconnect clicked", async () => {
    const user = userEvent.setup();
    mockUseAccount.mockReturnValue({
      address: "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
      isConnected: true,
    });
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );

    // Open the user dropdown (click the avatar button)
    const avatarBtn = screen.getByText("?").closest("button");
    await user.click(avatarBtn);

    // Click disconnect
    await user.click(await screen.findByText("Disconnect"));

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("calls signOut when farcaster-only user disconnects", async () => {
    const user = userEvent.setup();
    mockUseFarcaster.mockReturnValue({
      isAuthenticated: true,
      profile: { displayName: "alice.fc" },
      signOut: mockSignOut,
    });
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );

    // Open the user dropdown (click the avatar button showing initials)
    const avatarBtn = screen.getByText("AL").closest("button");
    await user.click(avatarBtn);

    // Click disconnect
    await user.click(await screen.findByText("Disconnect"));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  describe("verified house display", () => {
    const fireHouse = {
      id: 1,
      symbol: "🔥",
      nameKey: "house.fire.name",
      colors: { primary: "#E85D3A" },
      address: "0x1111111111111111111111111111111111111111",
    };

    function setupConnectedWithHouse({ membershipComplete }) {
      mockUseAccount.mockReturnValue({
        address: "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
        isConnected: true,
      });
      mockUseHouse.mockReturnValue({
        selectedHouse: 1,
        houseConfig: fireHouse,
        selectHouse: vi.fn(),
      });
      mockUseMembershipStatus.mockReturnValue({
        hasNFT: membershipComplete,
        hasAttestation: membershipComplete,
        isComplete: membershipComplete,
        needsNFT: !membershipComplete,
        needsAttestation: false,
        isLoading: false,
      });
    }

    it("shows house info in dropdown when membership is complete", async () => {
      const user = userEvent.setup();
      setupConnectedWithHouse({ membershipComplete: true });
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>,
      );

      const avatarBtn = screen.getByText("?").closest("button");
      await user.click(avatarBtn);

      expect(await screen.findByText(/🔥/)).toBeInTheDocument();
    });

    it("does NOT show house info when membership is incomplete", async () => {
      const user = userEvent.setup();
      setupConnectedWithHouse({ membershipComplete: false });
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>,
      );

      const avatarBtn = screen.getByText("?").closest("button");
      await user.click(avatarBtn);

      // Wait for dropdown to open, then verify no house symbol
      await screen.findByText("Disconnect");
      expect(screen.queryByText(/🔥/)).not.toBeInTheDocument();
    });

    it("applies house-colored ring to avatar when membership is complete", () => {
      setupConnectedWithHouse({ membershipComplete: true });
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>,
      );

      const avatarBtn = screen.getByText("?").closest("button");
      expect(avatarBtn.style.boxShadow).toBe("0 0 0 2px #E85D3A");
    });

    it("does NOT apply house-colored ring when membership is incomplete", () => {
      setupConnectedWithHouse({ membershipComplete: false });
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>,
      );

      const avatarBtn = screen.getByText("?").closest("button");
      expect(avatarBtn.style.boxShadow).toBe("");
    });
  });
});
