import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Home, ArrowLeftRight, Layers, Trophy, Activity, MessageCircle } from "lucide-react";
import { TestWrapper } from "@/test/wrapper.jsx";
import { BottomNav } from "../BottomNav.jsx";

const items = [
  { to: "/", icon: Home, labelKey: "nav.home" },
  { to: "/swap", icon: ArrowLeftRight, labelKey: "nav.swap" },
  { to: "/staking", icon: Layers, labelKey: "nav.staking" },
  { to: "/leaderboard", icon: Trophy, labelKey: "nav.leaderboard" },
];

const fullItems = [
  { to: "/", icon: Home, labelKey: "nav.home" },
  { to: "/swap", icon: ArrowLeftRight, labelKey: "nav.swap" },
  { to: "/staking", icon: Layers, labelKey: "nav.staking" },
  { to: "/leaderboard", icon: Trophy, labelKey: "nav.leaderboard" },
  { to: "/activity", icon: Activity, labelKey: "nav.activity" },
  { to: "/chat", icon: MessageCircle, labelKey: "nav.chat" },
];

function renderNav(initialPath = "/") {
  return render(
    <TestWrapper initialEntries={[initialPath]}>
      <BottomNav items={items} />
    </TestWrapper>,
  );
}

function renderFullNav(initialPath = "/") {
  return render(
    <TestWrapper initialEntries={[initialPath]}>
      <BottomNav items={fullItems} />
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

describe("BottomNav with Activity and Chat", () => {
  it("renders Activity and Chat labels", () => {
    renderFullNav();
    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
  });

  it("renders 6 links when Activity and Chat are included", () => {
    renderFullNav();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
  });

  it("Activity link points to /activity", () => {
    renderFullNav();
    const activityLink = screen.getByText("Activity").closest("a");
    expect(activityLink).toHaveAttribute("href", "/activity");
  });

  it("Chat link points to /chat", () => {
    renderFullNav();
    const chatLink = screen.getByText("Chat").closest("a");
    expect(chatLink).toHaveAttribute("href", "/chat");
  });

  it("applies active styling to Activity when on /activity", () => {
    renderFullNav("/activity");
    const activityLink = screen.getByText("Activity").closest("a");
    expect(activityLink.className).toContain("text-foreground");
    expect(activityLink.className).toContain("font-medium");
  });

  it("applies active styling to Chat when on /chat", () => {
    renderFullNav("/chat");
    const chatLink = screen.getByText("Chat").closest("a");
    expect(chatLink.className).toContain("text-foreground");
    expect(chatLink.className).toContain("font-medium");
  });

  it("applies inactive styling to Activity when not on /activity", () => {
    renderFullNav("/");
    const activityLink = screen.getByText("Activity").closest("a");
    expect(activityLink.className).toContain("text-muted-foreground");
  });

  it("applies inactive styling to Chat when not on /chat", () => {
    renderFullNav("/");
    const chatLink = screen.getByText("Chat").closest("a");
    expect(chatLink.className).toContain("text-muted-foreground");
  });

  it("applies a 6-column grid layout when 6 items are provided", () => {
    const { container } = renderFullNav();
    const grid = container.querySelector(".grid");
    expect(grid.className).toContain("grid-cols-6");
  });
});
