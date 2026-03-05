import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { TestWrapper } from "@/test/wrapper.jsx";
import { HowItWorks } from "../HowItWorks.jsx";

const STORAGE_KEY = "kamon:how-it-works-dismissed";

function renderComponent() {
  return render(
    <TestWrapper>
      <HowItWorks />
    </TestWrapper>,
  );
}

describe("HowItWorks", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the bar when not dismissed", () => {
    renderComponent();
    expect(
      screen.getByText("New here? Learn how KAMON works →"),
    ).toBeInTheDocument();
  });

  it("does not render bar when dismissed", () => {
    localStorage.setItem(STORAGE_KEY, "1");
    renderComponent();
    expect(
      screen.queryByText("New here? Learn how KAMON works →"),
    ).not.toBeInTheDocument();
  });

  it("bar has bottom-16 positioning class", () => {
    const { container } = renderComponent();
    const bar = container.querySelector("[data-slot='how-it-works-bar']");
    expect(bar.className).toContain("bottom-16");
  });

  it("active pagination dot is elongated (w-6) while others are w-2", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText("New here? Learn how KAMON works →"));

    const dots = document.querySelectorAll("[data-slot='sheet-content'] .rounded-full");
    expect(dots[0].className).toContain("w-6");
    expect(dots[1].className).toContain("w-2");
    expect(dots[2].className).toContain("w-2");
  });

  it("clicking X button dismisses bar permanently", async () => {
    const user = userEvent.setup();
    renderComponent();

    const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
    await user.click(dismissBtn);

    expect(
      screen.queryByText("New here? Learn how KAMON works →"),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("1");
  });

  it("clicking bar text opens the sheet", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText("New here? Learn how KAMON works →"));

    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("Choose Your House")).toBeInTheDocument();
  });

  it("sheet navigates through pages with Next/Back/Done", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Open sheet
    await user.click(screen.getByText("New here? Learn how KAMON works →"));

    // Page 1
    expect(screen.getByText("Choose Your House")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Pick one of 5 elemental Houses and buy the House NFT to join.",
      ),
    ).toBeInTheDocument();

    // Go to page 2
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Stake & Compete")).toBeInTheDocument();

    // Go back
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Choose Your House")).toBeInTheDocument();

    // Go forward again to page 2, then page 3
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Seasonal Rewards")).toBeInTheDocument();

    // Done button on last page
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });
});
