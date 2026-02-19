import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockGetLogsPaginated = vi.fn();
const mockGetBlockTimestamps = vi.fn();

vi.mock("@/lib/getLogsPaginated.js", () => ({
  getLogsPaginated: (...args) => mockGetLogsPaginated(...args),
  getBlockTimestamps: (...args) => mockGetBlockTimestamps(...args),
}));

vi.mock("@/config/contracts.js", () => ({
  EAS_ADDRESS: "0x4200000000000000000000000000000000000021",
}));

const { useAttestationHistory } = await import("../useAttestationHistory.js");

const SCHEMA = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
const ATTESTER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("useAttestationHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLogsPaginated.mockResolvedValue([]);
    mockGetBlockTimestamps.mockResolvedValue({});
  });

  it("returns empty attestations when no logs found", async () => {
    const { result } = renderHook(
      () => useAttestationHistory(SCHEMA, ATTESTER),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.attestations).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it("returns attestations with timestamps", async () => {
    mockGetLogsPaginated.mockResolvedValue([
      { data: "0xuid1", blockNumber: 100n },
      { data: "0xuid2", blockNumber: 200n },
    ]);
    mockGetBlockTimestamps.mockResolvedValue({
      "100": 1700000000,
      "200": 1700086400,
    });

    const { result } = renderHook(
      () => useAttestationHistory(SCHEMA, ATTESTER),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.attestations).toEqual([
      { uid: "0xuid1", blockNumber: 100, timestamp: 1700000000 },
      { uid: "0xuid2", blockNumber: 200, timestamp: 1700086400 },
    ]);
    expect(result.current.totalCount).toBe(2);
  });

  it("passes schemaUID and attester as args to getLogsPaginated", async () => {
    const { result } = renderHook(
      () => useAttestationHistory(SCHEMA, ATTESTER, { fromBlock: 50n }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockGetLogsPaginated).toHaveBeenCalledWith(
      expect.objectContaining({
        address: "0x4200000000000000000000000000000000000021",
        args: { attester: ATTESTER, schemaUID: SCHEMA },
        fromBlock: 50n,
        toBlock: "latest",
      }),
    );
  });

  it("does not query when attester is missing", () => {
    const { result } = renderHook(
      () => useAttestationHistory(SCHEMA, null),
      { wrapper: createWrapper() },
    );
    expect(result.current.isLoading).toBe(false);
    expect(mockGetLogsPaginated).not.toHaveBeenCalled();
  });

  it("does not query when schemaUid is missing", () => {
    const { result } = renderHook(
      () => useAttestationHistory("", ATTESTER),
      { wrapper: createWrapper() },
    );
    expect(result.current.isLoading).toBe(false);
    expect(mockGetLogsPaginated).not.toHaveBeenCalled();
  });
});
