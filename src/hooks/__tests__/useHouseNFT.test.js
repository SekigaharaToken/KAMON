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

// Mock mintclub SDK — mirrors AMATERASU's direct-export pattern
const mockNft = {
  getBuyEstimation: vi.fn(),
  getSellEstimation: vi.fn(),
  buy: vi.fn(),
  sell: vi.fn(),
  getBalanceOf: vi.fn(),
  getTotalSupply: vi.fn(),
};
const mockWithWalletClient = vi.fn();
const mockMintclub = {
  network: vi.fn(() => ({
    nft: vi.fn(() => mockNft),
  })),
  withWalletClient: mockWithWalletClient,
};

vi.mock("@/lib/mintclub.js", () => ({
  mintclub: mockMintclub,
  ensureInitialized: vi.fn(),
}));

// Import after mock setup
const {
  getBuyPrice,
  mintHouseNFT,
  burnHouseNFT,
  getHouseBalance,
  getHouseSupply,
} = await import("@/hooks/useHouseNFT.js");

const TEST_HOUSE_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const TEST_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const mockWalletClient = { account: "0xmock", chain: { id: 8453 } };

describe("useHouseNFT — getBuyPrice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns buy price for 1 NFT", async () => {
    mockNft.getBuyEstimation.mockResolvedValue([10500000000000000000n, 300000000000000000n]);

    const price = await getBuyPrice(TEST_HOUSE_ADDRESS);
    expect(price).toBe(10500000000000000000n);
    expect(mockNft.getBuyEstimation).toHaveBeenCalledWith(1n);
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

  it("calls buy with quantity 1 and injects walletClient", async () => {
    mockNft.buy.mockResolvedValue({ hash: "0xabc" });

    const result = await mintHouseNFT(TEST_HOUSE_ADDRESS, TEST_WALLET, mockWalletClient);
    expect(result).toEqual({ hash: "0xabc" });
    expect(mockWithWalletClient).toHaveBeenCalledWith(mockWalletClient);
    expect(mockNft.buy).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1, recipient: TEST_WALLET }),
    );
  });

  it("throws on missing address", async () => {
    await expect(mintHouseNFT(null, TEST_WALLET, mockWalletClient)).rejects.toThrow("House address is required");
  });

  it("throws on missing walletClient", async () => {
    await expect(mintHouseNFT(TEST_HOUSE_ADDRESS, TEST_WALLET, undefined)).rejects.toThrow("Wallet client is required");
  });
});

describe("useHouseNFT — burnHouseNFT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sell with quantity 1 and injects walletClient", async () => {
    mockNft.sell.mockResolvedValue({ hash: "0xdef" });

    const result = await burnHouseNFT(TEST_HOUSE_ADDRESS, TEST_WALLET, mockWalletClient);
    expect(result).toEqual({ hash: "0xdef" });
    expect(mockWithWalletClient).toHaveBeenCalledWith(mockWalletClient);
    expect(mockNft.sell).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1, recipient: TEST_WALLET }),
    );
  });

  it("throws on missing walletClient", async () => {
    await expect(burnHouseNFT(TEST_HOUSE_ADDRESS, TEST_WALLET, null)).rejects.toThrow("Wallet client is required");
  });
});

describe("useHouseNFT — getHouseBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns balance for wallet", async () => {
    mockNft.getBalanceOf.mockResolvedValue(1n);

    const balance = await getHouseBalance(TEST_HOUSE_ADDRESS, TEST_WALLET);
    expect(balance).toBe(1n);
    expect(mockNft.getBalanceOf).toHaveBeenCalledWith(TEST_WALLET);
  });

  it("returns 0n for no ownership", async () => {
    mockNft.getBalanceOf.mockResolvedValue(0n);

    const balance = await getHouseBalance(TEST_HOUSE_ADDRESS, TEST_WALLET);
    expect(balance).toBe(0n);
  });
});

describe("useHouseNFT — getHouseSupply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns current supply", async () => {
    mockNft.getTotalSupply.mockResolvedValue(247n);

    const supply = await getHouseSupply(TEST_HOUSE_ADDRESS);
    expect(supply).toBe(247n);
  });

  it("returns 0n for new House", async () => {
    mockNft.getTotalSupply.mockResolvedValue(0n);

    const supply = await getHouseSupply(TEST_HOUSE_ADDRESS);
    expect(supply).toBe(0n);
  });
});
