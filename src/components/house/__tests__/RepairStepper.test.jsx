import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

// Mocks
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0xabc123" }),
  useWalletClient: () => ({ data: { writeContract: vi.fn() } }),
}));

vi.mock("@/hooks/useFarcaster.js", () => ({
  useFarcaster: () => ({ profile: { fid: 12345 } }),
}));

vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

const mockMintHouseNFT = vi.fn();
const mockAttestHouse = vi.fn();

vi.mock("@/hooks/useHouseNFT.js", () => ({
  mintHouseNFT: (...args) => mockMintHouseNFT(...args),
}));

vi.mock("@/hooks/useHouseMembership.js", () => ({
  attestHouse: (...args) => mockAttestHouse(...args),
}));

const { RepairStepper } = await import("../RepairStepper.jsx");

const houseConfig = {
  id: "honoo",
  numericId: 1,
  address: "0x1111",
  nameKey: "house.honoo",
  colors: { primary: "#c92a22" },
};

function Wrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </I18nextProvider>
  );
}

describe("RepairStepper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMintHouseNFT.mockResolvedValue({ transactionHash: "0xaaa" });
    mockAttestHouse.mockResolvedValue("0xbbb");
  });

  it("shows only attestation step when needsAttestation=true, needsNFT=false", () => {
    render(
      <Wrapper>
        <RepairStepper
          houseConfig={houseConfig}
          needsNFT={false}
          needsAttestation={true}
          open={true}
          onOpenChange={() => {}}
        />
      </Wrapper>,
    );

    expect(screen.getByText("Complete Membership")).toBeInTheDocument();
    expect(screen.getByText("Register Membership")).toBeInTheDocument();
    expect(screen.queryByText("Mint House NFT")).not.toBeInTheDocument();
  });

  it("shows both steps when needsNFT=true", () => {
    render(
      <Wrapper>
        <RepairStepper
          houseConfig={houseConfig}
          needsNFT={true}
          needsAttestation={false}
          open={true}
          onOpenChange={() => {}}
        />
      </Wrapper>,
    );

    expect(screen.getByText("Mint House NFT")).toBeInTheDocument();
    expect(screen.getByText("Register Membership")).toBeInTheDocument();
  });

  it("runs attestation only flow when needsAttestation=true", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <RepairStepper
          houseConfig={houseConfig}
          needsNFT={false}
          needsAttestation={true}
          open={true}
          onOpenChange={() => {}}
        />
      </Wrapper>,
    );

    await user.click(screen.getByText("Begin"));

    await vi.waitFor(() => {
      expect(mockAttestHouse).toHaveBeenCalledWith(1, "0xabc123", 12345, expect.any(Object));
    });

    expect(mockMintHouseNFT).not.toHaveBeenCalled();
  });

  it("runs full flow when needsNFT=true", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <RepairStepper
          houseConfig={houseConfig}
          needsNFT={true}
          needsAttestation={false}
          open={true}
          onOpenChange={() => {}}
        />
      </Wrapper>,
    );

    await user.click(screen.getByText("Begin"));

    await vi.waitFor(() => {
      expect(mockMintHouseNFT).toHaveBeenCalled();
      expect(mockAttestHouse).toHaveBeenCalled();
    });
  });

  it("shows Done button on completion", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <RepairStepper
          houseConfig={houseConfig}
          needsNFT={false}
          needsAttestation={true}
          open={true}
          onOpenChange={() => {}}
        />
      </Wrapper>,
    );

    await user.click(screen.getByText("Begin"));

    await vi.waitFor(() => {
      expect(screen.getByText("Done")).toBeInTheDocument();
    });
  });

  it("shows retry on attestation failure", async () => {
    mockAttestHouse.mockRejectedValue(new Error("gas estimation failed"));
    const user = userEvent.setup();

    render(
      <Wrapper>
        <RepairStepper
          houseConfig={houseConfig}
          needsNFT={false}
          needsAttestation={true}
          open={true}
          onOpenChange={() => {}}
        />
      </Wrapper>,
    );

    await user.click(screen.getByText("Begin"));

    await vi.waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
      expect(screen.getByText("Skip")).toBeInTheDocument();
    });
  });

  it("does not render when open=false", () => {
    render(
      <Wrapper>
        <RepairStepper
          houseConfig={houseConfig}
          needsNFT={false}
          needsAttestation={true}
          open={false}
          onOpenChange={() => {}}
        />
      </Wrapper>,
    );

    expect(screen.queryByText("Complete Membership")).not.toBeInTheDocument();
  });
});
