import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useLocalDismiss } from "../useLocalDismiss.js";

const KEY = "test:dismissed";

describe("useLocalDismiss", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns false when key is not set", () => {
    const { result } = renderHook(() => useLocalDismiss(KEY));
    expect(result.current[0]).toBe(false);
  });

  it("returns true when key is already set in localStorage", () => {
    localStorage.setItem(KEY, "1");
    const { result } = renderHook(() => useLocalDismiss(KEY));
    expect(result.current[0]).toBe(true);
  });

  it("dismiss() sets localStorage and updates state", () => {
    const { result } = renderHook(() => useLocalDismiss(KEY));
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);
    expect(localStorage.getItem(KEY)).toBe("1");
  });

  it("persists across re-renders after dismiss", () => {
    const { result, rerender } = renderHook(() => useLocalDismiss(KEY));

    act(() => {
      result.current[1]();
    });

    rerender();
    expect(result.current[0]).toBe(true);
  });
});
