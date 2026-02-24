import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock embla-carousel-react to avoid matchMedia issues in jsdom
vi.mock("embla-carousel-react", () => ({
  default: () => [vi.fn(), null],
}));

// Mock HouseCard to a simple stub for isolation
vi.mock("@/components/house/HouseCard.jsx", () => ({
  HouseCard: ({ house, onJoin }) => (
    <div data-testid={`house-card-${house.id}`} data-onjoin={!!onJoin}>
      {house.id}
    </div>
  ),
}));

import { HouseCarousel } from "@/components/house/HouseCarousel.jsx";

describe("HouseCarousel", () => {
  it("renders all 5 House cards", () => {
    render(<HouseCarousel onJoin={vi.fn()} />, { wrapper: TestWrapper });

    expect(screen.getByTestId("house-card-honoo")).toBeInTheDocument();
    expect(screen.getByTestId("house-card-mizu")).toBeInTheDocument();
    expect(screen.getByTestId("house-card-mori")).toBeInTheDocument();
    expect(screen.getByTestId("house-card-tsuchi")).toBeInTheDocument();
    expect(screen.getByTestId("house-card-kaze")).toBeInTheDocument();
  });

  it("renders 5 dot indicator buttons", () => {
    render(<HouseCarousel onJoin={vi.fn()} />, { wrapper: TestWrapper });

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
  });

  it('has role="region" and aria-label', () => {
    render(<HouseCarousel onJoin={vi.fn()} />, { wrapper: TestWrapper });

    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-label", "House carousel");
  });

  it("first dot button has aria-selected=true by default", () => {
    render(<HouseCarousel onJoin={vi.fn()} />, { wrapper: TestWrapper });

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  });

  it("passes onJoin prop to HouseCard", () => {
    const onJoin = vi.fn();
    render(<HouseCarousel onJoin={onJoin} />, { wrapper: TestWrapper });

    const card = screen.getByTestId("house-card-honoo");
    expect(card.dataset.onjoin).toBe("true");
  });

  it("renders tablist for dot indicators", () => {
    render(<HouseCarousel onJoin={vi.fn()} />, { wrapper: TestWrapper });
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});
