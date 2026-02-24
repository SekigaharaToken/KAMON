import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

describe("OnChatWidget", () => {
  afterEach(() => {
    document.querySelectorAll('script[src*="onchat"]').forEach((s) => s.remove());
  });

  it("renders loading state initially", async () => {
    const { OnChatWidget } = await import("@/components/onchat/OnChatWidget.jsx");
    render(<OnChatWidget channel="sekigahara" />, { wrapper: TestWrapper });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders the widget container div", async () => {
    const { OnChatWidget } = await import("@/components/onchat/OnChatWidget.jsx");
    const { container } = render(<OnChatWidget channel="sekigahara" />, { wrapper: TestWrapper });
    expect(container.querySelector("#onchat-widget")).toBeInTheDocument();
  });
});
