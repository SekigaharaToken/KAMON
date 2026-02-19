import { describe, it, expect } from "vitest";
import {
  normalizeOnChatMessages,
  getOnChatFallbackScore,
} from "@/hooks/useOnChat.js";

describe("useOnChat — normalizeOnChatMessages", () => {
  it("returns 0 for zero messages", () => {
    expect(normalizeOnChatMessages(0, 100)).toBe(0);
  });

  it("returns 100 for max messages", () => {
    expect(normalizeOnChatMessages(100, 100)).toBe(100);
  });

  it("returns correct percentage", () => {
    expect(normalizeOnChatMessages(50, 200)).toBe(25);
  });

  it("caps at 100", () => {
    expect(normalizeOnChatMessages(200, 100)).toBe(100);
  });

  it("returns 0 for null maxMessages", () => {
    expect(normalizeOnChatMessages(50, 0)).toBe(0);
    expect(normalizeOnChatMessages(50, null)).toBe(0);
  });

  it("returns 0 for null userMessages", () => {
    expect(normalizeOnChatMessages(null, 100)).toBe(0);
  });
});

describe("useOnChat — getOnChatFallbackScore", () => {
  it("returns null when OnChat is unavailable", () => {
    expect(getOnChatFallbackScore()).toBeNull();
  });

  it("signals fallback scoring mode", () => {
    // When OnChat returns null, scoring.js should use 40/60 fallback
    const result = getOnChatFallbackScore();
    expect(result).toBeNull();
  });
});
