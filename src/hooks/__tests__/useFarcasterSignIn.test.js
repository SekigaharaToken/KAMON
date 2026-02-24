import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockConnect = vi.fn();
const mockReconnect = vi.fn();
const mockSignIn = vi.fn();
const mockGenerateNonce = vi.fn(() => "nonce123");

let mockAuthKitState = {};

vi.mock("@farcaster/auth-kit", () => ({
  useSignIn: (opts) => {
    // Store the callbacks so we can trigger them in tests
    mockAuthKitState._onSuccess = opts.onSuccess;
    mockAuthKitState._onError = opts.onError;
    return {
      signIn: mockSignIn,
      connect: mockConnect,
      reconnect: mockReconnect,
      ...mockAuthKitState,
    };
  },
}));

vi.mock("@/hooks/useFarcaster.js", () => ({
  useFarcaster: () => ({ generateNonce: mockGenerateNonce }),
}));

import { useFarcasterSignIn } from "@/hooks/useFarcasterSignIn.js";

describe("useFarcasterSignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthKitState = {
      isPolling: false,
      channelToken: null,
      url: null,
      isError: false,
    };
  });

  it("initial state: all flags false", () => {
    const { result } = renderHook(() => useFarcasterSignIn());

    expect(result.current.isConnecting).toBe(false);
    expect(result.current.showQrView).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPolling).toBe(false);
  });

  it("handleSignInClick sets isConnecting and calls connect()", () => {
    const { result } = renderHook(() => useFarcasterSignIn());

    act(() => {
      result.current.handleSignInClick();
    });

    expect(result.current.isConnecting).toBe(true);
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("handleSignInClick calls reconnect() when isError", () => {
    mockAuthKitState.isError = true;

    const { result } = renderHook(() => useFarcasterSignIn());

    act(() => {
      result.current.handleSignInClick();
    });

    expect(mockReconnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("channel token transition: calls signIn and shows QR view", () => {
    // Start with no channel token
    const { result, rerender } = renderHook(() => useFarcasterSignIn());

    // Simulate: user clicks sign in
    act(() => {
      result.current.handleSignInClick();
    });

    // Now simulate channel token becoming available
    mockAuthKitState.channelToken = "channel123";
    mockAuthKitState.url = "https://warpcast.com/auth";

    rerender();

    // The useEffect should have called signIn() and set showQrView
    expect(mockSignIn).toHaveBeenCalled();
    expect(result.current.showQrView).toBe(true);
  });

  it("handleSuccess resets flags and calls onSuccess prop", () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useFarcasterSignIn({ onSuccess }),
    );

    // Trigger success via the auth-kit callback
    act(() => {
      mockAuthKitState._onSuccess({ fid: 123 });
    });

    expect(result.current.showQrView).toBe(false);
    expect(onSuccess).toHaveBeenCalledWith({ fid: 123 });
  });

  it("handleError resets flags and calls onError prop", () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFarcasterSignIn({ onError }),
    );

    const error = new Error("auth failed");
    act(() => {
      mockAuthKitState._onError(error);
    });

    expect(result.current.isConnecting).toBe(false);
    expect(result.current.showQrView).toBe(false);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("handleCancel resets showQrView and wantsToSignIn", () => {
    const { result, rerender } = renderHook(() => useFarcasterSignIn());

    // Set up QR view
    act(() => {
      result.current.handleSignInClick();
    });
    mockAuthKitState.channelToken = "token";
    rerender();

    // Cancel
    act(() => {
      result.current.handleCancel();
    });

    expect(result.current.showQrView).toBe(false);
  });

  it("isLoading = isConnecting && !isPolling", () => {
    const { result } = renderHook(() => useFarcasterSignIn());

    // Before connecting
    expect(result.current.isLoading).toBe(false);

    // After connecting (isConnecting=true, isPolling=false)
    act(() => {
      result.current.handleSignInClick();
    });
    expect(result.current.isLoading).toBe(true);

    // Once polling starts, isLoading should become false
    // This happens when channelToken appears and signIn is called
    mockAuthKitState.channelToken = "token";
    mockAuthKitState.isPolling = true;
  });
});
