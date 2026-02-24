import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * useHouseNFT tests — verify Mint Club House NFT operations.
 *
 * These tests mock the mintclub SDK since we can't hit real contracts in unit tests.
 * Tests the production (non-local) code path where the SDK is used.
 */

// Force non-local dev mode for these tests
vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

// Mock mintclub SDK before importing hook
vi.mock("@/lib/mintclub.js", () => {
  const mockNft = {
    getBuyEstimation: vi.fn(),
    getSellEstimation: vi.fn(),
    buy: vi.fn(),
    sell: vi.fn(),
    getBalanceOf: vi.fn(),
    getTotalSupply: vi.fn(),
  };
  return {
    mintclub: {
      network: vi.fn(() => ({
        nft: vi.fn(() => mockNft),
      })),
      withWalletClient: vi.fn(),
    },
    __mockNft: mockNft,
  };
});

// Mock viem for ensureWalletClient
vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createWalletClient: vi.fn(() => ({ account: "0xmock" })),
    custom: vi.fn(() => ({})),
  };
});

// Mock window.ethereum for ensureWalletClient
globalThis.window = {
  ethereum: {
    request: vi.fn().mockResolvedValue(["0xmockAccount"]),
  },
};

// Import after mock setup
const { __mockNft } = await import("@/lib/mintclub.js");
const {
  getBuyPrice,
  mintHouseNFT,
  burnHouseNFT,
  getHouseBalance,
  getHouseSupply,
} = await import("@/hooks/useHouseNFT.js");

const TEST_HOUSE_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const TEST_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("useHouseNFT — getBuyPrice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns buy price for 1 NFT", async () => {
    __mockNft.getBuyEstimation.mockResolvedValue([10500000000000000000n, 300000000000000000n]);

    const price = await getBuyPrice(TEST_HOUSE_ADDRESS);
    expect(price).toBe(10500000000000000000n);
    expect(__mockNft.getBuyEstimation).toHaveBeenCalledWith(1n);
  });

  it("returns null for missing address", async () => {
    const price = await getBuyPrice(null);
    expect(price).toBeNull();
  });
});

describe("useHouseNFT — mintHouseNFT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls buy with quantity 1", async () => {
    __mockNft.buy.mockResolvedValue({ hash: "0xabc" });

    const result = await mintHouseNFT(TEST_HOUSE_ADDRESS, TEST_WALLET);
    expect(result).toEqual({ hash: "0xabc" });
    expect(__mockNft.buy).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1, recipient: TEST_WALLET }),
    );
  });

  it("throws on missing address", async () => {
    await expect(mintHouseNFT(null, TEST_WALLET)).rejects.toThrow();
  });
});

describe("useHouseNFT — burnHouseNFT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sell with quantity 1", async () => {
    __mockNft.sell.mockResolvedValue({ hash: "0xdef" });

    const result = await burnHouseNFT(TEST_HOUSE_ADDRESS, TEST_WALLET);
    expect(result).toEqual({ hash: "0xdef" });
    expect(__mockNft.sell).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1, recipient: TEST_WALLET }),
    );
  });
});

describe("useHouseNFT — getHouseBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns balance for wallet", async () => {
    __mockNft.getBalanceOf.mockResolvedValue(1n);

    const balance = await getHouseBalance(TEST_HOUSE_ADDRESS, TEST_WALLET);
    expect(balance).toBe(1n);
    expect(__mockNft.getBalanceOf).toHaveBeenCalledWith(TEST_WALLET);
  });

  it("returns 0n for no ownership", async () => {
    __mockNft.getBalanceOf.mockResolvedValue(0n);

    const balance = await getHouseBalance(TEST_HOUSE_ADDRESS, TEST_WALLET);
    expect(balance).toBe(0n);
  });
});

describe("useHouseNFT — getHouseSupply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns current supply", async () => {
    __mockNft.getTotalSupply.mockResolvedValue(247n);

    const supply = await getHouseSupply(TEST_HOUSE_ADDRESS);
    expect(supply).toBe(247n);
  });

  it("returns 0n for new House", async () => {
    __mockNft.getTotalSupply.mockResolvedValue(0n);

    const supply = await getHouseSupply(TEST_HOUSE_ADDRESS);
    expect(supply).toBe(0n);
  });
});
