import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestWrapper } from "@/test/wrapper.jsx";

const mockSwitchToBase = vi.fn();
const mockUseNetworkGuard = vi.fn();

vi.mock("@/hooks/useNetworkGuard.js", () => ({
  useNetworkGuard: (...args) => mockUseNetworkGuard(...args),
}));

import { NetworkGuardBanner } from "@/components/layout/NetworkGuardBanner.jsx";

describe("NetworkGuardBanner", () => {
  it("returns null when isWrongNetwork=false", () => {
    mockUseNetworkGuard.mockReturnValue({
      isWrongNetwork: false,
      switchToBase: mockSwitchToBase,
    });

    const { container } = render(<NetworkGuardBanner />, { wrapper: TestWrapper });
    expect(container.firstChild).toBeNull();
  });

  it("renders alert banner when isWrongNetwork=true", () => {
    mockUseNetworkGuard.mockReturnValue({
      isWrongNetwork: true,
      switchToBase: mockSwitchToBase,
    });

    render(<NetworkGuardBanner />, { wrapper: TestWrapper });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders switch button when wrong network", () => {
    mockUseNetworkGuard.mockReturnValue({
      isWrongNetwork: true,
      switchToBase: mockSwitchToBase,
    });

    render(<NetworkGuardBanner />, { wrapper: TestWrapper });
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("click calls switchToBase", async () => {
    const user = userEvent.setup();
    mockUseNetworkGuard.mockReturnValue({
      isWrongNetwork: true,
      switchToBase: mockSwitchToBase,
    });

    render(<NetworkGuardBanner />, { wrapper: TestWrapper });
    await user.click(screen.getByRole("button"));

    expect(mockSwitchToBase).toHaveBeenCalledTimes(1);
  });

  it('has role="alert"', () => {
    mockUseNetworkGuard.mockReturnValue({
      isWrongNetwork: true,
      switchToBase: mockSwitchToBase,
    });

    render(<NetworkGuardBanner />, { wrapper: TestWrapper });
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });
});
