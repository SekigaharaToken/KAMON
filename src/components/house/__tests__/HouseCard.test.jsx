import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";
import { HouseCard } from "@/components/house/HouseCard.jsx";

const mockHouse = {
  id: "honoo",
  element: "fire",
  symbol: "炎",
  nameKey: "house.honoo",
  descriptionKey: "house.description.honoo",
  cssClass: "house-honoo",
  colors: { primary: "#c92a22", secondary: "#55011f", accent: "#dccf8e" },
};

describe("HouseCard", () => {
  it("renders the House name", () => {
    render(
      <HouseCard house={mockHouse} supply={247} price="10.5" onJoin={vi.fn()} />,
      { wrapper: TestWrapper },
    );
    // i18n resolves "house.honoo" to "炎 Honoo"
    expect(screen.getByText(/Honoo/)).toBeInTheDocument();
  });

  it("renders the House symbol", () => {
    render(
      <HouseCard house={mockHouse} supply={247} price="10.5" onJoin={vi.fn()} />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("炎")).toBeInTheDocument();
  });

  it("renders the member count", () => {
    render(
      <HouseCard house={mockHouse} supply={247} price="10.5" onJoin={vi.fn()} />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText(/247/)).toBeInTheDocument();
  });

  it("renders the mint price", () => {
    render(
      <HouseCard house={mockHouse} supply={247} price="10.5" onJoin={vi.fn()} />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText(/10\.5/)).toBeInTheDocument();
  });

  it("renders a join button", () => {
    render(
      <HouseCard house={mockHouse} supply={247} price="10.5" onJoin={vi.fn()} />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
  });

  it("calls onJoin when join button clicked", async () => {
    const onJoin = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(
      <HouseCard house={mockHouse} supply={247} price="10.5" onJoin={onJoin} />,
      { wrapper: TestWrapper },
    );

    await user.click(screen.getByRole("button", { name: /join/i }));
    expect(onJoin).toHaveBeenCalledWith("honoo");
  });
});
