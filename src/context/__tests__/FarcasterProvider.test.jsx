import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { useFarcaster } from "@/hooks/useFarcaster.js";
import { FarcasterProvider } from "@/context/FarcasterProvider.jsx";

// Mock auth-kit: no SIWF session (MiniApp user never signs in via auth-kit)
vi.mock("@farcaster/auth-kit", () => ({
  useProfile: () => ({ isAuthenticated: false, profile: null }),
  useSignIn: () => ({ signOut: vi.fn() }),
}));

// Mutable ref — set BEFORE rendering to control what the sdk.context resolves to
const { mockCtxValue } = vi.hoisted(() => ({
  mockCtxValue: { current: null },
}));

vi.mock("@farcaster/miniapp-sdk", () => ({
  sdk: {
    get context() {
      const val = mockCtxValue.current;
      return new Promise((resolve) => setTimeout(() => resolve(val), 5));
    },
  },
}));

/** Helper that renders a consumer inside FarcasterProvider */
function ProfileDisplay() {
  const { isAuthenticated, profile } = useFarcaster();
  return (
    <div>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="fid">{profile?.fid ?? "none"}</span>
    </div>
  );
}

describe("FarcasterProvider — MiniApp FID resolution", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockCtxValue.current = null;
    sessionStorage.clear();
  });

  it("returns null profile when no auth-kit session and no miniapp context", async () => {
    await act(async () => {
      render(
        <FarcasterProvider>
          <ProfileDisplay />
        </FarcasterProvider>,
      );
    });
    // Wait for the async context resolution to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(screen.getByTestId("fid").textContent).toBe("none");
  });

  it("surfaces FID from MiniApp SDK context even without SIWF", async () => {
    mockCtxValue.current = { user: { fid: 12345 } };

    await act(async () => {
      render(
        <FarcasterProvider>
          <ProfileDisplay />
        </FarcasterProvider>,
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(screen.getByTestId("fid").textContent).toBe("12345");
  });

  it("marks user as authenticated when MiniApp FID is available", async () => {
    mockCtxValue.current = { user: { fid: 99999 } };

    await act(async () => {
      render(
        <FarcasterProvider>
          <ProfileDisplay />
        </FarcasterProvider>,
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
  });
});
