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
vi.mock("@/hooks/useHouse.js", () => ({
  useHouse: () => ({ selectedHouse: null, houseConfig: null, selectHouse: vi.fn() }),
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
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
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
});
