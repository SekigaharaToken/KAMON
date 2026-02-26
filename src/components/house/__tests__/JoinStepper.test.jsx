import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock wagmi
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0xabc123", isConnected: true }),
}));

// Mock useHouseNFT
const mockMintHouseNFT = vi.fn(() => Promise.resolve());
vi.mock("@/hooks/useHouseNFT.js", () => ({
  mintHouseNFT: (...args) => mockMintHouseNFT(...args),
}));

// Mock useHouseMembership
const mockAttestHouse = vi.fn(() => Promise.resolve());
vi.mock("@/hooks/useHouseMembership.js", () => ({
  attestHouse: (...args) => mockAttestHouse(...args),
}));

// Mock chains
vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

// Mock useFarcaster
const mockUseFarcaster = vi.fn(() => ({
  isAuthenticated: true,
  profile: { fid: 12345 },
}));
vi.mock("@/hooks/useFarcaster.js", () => ({
  useFarcaster: (...args) => mockUseFarcaster(...args),
}));

const { JoinStepper } = await import("../JoinStepper.jsx");

const house = {
  id: "honoo",
  nameKey: "house.honoo",
  address: "0x1234",
  numericId: 1,
  colors: { primary: "#c92a22" },
};

describe("JoinStepper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFarcaster.mockReturnValue({ isAuthenticated: true, profile: { fid: 12345 } });
  });

  it("renders stepper in pending state", () => {
    render(
      <TestWrapper>
        <JoinStepper house={house} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );
    expect(screen.getByText("Mint House NFT")).toBeInTheDocument();
    expect(screen.getByText("Register Membership")).toBeInTheDocument();
    expect(screen.getByText("Begin")).toBeInTheDocument();
  });

  it("Begin starts mint transaction", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <JoinStepper house={house} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Begin"));

    await waitFor(() => {
      expect(mockMintHouseNFT).toHaveBeenCalledWith("0x1234", "0xabc123");
    });
  });

  it("mint success leads to attest call", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <JoinStepper house={house} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Begin"));

    await waitFor(() => {
      expect(mockAttestHouse).toHaveBeenCalledWith(1, "0xabc123", 12345);
    });
  });

  it("shows Done button when all steps complete", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <TestWrapper>
        <JoinStepper house={house} open={true} onOpenChange={vi.fn()} onComplete={onComplete} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Begin"));

    await waitFor(() => {
      expect(screen.getByText("Done")).toBeInTheDocument();
    });
  });

  it("shows error state and Retry on mint failure", async () => {
    mockMintHouseNFT.mockRejectedValueOnce(new Error("user rejected"));
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <JoinStepper house={house} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Begin"));

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("shows Skip option on attest failure", async () => {
    mockAttestHouse.mockRejectedValueOnce(new Error("attest failed"));
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <JoinStepper house={house} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Begin"));

    await waitFor(() => {
      expect(screen.getByText("Skip")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("disables Begin button when FID is not available", () => {
    mockUseFarcaster.mockReturnValue({ isAuthenticated: false, profile: null });
    render(
      <TestWrapper>
        <JoinStepper house={house} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    const beginButton = screen.getByText("Begin");
    expect(beginButton).toBeDisabled();
    expect(screen.getByText("Sign in with Farcaster to join a house")).toBeInTheDocument();
  });

  it("Done calls onComplete with house id", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <TestWrapper>
        <JoinStepper house={house} open={true} onOpenChange={onOpenChange} onComplete={onComplete} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Begin"));
    await waitFor(() => expect(screen.getByText("Done")).toBeInTheDocument());
    await user.click(screen.getByText("Done"));

    expect(onComplete).toHaveBeenCalledWith("honoo");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
