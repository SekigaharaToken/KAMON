import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/components/admin/AdminPanel.jsx", () => ({
  AdminPanel: ({ isOperator, seasonStatus, weekNumber }) => (
    <div
      data-testid="admin-panel"
      data-operator={String(isOperator)}
      data-season-status={seasonStatus}
      data-week-number={String(weekNumber)}
    >
      AdminPanel
    </div>
  ),
}));

// SeasonSnapshot captures rankings and exposes an onConfirm trigger
vi.mock("@/components/admin/SeasonSnapshot.jsx", () => ({
  SeasonSnapshot: ({ rankings, onConfirm, isLoading }) => (
    <div
      data-testid="season-snapshot"
      data-rankings={JSON.stringify(rankings)}
      data-loading={String(isLoading)}
    >
      <button data-testid="confirm-snapshot" onClick={onConfirm}>
        Confirm Snapshot
      </button>
    </div>
  ),
}));

// AirdropTrigger captures winnerMembers, txHash, and exposes an onTrigger trigger
vi.mock("@/components/admin/AirdropTrigger.jsx", () => ({
  AirdropTrigger: ({ winnerMembers, onTrigger, isLoading, txHash }) => (
    <div
      data-testid="airdrop-trigger"
      data-members={JSON.stringify(winnerMembers)}
      data-loading={String(isLoading)}
      data-tx-hash={txHash ?? ""}
    >
      <button data-testid="execute-airdrop" onClick={onTrigger}>
        Execute Airdrop
      </button>
    </div>
  ),
}));

vi.mock("@/config/contracts.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    OPERATOR_ADDRESS: "0xoperator000000000000000000000000000000001",
    STAKING_POOL_ADDRESS: "0xpool0000000000000000000000000000000000001",
    DOJO_TOKEN_ADDRESS: "0xdojo00000000000000000000000000000000001",
    MERKLE_DISTRIBUTOR_ADDRESS: "0xdistributor0000000000000000000000000001",
  };
});

vi.mock("@/hooks/useWalletAddress.js", () => ({
  useWalletAddress: vi.fn(() => ({ address: null, isConnected: false, canTransact: false })),
}));

vi.mock("@/hooks/useSeason.js", () => ({
  getSeasonStatus: vi.fn(() => "active"),
  getWeekNumber: vi.fn(() => 3),
  getSeasonProgress: vi.fn(() => 25),
}));

// Mock leaderboard data — honoo is the winner (rank 0) with 2 members
vi.mock("@/hooks/useLeaderboard.js", () => ({
  useLeaderboard: vi.fn(() => ({
    rankings: [
      {
        house: { id: "honoo", symbol: "炎" },
        memberCount: 2,
        score: 80,
        totalStaked: 5000,
        members: [
          "0xmember10000000000000000000000000000001",
          "0xmember20000000000000000000000000000002",
        ],
      },
      {
        house: { id: "mizu", symbol: "水" },
        memberCount: 1,
        score: 40,
        totalStaked: 2000,
        members: ["0xmember30000000000000000000000000000003"],
      },
    ],
    isLoading: false,
    isError: false,
    lastUpdated: Date.now(),
  })),
}));

// Mock merkleAirdrop — createAirdrop resolves with a tx hash
vi.mock("@/lib/merkleAirdrop.js", () => ({
  buildMerkleTree: vi.fn(() => ({ root: "0xroot", getProof: () => [] })),
  createAirdrop: vi.fn(() =>
    Promise.resolve("0xtxhash111111111111111111111111111111111111")
  ),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: { startTime: 1n }, isLoading: false })),
  };
});

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import AdminPage from "@/pages/AdminPage.jsx";
import { useWalletAddress } from "@/hooks/useWalletAddress.js";
import { useLeaderboard } from "@/hooks/useLeaderboard.js";
import { createAirdrop } from "@/lib/merkleAirdrop.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_RANKINGS = [
  {
    house: { id: "honoo", symbol: "炎" },
    memberCount: 2,
    score: 80,
    totalStaked: 5000,
    members: [
      "0xmember10000000000000000000000000000001",
      "0xmember20000000000000000000000000000002",
    ],
  },
  {
    house: { id: "mizu", symbol: "水" },
    memberCount: 1,
    score: 40,
    totalStaked: 2000,
    members: ["0xmember30000000000000000000000000000003"],
  },
];

