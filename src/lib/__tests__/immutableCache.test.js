import { describe, it, expect, beforeEach } from "vitest";
import { getCached, setCached, setCachedOnce } from "@/lib/immutableCache.js";

describe("immutableCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getCached", () => {
    it("returns null when key is missing", () => {
      expect(getCached("nonexistent")).toBeNull();
    });

    it("returns parsed JSON when present", () => {
      localStorage.setItem("kamon:immutable:foo", JSON.stringify({ bar: 42 }));
      expect(getCached("foo")).toEqual({ bar: 42 });
    });

    it("returns string values", () => {
      localStorage.setItem("kamon:immutable:str", JSON.stringify("hello"));
      expect(getCached("str")).toBe("hello");
    });

    it("returns null on parse error", () => {
      localStorage.setItem("kamon:immutable:bad", "not-json{");
      expect(getCached("bad")).toBeNull();
    });

    it("returns null when localStorage throws", () => {
      const orig = Storage.prototype.getItem;
      Storage.prototype.getItem = () => { throw new Error("disabled"); };
      expect(getCached("any")).toBeNull();
      Storage.prototype.getItem = orig;
    });
  });

  describe("setCached", () => {
    it("writes JSON under kamon:immutable: prefix", () => {
      setCached("key1", { value: 123 });
      expect(localStorage.getItem("kamon:immutable:key1")).toBe(JSON.stringify({ value: 123 }));
    });

    it("overwrites existing value", () => {
      setCached("key2", "first");
      setCached("key2", "second");
      expect(JSON.parse(localStorage.getItem("kamon:immutable:key2"))).toBe("second");
    });

    it("does not throw on storage error", () => {
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = () => { throw new Error("full"); };
      expect(() => setCached("key3", "val")).not.toThrow();
      Storage.prototype.setItem = orig;
    });
  });

  describe("setCachedOnce", () => {
    it("writes when value is truthy", () => {
      setCachedOnce("flag", true);
      expect(getCached("flag")).toBe(true);
    });

    it("skips when value is falsy (null)", () => {
      setCachedOnce("flag2", null);
      expect(getCached("flag2")).toBeNull();
    });

    it("skips when value is falsy (false)", () => {
      setCachedOnce("flag3", false);
      expect(getCached("flag3")).toBeNull();
    });

    it("skips when value is falsy (0)", () => {
      setCachedOnce("flag4", 0);
      expect(getCached("flag4")).toBeNull();
    });

    it("skips when value is falsy (empty string)", () => {
      setCachedOnce("flag5", "");
      expect(getCached("flag5")).toBeNull();
    });

    it("writes truthy non-boolean values", () => {
      setCachedOnce("obj", { data: "yes" });
      expect(getCached("obj")).toEqual({ data: "yes" });
    });
  });
});
