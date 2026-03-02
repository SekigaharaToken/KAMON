import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";
import { PreviousWinner } from "@/components/leaderboard/PreviousWinner.jsx";

describe("PreviousWinner", () => {
  it("renders nothing when winner is null", () => {
    const { container } = render(<PreviousWinner winner={null} />, {
      wrapper: TestWrapper,
    });
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when winner is undefined", () => {
    const { container } = render(<PreviousWinner />, {
      wrapper: TestWrapper,
    });
    expect(container.firstChild).toBeNull();
  });

  it("renders the previousWinner i18n title when winner is present", () => {
    render(
      <PreviousWinner
        winner={{ houseId: "honoo", score: 480, memberCount: 42 }}
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("Previous Season Winner")).toBeInTheDocument();
  });

  it("renders house symbol for the winning house", () => {
    render(
      <PreviousWinner
        winner={{ houseId: "honoo", score: 480, memberCount: 42 }}
      />,
      { wrapper: TestWrapper },
    );
    // honoo symbol is 炎
    expect(screen.getByText("炎")).toBeInTheDocument();
  });

  it("renders house name for the winning house", () => {
    render(
      <PreviousWinner
        winner={{ houseId: "mizu", score: 310, memberCount: 15 }}
      />,
      { wrapper: TestWrapper },
    );
    // mizu name via i18n key "house.mizu" = "水 Mizu"
    expect(screen.getByText("水 Mizu")).toBeInTheDocument();
  });

  it("renders the winner score", () => {
    render(
      <PreviousWinner
        winner={{ houseId: "honoo", score: 480, memberCount: 42 }}
      />,
      { wrapper: TestWrapper },
    );
    // Score appears in both the stats line and the badge circle
    const scoreElements = screen.getAllByText(/480/);
    expect(scoreElements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the member count", () => {
    render(
      <PreviousWinner
        winner={{ houseId: "honoo", score: 480, memberCount: 42 }}
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it("renders correctly for each house (mori)", () => {
    render(
      <PreviousWinner
        winner={{ houseId: "mori", score: 250, memberCount: 8 }}
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("森")).toBeInTheDocument();
    expect(screen.getByText("森 Mori")).toBeInTheDocument();
  });

  it("renders correctly for tsuchi", () => {
    render(
      <PreviousWinner
        winner={{ houseId: "tsuchi", score: 120, memberCount: 3 }}
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("土")).toBeInTheDocument();
  });

  it("renders correctly for kaze", () => {
    render(
      <PreviousWinner
        winner={{ houseId: "kaze", score: 75, memberCount: 6 }}
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("風")).toBeInTheDocument();
  });

  it("renders nothing for an unknown houseId", () => {
    const { container } = render(
      <PreviousWinner
        winner={{ houseId: "unknown", score: 100, memberCount: 1 }}
      />,
      { wrapper: TestWrapper },
    );
    expect(container.firstChild).toBeNull();
  });
});