function renderAsOperator() {
  useWalletAddress.mockReturnValue({
    address: "0xOperator000000000000000000000000000000001",
    isConnected: true,
    canTransact: true,
  });
  return render(<AdminPage />, { wrapper: TestWrapper });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mocks after clearAllMocks resets implementations
    useWalletAddress.mockReturnValue({ address: null, isConnected: false, canTransact: false });
    useLeaderboard.mockReturnValue({
      rankings: MOCK_RANKINGS,
      isLoading: false,
      isError: false,
      lastUpdated: Date.now(),
    });
    createAirdrop.mockResolvedValue("0xtxhash111111111111111111111111111111111111");
  });

  it("renders without crashing", () => {
    render(<AdminPage />, { wrapper: TestWrapper });
    expect(screen.getByTestId("admin-panel")).toBeInTheDocument();
  });

  it("passes isOperator={false} to AdminPanel when no wallet connected", () => {
    render(<AdminPage />, { wrapper: TestWrapper });
    const panel = screen.getByTestId("admin-panel");
    expect(panel.dataset.operator).toBe("false");
  });

  it("passes isOperator={false} when connected wallet does not match OPERATOR_ADDRESS", () => {
    useWalletAddress.mockReturnValue({
      address: "0xdeadbeef000000000000000000000000000000ff",
      isConnected: true,
      canTransact: true,
    });
    render(<AdminPage />, { wrapper: TestWrapper });
    const panel = screen.getByTestId("admin-panel");
    expect(panel.dataset.operator).toBe("false");
  });

  it("passes isOperator={true} when connected wallet matches OPERATOR_ADDRESS", () => {
    useWalletAddress.mockReturnValue({
      address: "0xOperator000000000000000000000000000000001", // mixed-case — should match
      isConnected: true,
      canTransact: true,
    });
    render(<AdminPage />, { wrapper: TestWrapper });
    const panel = screen.getByTestId("admin-panel");
    expect(panel.dataset.operator).toBe("true");
  });

  it("passes seasonStatus and weekNumber derived from useSeason to AdminPanel", () => {
    useWalletAddress.mockReturnValue({
      address: "0xOperator000000000000000000000000000000001",
      isConnected: true,
      canTransact: true,
    });
    render(<AdminPage />, { wrapper: TestWrapper });
    const panel = screen.getByTestId("admin-panel");
    expect(panel.dataset.seasonStatus).toBe("active");
    expect(panel.dataset.weekNumber).toBe("3");
  });

  it("renders SeasonSnapshot and AirdropTrigger when isOperator is true", () => {
    renderAsOperator();
    expect(screen.getByTestId("season-snapshot")).toBeInTheDocument();
    expect(screen.getByTestId("airdrop-trigger")).toBeInTheDocument();
  });

  it("does NOT render SeasonSnapshot and AirdropTrigger when isOperator is false", () => {
    render(<AdminPage />, { wrapper: TestWrapper });
    expect(screen.queryByTestId("season-snapshot")).not.toBeInTheDocument();
    expect(screen.queryByTestId("airdrop-trigger")).not.toBeInTheDocument();
  });

  // ─── Leaderboard data wiring ───────────────────────────────────────────────

  it("passes live leaderboard rankings to SeasonSnapshot", () => {
    renderAsOperator();
    const snapshot = screen.getByTestId("season-snapshot");
    const rankings = JSON.parse(snapshot.dataset.rankings);
    expect(rankings.length).toBeGreaterThan(0);
    expect(rankings[0].house.id).toBe("honoo");
  });

  // ─── Snapshot confirm → winner members wiring ─────────────────────────────

  it("AirdropTrigger receives empty members before snapshot is confirmed", () => {
    renderAsOperator();
    const trigger = screen.getByTestId("airdrop-trigger");
    const members = JSON.parse(trigger.dataset.members);
    expect(members).toEqual([]);
  });

  it("after confirming snapshot, passes winner member addresses to AirdropTrigger", async () => {
    renderAsOperator();
    fireEvent.click(screen.getByTestId("confirm-snapshot"));

    await waitFor(() => {
      const trigger = screen.getByTestId("airdrop-trigger");
      const members = JSON.parse(trigger.dataset.members);
      // Winner is honoo with 2 members
      expect(members.length).toBe(2);
    });
  });

  // ─── Airdrop execution ────────────────────────────────────────────────────

  it("calls createAirdrop with correct args when onTrigger fires after snapshot", async () => {
    renderAsOperator();

    // Confirm snapshot first to populate winner members
    fireEvent.click(screen.getByTestId("confirm-snapshot"));
    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId("airdrop-trigger").dataset.members).length).toBe(2);
    });

    // Execute airdrop
    fireEvent.click(screen.getByTestId("execute-airdrop"));

    await waitFor(() => {
      expect(createAirdrop).toHaveBeenCalledOnce();
      const [args] = createAirdrop.mock.calls[0];
      expect(args.tokenAddress).toBe("0xdojo00000000000000000000000000000000001");
      expect(args.recipients).toHaveLength(2);
      expect(args.title).toMatch(/Season/i);
    });
  });

  it("shows txHash in AirdropTrigger after successful airdrop", async () => {
    renderAsOperator();

    fireEvent.click(screen.getByTestId("confirm-snapshot"));
    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId("airdrop-trigger").dataset.members).length).toBe(2);
    });

    fireEvent.click(screen.getByTestId("execute-airdrop"));

    await waitFor(() => {
      const trigger = screen.getByTestId("airdrop-trigger");
      expect(trigger.dataset.txHash).toBe("0xtxhash111111111111111111111111111111111111");
    });
  });

  it("does not call createAirdrop when winner members list is empty", () => {
    renderAsOperator();
    // Do NOT confirm snapshot — members remain empty
    fireEvent.click(screen.getByTestId("execute-airdrop"));
    expect(createAirdrop).not.toHaveBeenCalled();
  });
});
