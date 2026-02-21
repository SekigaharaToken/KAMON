import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock wagmi
const mockUseAccount = vi.fn(() => ({
  address: "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
  isConnected: true,
}));
vi.mock("wagmi", () => ({
  useAccount: (...args) => mockUseAccount(...args),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), resolvedTheme: "light" }),
  ThemeProvider: ({ children }) => children,
}));

// Mock useFarcaster
vi.mock("@/hooks/useFarcaster.js", () => ({
  useFarcaster: () => ({
    isAuthenticated: true,
    profile: { displayName: "TestUser" },
    signOut: vi.fn(),
  }),
}));

// Mock useHouse
const mockUseHouse = vi.fn(() => ({
  selectedHouse: null,
  houseConfig: null,
  selectHouse: vi.fn(),
}));
vi.mock("@/hooks/useHouse.js", () => ({
  useHouse: (...args) => mockUseHouse(...args),
}));

const { Header } = await import("../Header.jsx");

describe("Header house info in avatar menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows house symbol and name when house is selected", async () => {
    const user = userEvent.setup();
    mockUseHouse.mockReturnValue({
      selectedHouse: "mizu",
      houseConfig: {
        id: "mizu",
        symbol: "水",
        nameKey: "house.mizu",
        descriptionKey: "house.description.mizu",
        cssClass: "house-mizu",
        address: "0x5678",
        colors: { primary: "#94bcad", secondary: "#6f5652", accent: "#dccf8e" },
      },
      selectHouse: vi.fn(),
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );

    // Open avatar dropdown
    const avatarBtn = screen.getByText("TE").closest("button");
    await user.click(avatarBtn);

    // House info should appear — symbol + translated name
    expect(await screen.findByText(/水.*Mizu/)).toBeInTheDocument();
  });

  it("does not show house info when no house selected", async () => {
    const user = userEvent.setup();
    mockUseHouse.mockReturnValue({
      selectedHouse: null,
      houseConfig: null,
      selectHouse: vi.fn(),
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>,
    );

    // Open avatar dropdown
    const avatarBtn = screen.getByText("TE").closest("button");
    await user.click(avatarBtn);

    // House symbols should not appear
    await screen.findByText("TestUser");
    expect(screen.queryByText(/炎|森|土|風/)).not.toBeInTheDocument();
  });
});
