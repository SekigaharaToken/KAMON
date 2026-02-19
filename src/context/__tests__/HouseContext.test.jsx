import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HouseProvider } from "@/context/HouseContext.jsx";
import { useHouse } from "@/hooks/useHouse.js";

// Test component that exposes context values
function HouseDisplay() {
  const { selectedHouse, houseConfig, selectHouse } = useHouse();
  return (
    <div>
      <span data-testid="selected">{selectedHouse ?? "none"}</span>
      <span data-testid="config">{houseConfig?.element ?? "no-config"}</span>
      <button onClick={() => selectHouse("honoo")}>Select Honoo</button>
      <button onClick={() => selectHouse("mizu")}>Select Mizu</button>
      <button onClick={() => selectHouse(null)}>Clear</button>
    </div>
  );
}

describe("HouseContext", () => {
  beforeEach(() => {
    localStorage.clear();
    // Remove any House CSS classes from document
    document.documentElement.className = "";
  });

  it("defaults to no selection", () => {
    render(
      <HouseProvider>
        <HouseDisplay />
      </HouseProvider>,
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("none");
    expect(screen.getByTestId("config")).toHaveTextContent("no-config");
  });

  it("selects a House and updates context", async () => {
    const user = userEvent.setup();
    render(
      <HouseProvider>
        <HouseDisplay />
      </HouseProvider>,
    );

    await user.click(screen.getByText("Select Honoo"));

    expect(screen.getByTestId("selected")).toHaveTextContent("honoo");
    expect(screen.getByTestId("config")).toHaveTextContent("fire");
  });

  it("persists selection to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <HouseProvider>
        <HouseDisplay />
      </HouseProvider>,
    );

    await user.click(screen.getByText("Select Mizu"));

    expect(localStorage.getItem("kamon:selected_house")).toBe("mizu");
  });

  it("restores selection from localStorage on mount", () => {
    localStorage.setItem("kamon:selected_house", "mori");

    render(
      <HouseProvider>
        <HouseDisplay />
      </HouseProvider>,
    );

    expect(screen.getByTestId("selected")).toHaveTextContent("mori");
    expect(screen.getByTestId("config")).toHaveTextContent("forest");
  });

  it("applies CSS class to document.documentElement", async () => {
    const user = userEvent.setup();
    render(
      <HouseProvider>
        <HouseDisplay />
      </HouseProvider>,
    );

    await user.click(screen.getByText("Select Honoo"));

    expect(document.documentElement.classList.contains("house-honoo")).toBe(true);
  });

  it("removes previous House CSS class when switching", async () => {
    const user = userEvent.setup();
    render(
      <HouseProvider>
        <HouseDisplay />
      </HouseProvider>,
    );

    await user.click(screen.getByText("Select Honoo"));
    expect(document.documentElement.classList.contains("house-honoo")).toBe(true);

    await user.click(screen.getByText("Select Mizu"));
    expect(document.documentElement.classList.contains("house-honoo")).toBe(false);
    expect(document.documentElement.classList.contains("house-mizu")).toBe(true);
  });

  it("clears selection", async () => {
    const user = userEvent.setup();
    render(
      <HouseProvider>
        <HouseDisplay />
      </HouseProvider>,
    );

    await user.click(screen.getByText("Select Honoo"));
    await user.click(screen.getByText("Clear"));

    expect(screen.getByTestId("selected")).toHaveTextContent("none");
    expect(document.documentElement.classList.contains("house-honoo")).toBe(false);
  });
});
