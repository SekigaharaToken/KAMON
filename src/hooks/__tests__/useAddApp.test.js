import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockAddFrame = vi.fn();
const mockUseMiniAppContext = vi.fn(() => ({
  isInMiniApp: true,
  isAppAdded: false,
}));

vi.mock("@farcaster/miniapp-sdk", () => ({
  default: {
    actions: { addFrame: (...args) => mockAddFrame(...args) },
  },
}));

vi.mock("@/hooks/useMiniAppContext.js", () => ({
  useMiniAppContext: (...args) => mockUseMiniAppContext(...args),
}));

const { useAddApp } = await import("../useAddApp.js");

describe("useAddApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddFrame.mockResolvedValue(undefined);
    mockUseMiniAppContext.mockReturnValue({ isInMiniApp: true, isAppAdded: false });
  });

  it("returns isAdded false initially", () => {
    const { result } = renderHook(() => useAddApp());
    expect(result.current.isAdded).toBe(false);
    expect(result.current.isInMiniApp).toBe(true);
  });

  it("calls sdk.actions.addFrame on addApp", async () => {
    const { result } = renderHook(() => useAddApp());
    await act(() => result.current.addApp());
    expect(mockAddFrame).toHaveBeenCalledTimes(1);
    expect(result.current.isAdded).toBe(true);
  });

  it("sets error when addFrame rejects", async () => {
    mockAddFrame.mockRejectedValue(new Error("User rejected"));
    const { result } = renderHook(() => useAddApp());
    await act(() => result.current.addApp());
    expect(result.current.error).toBe("User rejected");
    expect(result.current.isAdded).toBe(false);
  });

  it("does nothing when not in MiniApp", async () => {
    mockUseMiniAppContext.mockReturnValue({ isInMiniApp: false, isAppAdded: false });
    const { result } = renderHook(() => useAddApp());
    await act(() => result.current.addApp());
    expect(mockAddFrame).not.toHaveBeenCalled();
  });

  it("returns isAdded true when already added", () => {
    mockUseMiniAppContext.mockReturnValue({ isInMiniApp: true, isAppAdded: true });
    const { result } = renderHook(() => useAddApp());
    expect(result.current.isAdded).toBe(true);
  });

  it("clears error via clearError", async () => {
    mockAddFrame.mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useAddApp());
    await act(() => result.current.addApp());
    expect(result.current.error).toBe("fail");
    act(() => result.current.clearError());
    expect(result.current.error).toBe(null);
  });
});
