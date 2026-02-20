import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

vi.mock("@/components/onchat/OnChatWidget.jsx", () => ({
  OnChatWidget: ({ channel }) => (
    <div data-testid="onchat-widget">OnChat: {channel}</div>
  ),
}));

vi.mock("@/config/chains.js", () => ({
  isLocalDev: false,
  activeChain: { id: 8453, name: "Base" },
}));

const ChatPage = (await import("@/pages/ChatPage.jsx")).default;

describe("ChatPage", () => {
  it("renders the page heading", () => {
    render(<ChatPage />, { wrapper: TestWrapper });
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });

  it("renders the OnChat widget", () => {
    render(<ChatPage />, { wrapper: TestWrapper });
    const widget = screen.getByTestId("onchat-widget");
    expect(widget).toBeInTheDocument();
    expect(within(widget).getByText(/sekigahara/i)).toBeInTheDocument();
  });
});
