import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * useStaking tests — verify staking pool operations via Mint Club SDK.
 *
 * Mocks the mintclub SDK using the pool-ID-based Stake helper API
 * (mintclub.network().stake), NOT the per-token API.
 */

vi.mock("@/config/season.js", () => ({
  STAKING_POOL_ID: 206,
  SEASON_NUMBER: 1,
  SEASON_ACTIVE_WEEKS: 12,
  SEASON_COOLDOWN_WEEKS: 1,
  SEASON_REWARD_POOL: 500_000,
  LEADERBOARD_CACHE_TTL: 15 * 60 * 1000,
  LEADERBOARD_CACHE_KEY: "kamon_leaderboard_cache",
  SCORING_WEIGHTS: { dojo: 0.4, staking: 0.3, onchat: 0.3 },
  SCORING_WEIGHTS_FALLBACK: { dojo: 0.4, staking: 0.6 },
  MAX_DOJO_STREAK: 30,
  STAKING_BADGE_WEEKS: 4,
  ONCHAT_CHANNEL_SLUG: "sekigahara",
  ONCHAT_CACHE_TTL: 60 * 60 * 1000,
}));

const mockStake = {
  getPool: vi.fn(),
  getUserPoolStake: vi.fn(),
  getClaimableReward: vi.fn(),
  stake: vi.fn(),
  unstake: vi.fn(),
  claim: vi.fn(),
};

vi.mock("@/lib/mintclub.js", () => ({
  mintclub: null,
  getMintClub: vi.fn(() =>
    Promise.resolve({
      network: vi.fn(() => ({
        stake: mockStake,
      })),
    }),
  ),
  useMintClubReady: vi.fn(() => true),
}));

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

  it("returns normalized pool state from SDK", async () => {
    mockStake.getPool.mockResolvedValue({
      poolId: 206,
      pool: {
        totalStaked: 100000n,
        rewardAmount: 500000n,
        rewardStartsAt: 1700000000n,
      },
    });

    const state = await getPoolState();
    expect(state).toEqual({
      totalStaked: 100000n,
      rewardPool: 500000n,
      startTime: 1700000000n,
    });
    expect(mockStake.getPool).toHaveBeenCalledWith({ poolId: 206 });
  });
});

describe("useStaking — getUserPosition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user position with staked amount and pending rewards", async () => {
    mockStake.getUserPoolStake.mockResolvedValue({ stakedAmount: 5000n });
    mockStake.getClaimableReward.mockResolvedValue(150n);

    const position = await getUserPosition(TEST_POOL_ADDRESS, TEST_WALLET);
    expect(position).toEqual({
      staked: 5000n,
      pendingRewards: 150n,
    });
    expect(mockStake.getUserPoolStake).toHaveBeenCalledWith({
      user: TEST_WALLET,
      poolId: 206,
    });
    expect(mockStake.getClaimableReward).toHaveBeenCalledWith({
      poolId: 206,
      staker: TEST_WALLET,
    });
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

  it("stakes amount into pool", async () => {
    mockStake.stake.mockResolvedValue({ hash: "0xstake" });

    const result = await stakeTokens(TEST_POOL_ADDRESS, 1000n);
    expect(result).toEqual({ hash: "0xstake" });
    expect(mockStake.stake).toHaveBeenCalledWith({ poolId: 206, amount: 1000n });
  });

  it("throws on zero amount", async () => {
    await expect(stakeTokens(TEST_POOL_ADDRESS, 0n)).rejects.toThrow();
  });
});

describe("useStaking — unstakeTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unstakes amount from pool", async () => {
    mockStake.unstake.mockResolvedValue({ hash: "0xunstake" });

    const result = await unstakeTokens(TEST_POOL_ADDRESS, 500n);
    expect(result).toEqual({ hash: "0xunstake" });
    expect(mockStake.unstake).toHaveBeenCalledWith({ poolId: 206, amount: 500n });
  });
});

describe("useStaking — claimRewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims pending rewards", async () => {
    mockStake.claim.mockResolvedValue({ hash: "0xclaim" });

    const result = await claimRewards(TEST_POOL_ADDRESS);
    expect(result).toEqual({ hash: "0xclaim" });
    expect(mockStake.claim).toHaveBeenCalledWith({ poolId: 206 });
  });
});
