import { describe, it, expect, beforeEach } from "vitest";
import {
  savePreviousWinner,
  getPreviousWinner,
  clearPreviousWinner,
} from "@/lib/seasonHistory.js";

const STORAGE_KEY = "kamon:previous_winner";

describe("seasonHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getPreviousWinner", () => {
    it("returns null when nothing is stored", () => {
      expect(getPreviousWinner()).toBeNull();
    });

    it("returns null when stored JSON is malformed", () => {
      localStorage.setItem(STORAGE_KEY, "not-json{");
      expect(getPreviousWinner()).toBeNull();
    });

    it("returns null when localStorage throws", () => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = () => {
        throw new Error("disabled");
      };
      expect(getPreviousWinner()).toBeNull();
      Storage.prototype.getItem = orig;
    });

    it("returns stored winner object", () => {
      const data = {
        seasonId: 1,
        winner: { houseId: "honoo", score: 480, memberCount: 42 },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(getPreviousWinner()).toEqual(data);
    });
  });

  describe("savePreviousWinner", () => {
    it("persists seasonId and winner to localStorage", () => {
      savePreviousWinner(1, { houseId: "mizu", score: 320, memberCount: 17 });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      expect(stored).toEqual({
        seasonId: 1,
        winner: { houseId: "mizu", score: 320, memberCount: 17 },
      });
    });

    it("overwrites a previous entry", () => {
      savePreviousWinner(1, { houseId: "mizu", score: 100, memberCount: 5 });
      savePreviousWinner(2, { houseId: "honoo", score: 200, memberCount: 10 });
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      expect(stored.seasonId).toBe(2);
      expect(stored.winner.houseId).toBe("honoo");
    });

    it("does not throw when localStorage throws", () => {
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error("full");
      };
      expect(() =>
        savePreviousWinner(1, { houseId: "kaze", score: 50, memberCount: 3 }),
      ).not.toThrow();
      Storage.prototype.setItem = orig;
    });

    it("getPreviousWinner returns saved data after save", () => {
      savePreviousWinner(3, { houseId: "tsuchi", score: 999, memberCount: 88 });
      const result = getPreviousWinner();
      expect(result).not.toBeNull();
      expect(result.seasonId).toBe(3);
      expect(result.winner.houseId).toBe("tsuchi");
    });
  });

  describe("clearPreviousWinner", () => {
    it("removes the stored winner", () => {
      savePreviousWinner(1, { houseId: "mori", score: 150, memberCount: 22 });
      clearPreviousWinner();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it("getPreviousWinner returns null after clear", () => {
      savePreviousWinner(1, { houseId: "mori", score: 150, memberCount: 22 });
      clearPreviousWinner();
      expect(getPreviousWinner()).toBeNull();
    });

    it("does not throw when nothing is stored", () => {
      expect(() => clearPreviousWinner()).not.toThrow();
    });

    it("does not throw when localStorage throws", () => {
      const orig = Storage.prototype.removeItem;
      Storage.prototype.removeItem = () => {
        throw new Error("locked");
      };
      expect(() => clearPreviousWinner()).not.toThrow();
      Storage.prototype.removeItem = orig;
    });
  });
});
