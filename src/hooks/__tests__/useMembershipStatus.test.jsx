import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mocks
const mockAddress = "0xabc123";
let mockSelectedHouse = "honoo";
let mockHouseConfig = { address: "0x1111", numericId: 1 };

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: mockAddress }),
}));

vi.mock("@/hooks/useHouse.js", () => ({
  useHouse: () => ({ selectedHouse: mockSelectedHouse, houseConfig: mockHouseConfig }),
}));

vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

const mockGetHouseBalance = vi.fn();
const mockGetAttestedHouse = vi.fn();

vi.mock("@/hooks/useHouseNFT.js", () => ({
  getHouseBalance: (...args) => mockGetHouseBalance(...args),
}));

vi.mock("@/hooks/useHouseMembership.js", () => ({
  getAttestedHouse: (...args) => mockGetAttestedHouse(...args),
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useMembershipStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedHouse = "honoo";
    mockHouseConfig = { address: "0x1111", numericId: 1 };
  });

  it("returns isComplete when user has both NFT and attestation", async () => {
    mockGetHouseBalance.mockResolvedValue(1n);
    mockGetAttestedHouse.mockResolvedValue(1);

    const { useMembershipStatus } = await import("../useMembershipStatus.js");
    const { result } = renderHook(() => useMembershipStatus(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNFT).toBe(true);
    expect(result.current.hasAttestation).toBe(true);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.needsNFT).toBe(false);
    expect(result.current.needsAttestation).toBe(false);
  });

  it("returns needsAttestation when user has NFT but no attestation", async () => {
    mockGetHouseBalance.mockResolvedValue(1n);
    mockGetAttestedHouse.mockResolvedValue(0);

    const { useMembershipStatus } = await import("../useMembershipStatus.js");
    const { result } = renderHook(() => useMembershipStatus(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNFT).toBe(true);
    expect(result.current.hasAttestation).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.needsNFT).toBe(false);
    expect(result.current.needsAttestation).toBe(true);
  });

  it("returns needsNFT when user has no NFT", async () => {
    mockGetHouseBalance.mockResolvedValue(0n);
    mockGetAttestedHouse.mockResolvedValue(0);

    const { useMembershipStatus } = await import("../useMembershipStatus.js");
    const { result } = renderHook(() => useMembershipStatus(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNFT).toBe(false);
    expect(result.current.needsNFT).toBe(true);
    expect(result.current.isComplete).toBe(false);
  });

  it("returns all false when no house is selected", async () => {
    mockSelectedHouse = null;
    mockHouseConfig = null;

    const { useMembershipStatus } = await import("../useMembershipStatus.js");
    const { result } = renderHook(() => useMembershipStatus(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.needsNFT).toBe(false);
    expect(result.current.needsAttestation).toBe(false);
  });
});
