import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestWrapper } from "@/test/wrapper.jsx";
import { PoolStats } from "@/components/staking/PoolStats.jsx";
import { StakeInput } from "@/components/staking/StakeInput.jsx";
import { UnstakeInput } from "@/components/staking/UnstakeInput.jsx";
import { ClaimRewards } from "@/components/staking/ClaimRewards.jsx";
import { StakingPool } from "@/components/staking/StakingPool.jsx";

describe("PoolStats", () => {
  it("renders 3 stat values", () => {
    render(
      <PoolStats totalStaked="1000" seasonEnd="3d 5h" poolSize="500" />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("3d 5h")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it('shows "—" for defaults', () => {
    render(<PoolStats />, { wrapper: TestWrapper });
    const dashes = screen.getAllByText("—");
    expect(dashes).toHaveLength(3);
  });

  it("applies font-mono tabular-nums to numeric values", () => {
    render(
      <PoolStats totalStaked="1000" seasonEnd="3d" poolSize="500" />,
      { wrapper: TestWrapper },
    );
    const numerics = screen.getAllByTestId("stat-value");
    expect(numerics).toHaveLength(3);
    for (const el of numerics) {
      expect(el.className).toMatch(/font-mono/);
      expect(el.className).toMatch(/tabular-nums/);
    }
  });

  it("shows $SEKI symbol below totalStaked value", () => {
    render(
      <PoolStats totalStaked="1000" seasonEnd="3d" poolSize="500" />,
      { wrapper: TestWrapper },
    );
    const sekiSymbols = screen.getAllByText("$SEKI");
    expect(sekiSymbols.length).toBeGreaterThanOrEqual(1);
  });

  it("shows $DOJO symbol below poolSize value", () => {
    render(
      <PoolStats totalStaked="1000" seasonEnd="3d" poolSize="500" />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("$DOJO")).toBeInTheDocument();
  });

  it("renders token symbols with stat-symbol testid", () => {
    render(
      <PoolStats totalStaked="1000" seasonEnd="3d" poolSize="500" />,
      { wrapper: TestWrapper },
    );
    const symbols = screen.getAllByTestId("stat-symbol");
    expect(symbols).toHaveLength(2); // $SEKI and $DOJO (seasonEnd has no symbol)
  });
});

describe("StakeInput", () => {
  it("button is disabled when input is empty", () => {
    render(<StakeInput onStake={vi.fn()} />, { wrapper: TestWrapper });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("button is enabled with valid amount", async () => {
    const user = userEvent.setup();
    render(<StakeInput onStake={vi.fn()} />, { wrapper: TestWrapper });

    const input = screen.getByPlaceholderText("0.00");
    await user.type(input, "10");

    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
  });

  it("calls onStake(amount) and clears input on submit", async () => {
    const user = userEvent.setup();
    const onStake = vi.fn();
    render(<StakeInput onStake={onStake} />, { wrapper: TestWrapper });

    const input = screen.getByPlaceholderText("0.00");
    await user.type(input, "25");
    await user.click(screen.getByRole("button"));

    expect(onStake).toHaveBeenCalledWith("25");
    expect(input).toHaveValue(null); // cleared after submit
  });

  it("button is disabled when isLoading", async () => {
    const user = userEvent.setup();
    render(<StakeInput onStake={vi.fn()} isLoading />, { wrapper: TestWrapper });

    const input = screen.getByPlaceholderText("0.00");
    await user.type(input, "10");

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("button is disabled when amount is 0", async () => {
    const user = userEvent.setup();
    render(<StakeInput onStake={vi.fn()} />, { wrapper: TestWrapper });

    const input = screen.getByPlaceholderText("0.00");
    await user.type(input, "0");

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("displays balance with font-mono tabular-nums", () => {
    render(<StakeInput balance="42.5" onStake={vi.fn()} />, { wrapper: TestWrapper });
    const balanceEl = screen.getByTestId("balance-value");
    expect(balanceEl.textContent).toContain("42.5");
    expect(balanceEl.className).toMatch(/font-mono/);
    expect(balanceEl.className).toMatch(/tabular-nums/);
  });
});

describe("UnstakeInput", () => {
  it("renders destructive alert", () => {
    render(<UnstakeInput onUnstake={vi.fn()} />, { wrapper: TestWrapper });
    expect(screen.getByText(/Unstaking stops/)).toBeInTheDocument();
  });

  it("renders alert text inside AlertDescription for proper grid layout", () => {
    render(<UnstakeInput onUnstake={vi.fn()} />, { wrapper: TestWrapper });
    const alertText = screen.getByText(/Unstaking stops/);
    // AlertDescription renders with col-start-2 so text lands in the 1fr column
    expect(alertText.className).toMatch(/col-start-2/);
  });

  it("button is disabled when input is empty", () => {
    render(<UnstakeInput onUnstake={vi.fn()} />, { wrapper: TestWrapper });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("calls onUnstake(amount) and clears input", async () => {
    const user = userEvent.setup();
    const onUnstake = vi.fn();
    render(<UnstakeInput onUnstake={onUnstake} />, { wrapper: TestWrapper });

    const input = screen.getByPlaceholderText("0.00");
    await user.type(input, "5");
    await user.click(screen.getByRole("button"));

    expect(onUnstake).toHaveBeenCalledWith("5");
    expect(input).toHaveValue(null);
  });

  it("displays staked amount with font-mono tabular-nums", () => {
    render(<UnstakeInput staked="100" onUnstake={vi.fn()} />, { wrapper: TestWrapper });
    const stakedEl = screen.getByTestId("staked-value");
    expect(stakedEl.textContent).toContain("100");
    expect(stakedEl.className).toMatch(/font-mono/);
    expect(stakedEl.className).toMatch(/tabular-nums/);
  });
});

describe("ClaimRewards", () => {
  it("renders pending amount with font-mono tabular-nums", () => {
    render(<ClaimRewards pendingAmount="12.5" onClaim={vi.fn()} />, { wrapper: TestWrapper });
    const amountEl = screen.getByTestId("pending-value");
    expect(amountEl.textContent).toBe("12.5");
    expect(amountEl.className).toMatch(/font-mono/);
    expect(amountEl.className).toMatch(/tabular-nums/);
    expect(screen.getByText("$DOJO")).toBeInTheDocument();
  });

  it('button is disabled when pendingAmount is "0"', () => {
    render(<ClaimRewards pendingAmount="0" onClaim={vi.fn()} />, { wrapper: TestWrapper });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("button is enabled when pendingAmount is non-zero", () => {
    render(<ClaimRewards pendingAmount="5" onClaim={vi.fn()} />, { wrapper: TestWrapper });
    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
  });

  it("calls onClaim when clicked", async () => {
    const user = userEvent.setup();
    const onClaim = vi.fn();
    render(<ClaimRewards pendingAmount="5" onClaim={onClaim} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button"));
    expect(onClaim).toHaveBeenCalledTimes(1);
  });

  it("button is disabled when isLoading", () => {
    render(
      <ClaimRewards pendingAmount="5" onClaim={vi.fn()} isLoading />,
      { wrapper: TestWrapper },
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});

describe("StakingPool", () => {
  it("default tab is Stake", () => {
    render(<StakingPool />, { wrapper: TestWrapper });
    // StakeInput renders the balance text
    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
  });

  it("clicking Claim tab shows ClaimRewards panel", async () => {
    const user = userEvent.setup();
    render(
      <StakingPool userPosition={{ pendingRewards: "7.5" }} />,
      { wrapper: TestWrapper },
    );

    // Click the Claim tab trigger
    const claimTab = screen.getByRole("tab", { name: /claim/i });
    await user.click(claimTab);

    await waitFor(() => {
      expect(screen.getByText("7.5")).toBeInTheDocument();
    });
    // PoolStats also renders $DOJO, so use getAllByText
    const dojoLabels = screen.getAllByText("$DOJO");
    expect(dojoLabels.length).toBeGreaterThanOrEqual(2);
  });

  it("clicking Unstake tab shows UnstakeInput panel", async () => {
    const user = userEvent.setup();
    render(
      <StakingPool userPosition={{ staked: "50" }} />,
      { wrapper: TestWrapper },
    );

    const unstakeTab = screen.getByRole("tab", { name: /unstake/i });
    await user.click(unstakeTab);

    await waitFor(() => {
      expect(screen.getByText(/Unstaking stops/)).toBeInTheDocument();
    });
  });

  it("shows user staked amount above tabs when staked > 0", () => {
    render(
      <StakingPool userPosition={{ staked: "250.5", pendingRewards: "0" }} />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("Your Stake")).toBeInTheDocument();
    expect(screen.getByText("250.5")).toBeInTheDocument();
  });

  it("does not show staked amount when staked is 0", () => {
    render(
      <StakingPool userPosition={{ staked: "0", pendingRewards: "0" }} />,
      { wrapper: TestWrapper },
    );
    expect(screen.queryByText("Your Stake")).not.toBeInTheDocument();
  });

  it("passes callbacks through to child components", async () => {
    const user = userEvent.setup();
    const onStake = vi.fn();
    render(<StakingPool onStake={onStake} />, { wrapper: TestWrapper });

    const input = screen.getByPlaceholderText("0.00");
    await user.type(input, "10");
    await user.click(screen.getByRole("button", { name: /stake/i }));

    expect(onStake).toHaveBeenCalledWith("10");
  });
});
