import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock wagmi
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0xabc123", isConnected: true }),
}));

// Mock useHouseNFT
const mockBurnHouseNFT = vi.fn(() => Promise.resolve());
const mockGetHouseBalance = vi.fn(() => Promise.resolve(1n));
const mockGetSellPrice = vi.fn(() => Promise.resolve(10000000000000000000n));
vi.mock("@/hooks/useHouseNFT.js", () => ({
  burnHouseNFT: (...args) => mockBurnHouseNFT(...args),
  getHouseBalance: (...args) => mockGetHouseBalance(...args),
  getSellPrice: (...args) => mockGetSellPrice(...args),
}));

// Mock useHouseMembership
const mockRevokeHouse = vi.fn(() => Promise.resolve());
vi.mock("@/hooks/useHouseMembership.js", () => ({
  revokeHouse: (...args) => mockRevokeHouse(...args),
}));

// Mock chains
vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

const { AbdicateStepper } = await import("../AbdicateStepper.jsx");

const houseConfig = {
  id: "honoo",
  nameKey: "house.honoo",
  address: "0x1234",
  numericId: 1,
  colors: { primary: "#c92a22" },
};

describe("AbdicateStepper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders stepper with Confirm button", () => {
    render(
      <TestWrapper>
        <AbdicateStepper houseConfig={houseConfig} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );
    expect(screen.getByText("Sell House NFT")).toBeInTheDocument();
    expect(screen.getByText("Revoke Membership")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("Confirm starts burn transaction", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AbdicateStepper houseConfig={houseConfig} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(mockBurnHouseNFT).toHaveBeenCalledWith("0x1234", "0xabc123");
    });
  });

  it("burn success leads to revoke call", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AbdicateStepper houseConfig={houseConfig} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(mockRevokeHouse).toHaveBeenCalledWith("0xabc123");
    });
  });

  it("shows Done button when all steps complete", async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AbdicateStepper houseConfig={houseConfig} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(screen.getByText("Done")).toBeInTheDocument();
    });
  });

  it("shows Retry on burn failure", async () => {
    mockBurnHouseNFT.mockRejectedValueOnce(new Error("tx failed"));
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AbdicateStepper houseConfig={houseConfig} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("shows Skip option on revoke failure", async () => {
    mockRevokeHouse.mockRejectedValueOnce(new Error("revoke failed"));
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AbdicateStepper houseConfig={houseConfig} open={true} onOpenChange={vi.fn()} onComplete={vi.fn()} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(screen.getByText("Skip")).toBeInTheDocument();
    });
  });

  it("completes immediately when balance is 0", async () => {
    mockGetHouseBalance.mockResolvedValueOnce(0n);
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <TestWrapper>
        <AbdicateStepper houseConfig={houseConfig} open={true} onOpenChange={onOpenChange} onComplete={onComplete} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(mockBurnHouseNFT).not.toHaveBeenCalled();
  });

  it("Done calls onComplete", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <TestWrapper>
        <AbdicateStepper houseConfig={houseConfig} open={true} onOpenChange={onOpenChange} onComplete={onComplete} />
      </TestWrapper>,
    );

    await user.click(screen.getByText("Confirm"));
    await waitFor(() => expect(screen.getByText("Done")).toBeInTheDocument());
    await user.click(screen.getByText("Done"));

    expect(onComplete).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
