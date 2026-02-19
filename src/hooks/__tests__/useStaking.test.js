import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * useStaking tests — verify staking pool operations via Mint Club SDK.
 *
 * Mocks the mintclub SDK since we can't hit real contracts in unit tests.
 */

vi.mock("@/lib/mintclub.js", () => {
  const mockPool = {
    getPoolState: vi.fn(),
    getPosition: vi.fn(),
    deposit: vi.fn(),
    withdraw: vi.fn(),
    claim: vi.fn(),
  };
  return {
    mintclub: {
      network: vi.fn(() => ({
        token: vi.fn(() => ({
          stake: vi.fn(() => mockPool),
        })),
      })),
    },
    __mockPool: mockPool,
  };
});

const { __mockPool } = await import("@/lib/mintclub.js");
const {
  getPoolState,
  getUserPosition,
  stakeTokens,
  unstakeTokens,
  claimRewards,
} = await import("@/hooks/useStaking.js");

const TEST_POOL_ADDRESS = "0xabcdef1234567890abcdef1234567890abcdef12";
const TEST_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

describe("useStaking — getPoolState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns pool state", async () => {
    const mockState = {
      totalStaked: 100000n,
      rewardPool: 500000n,
      startTime: 1700000000n,
    };
    __mockPool.getPoolState.mockResolvedValue(mockState);

    const state = await getPoolState(TEST_POOL_ADDRESS);
    expect(state).toEqual(mockState);
  });

  it("returns null for missing address", async () => {
    const state = await getPoolState(null);
    expect(state).toBeNull();
  });
});

describe("useStaking — getUserPosition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user position", async () => {
    const mockPosition = {
      staked: 5000n,
      pendingRewards: 150n,
    };
    __mockPool.getPosition.mockResolvedValue(mockPosition);

    const position = await getUserPosition(TEST_POOL_ADDRESS, TEST_WALLET);
    expect(position).toEqual(mockPosition);
  });

  it("returns null for missing wallet", async () => {
    const position = await getUserPosition(TEST_POOL_ADDRESS, null);
    expect(position).toBeNull();
  });
});

describe("useStaking — stakeTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deposits amount into pool", async () => {
    __mockPool.deposit.mockResolvedValue({ hash: "0xstake" });

    const result = await stakeTokens(TEST_POOL_ADDRESS, 1000n);
    expect(result).toEqual({ hash: "0xstake" });
    expect(__mockPool.deposit).toHaveBeenCalledWith({ amount: 1000n });
  });

  it("throws on zero amount", async () => {
    await expect(stakeTokens(TEST_POOL_ADDRESS, 0n)).rejects.toThrow();
  });
});

describe("useStaking — unstakeTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("withdraws amount from pool", async () => {
    __mockPool.withdraw.mockResolvedValue({ hash: "0xunstake" });

    const result = await unstakeTokens(TEST_POOL_ADDRESS, 500n);
    expect(result).toEqual({ hash: "0xunstake" });
    expect(__mockPool.withdraw).toHaveBeenCalledWith({ amount: 500n });
  });
});

describe("useStaking — claimRewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims pending rewards", async () => {
    __mockPool.claim.mockResolvedValue({ hash: "0xclaim" });

    const result = await claimRewards(TEST_POOL_ADDRESS);
    expect(result).toEqual({ hash: "0xclaim" });
    expect(__mockPool.claim).toHaveBeenCalled();
  });
});
