import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Home, ArrowLeftRight, Layers, Trophy } from "lucide-react";
import { TestWrapper } from "@/test/wrapper.jsx";
import { BottomNav } from "../BottomNav.jsx";

const items = [
  { to: "/", icon: Home, labelKey: "nav.home" },
  { to: "/swap", icon: ArrowLeftRight, labelKey: "nav.swap" },
  { to: "/staking", icon: Layers, labelKey: "nav.staking" },
  { to: "/leaderboard", icon: Trophy, labelKey: "nav.leaderboard" },
];

function renderNav(initialPath = "/") {
  return render(
    <TestWrapper initialEntries={[initialPath]}>
      <BottomNav items={items} />
    </TestWrapper>,
  );
}

describe("BottomNav", () => {
  it("renders all tab items with i18n labels", () => {
    renderNav();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Swap")).toBeInTheDocument();
    expect(screen.getByText("Staking")).toBeInTheDocument();
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });

  it("renders correct number of links", () => {
    renderNav();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
  });

  it("applies active styling to current route", () => {
    renderNav("/staking");
    const stakingLink = screen.getByText("Staking").closest("a");
    expect(stakingLink.className).toContain("text-foreground");
    expect(stakingLink.className).toContain("font-medium");
  });

  it("applies inactive styling to non-current routes", () => {
    renderNav("/staking");
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink.className).toContain("text-muted-foreground");
  });
});
