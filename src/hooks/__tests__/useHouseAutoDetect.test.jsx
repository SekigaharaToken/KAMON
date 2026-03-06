import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HouseProvider } from "@/context/HouseContext.jsx";

// Mock chains
const mockIsLocalDev = vi.fn(() => false);
vi.mock("@/config/chains.js", () => ({
  get isLocalDev() {
    return mockIsLocalDev();
  },
  activeChain: { id: 8453, name: "Base" },
}));

// Mock wagmi
const mockAddress = vi.fn(() => undefined);
vi.mock("wagmi", () => ({
  useAccount: () => ({ address: mockAddress() }),
}));

// Mock getAttestedHouse
const mockGetAttestedHouse = vi.fn();
vi.mock("@/hooks/useHouseMembership.js", () => ({
  getAttestedHouse: (...args) => mockGetAttestedHouse(...args),
}));

// Mock houses config
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

const { useHouseAutoDetect } = await import("../useHouseAutoDetect.js");

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <HouseProvider>{children}</HouseProvider>
    </QueryClientProvider>
  );
}

describe("useHouseAutoDetect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockIsLocalDev.mockReturnValue(false);
    mockAddress.mockReturnValue(undefined);
    mockGetAttestedHouse.mockResolvedValue(0);
  });

  it("does nothing when no wallet connected", async () => {
    mockAddress.mockReturnValue(undefined);

    renderHook(() => useHouseAutoDetect(), { wrapper: createWrapper() });

    // Query should not fire — no address
    expect(mockGetAttestedHouse).not.toHaveBeenCalled();
    expect(localStorage.getItem("kamon:selected_house")).toBeNull();
  });

  it("does nothing when house already selected", async () => {
    mockAddress.mockReturnValue("0xAlice");
    localStorage.setItem("kamon:selected_house", "mizu");

    renderHook(() => useHouseAutoDetect(), { wrapper: createWrapper() });

    // Query should be disabled since selectedHouse is already set
    expect(mockGetAttestedHouse).not.toHaveBeenCalled();
  });

  it("does nothing on local dev", async () => {
    mockIsLocalDev.mockReturnValue(true);
    mockAddress.mockReturnValue("0xAlice");

    renderHook(() => useHouseAutoDetect(), { wrapper: createWrapper() });

    expect(mockGetAttestedHouse).not.toHaveBeenCalled();
  });

  it("auto-selects house when attestation found", async () => {
    mockAddress.mockReturnValue("0xAlice");
    mockGetAttestedHouse.mockResolvedValue(1); // honoo

    renderHook(() => useHouseAutoDetect(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(localStorage.getItem("kamon:selected_house")).toBe("honoo");
    });

    expect(mockGetAttestedHouse).toHaveBeenCalledWith("0xAlice");
  });

  it("does nothing when attestation returns 0 (no house)", async () => {
    mockAddress.mockReturnValue("0xAlice");
    mockGetAttestedHouse.mockResolvedValue(0);

    renderHook(() => useHouseAutoDetect(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockGetAttestedHouse).toHaveBeenCalledWith("0xAlice");
    });

    expect(localStorage.getItem("kamon:selected_house")).toBeNull();
  });
});
