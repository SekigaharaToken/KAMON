import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestWrapper } from "@/test/wrapper.jsx";

// Mock child components
vi.mock("@/components/admin/AdminPanel.jsx", () => ({
  AdminPanel: ({ isOperator }) => (
    <div data-testid="admin-panel" data-operator={String(isOperator)}>
      AdminPanel
    </div>
  ),
}));

vi.mock("@/components/admin/SeasonSnapshot.jsx", () => ({
  SeasonSnapshot: () => <div>SeasonSnapshot</div>,
}));

vi.mock("@/components/admin/AirdropTrigger.jsx", () => ({
  AirdropTrigger: () => <div>AirdropTrigger</div>,
}));

import AdminPage from "@/pages/AdminPage.jsx";

describe("AdminPage", () => {
  it("renders without crashing", () => {
    render(<AdminPage />, { wrapper: TestWrapper });
    expect(screen.getByTestId("admin-panel")).toBeInTheDocument();
  });

  it("passes isOperator={false} to AdminPanel", () => {
    render(<AdminPage />, { wrapper: TestWrapper });
    const panel = screen.getByTestId("admin-panel");
    expect(panel.dataset.operator).toBe("false");
  });
});
