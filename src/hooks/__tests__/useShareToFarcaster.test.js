import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockComposeCast = vi.fn();
const mockUseMiniAppContext = vi.fn(() => ({
  isInMiniApp: true,
}));

vi.mock("@farcaster/miniapp-sdk", () => ({
  default: {
    actions: { composeCast: (...args) => mockComposeCast(...args) },
  },
}));

vi.mock("@/hooks/useMiniAppContext.js", () => ({
  useMiniAppContext: (...args) => mockUseMiniAppContext(...args),
}));

const { useShareToFarcaster } = await import("../useShareToFarcaster.js");

describe("useShareToFarcaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComposeCast.mockResolvedValue(undefined);
    mockUseMiniAppContext.mockReturnValue({ isInMiniApp: true });
  });

  it("calls composeCast with text in MiniApp", async () => {
    const { result } = renderHook(() => useShareToFarcaster());
    await act(() => result.current.share("Hello world"));
    expect(mockComposeCast).toHaveBeenCalledWith({ text: "Hello world" });
  });

  it("includes embed URL when provided", async () => {
    const { result } = renderHook(() => useShareToFarcaster());
    await act(() => result.current.share("Check this out", "https://example.com"));
    expect(mockComposeCast).toHaveBeenCalledWith({
      text: "Check this out",
      embeds: ["https://example.com"],
    });
  });

  it("includes channelKey when configured", async () => {
    const { result } = renderHook(() => useShareToFarcaster({ channelKey: "hunt" }));
    await act(() => result.current.share("Post to hunt"));
    expect(mockComposeCast).toHaveBeenCalledWith({
      text: "Post to hunt",
      channelKey: "hunt",
    });
  });

  it("opens Warpcast URL when not in MiniApp", async () => {
    mockUseMiniAppContext.mockReturnValue({ isInMiniApp: false });
    const mockOpen = vi.fn();
    vi.stubGlobal("open", mockOpen);

    const { result } = renderHook(() => useShareToFarcaster({ channelKey: "hunt" }));
    await act(() => result.current.share("Hello", "https://example.com"));

    expect(mockComposeCast).not.toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledTimes(1);
    const url = mockOpen.mock.calls[0][0];
    expect(url).toContain("warpcast.com/~/compose");
    expect(url).toContain("text=Hello");
    expect(url).toContain("embeds%5B%5D=https%3A%2F%2Fexample.com");
    expect(url).toContain("channelKey=hunt");

    vi.unstubAllGlobals();
  });
});
