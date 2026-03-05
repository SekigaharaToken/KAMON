import { describe, it, expect } from "vitest";
import { formatTokenAmount } from "@/lib/formatTokenAmount.js";

describe("formatTokenAmount", () => {
  it("returns '0' for nullish or zero input", () => {
    expect(formatTokenAmount(null)).toBe("0");
    expect(formatTokenAmount(undefined)).toBe("0");
    expect(formatTokenAmount("0")).toBe("0");
    expect(formatTokenAmount(0)).toBe("0");
  });

  it("returns dash for dash placeholder", () => {
    expect(formatTokenAmount("—")).toBe("—");
  });

  it("shows up to 6 decimals for values < 10", () => {
    expect(formatTokenAmount("0.00000123")).toBe("0.000001");
    expect(formatTokenAmount("0.001234")).toBe("0.001234");
    expect(formatTokenAmount("1.23456789")).toBe("1.234567");
    expect(formatTokenAmount("9.99999999")).toBe("9.999999");
  });

  it("shows up to 5 decimals for values 10–99", () => {
    expect(formatTokenAmount("10.123456")).toBe("10.12345");
    expect(formatTokenAmount("99.999999")).toBe("99.99999");
  });

  it("shows up to 4 decimals for values 100–999", () => {
    expect(formatTokenAmount("100.123456")).toBe("100.1234");
    expect(formatTokenAmount("999.999999")).toBe("999.9999");
  });

  it("shows up to 3 decimals for values 1000–9999", () => {
    expect(formatTokenAmount("1000.123456")).toBe("1000.123");
    expect(formatTokenAmount("9999.999")).toBe("9999.999");
  });

  it("shows up to 2 decimals for values 10k–99999", () => {
    expect(formatTokenAmount("10000.123")).toBe("10000.12");
    expect(formatTokenAmount("99999.999")).toBe("99999.99");
  });

  it("shows up to 1 decimal for values 100k–999k", () => {
    expect(formatTokenAmount("100000.123")).toBe("100000.1");
    expect(formatTokenAmount("999999.99")).toBe("999999.9");
  });

  it("shows 0 decimals for values >= 1M", () => {
    expect(formatTokenAmount("1000000.123")).toBe("1000000");
    expect(formatTokenAmount("99999999.789")).toBe("99999999");
  });

  it("strips trailing zeros", () => {
    expect(formatTokenAmount("1.10000")).toBe("1.1");
    expect(formatTokenAmount("10.00")).toBe("10");
    expect(formatTokenAmount("100.50")).toBe("100.5");
  });

  it("handles full 18-decimal wei-formatted strings", () => {
    expect(formatTokenAmount("1.0")).toBe("1");
    expect(formatTokenAmount("1.234567890123456789")).toBe("1.234567");
  });

  it("handles very small fractional values", () => {
    expect(formatTokenAmount("0.0000001")).toBe("0");
    expect(formatTokenAmount("0.000001")).toBe("0.000001");
    expect(formatTokenAmount("0.0001")).toBe("0.0001");
    expect(formatTokenAmount("0.00019")).toBe("0.00019");
  });

  it("accepts numeric input", () => {
    expect(formatTokenAmount(42.567)).toBe("42.567");
    expect(formatTokenAmount(1234.5678)).toBe("1234.567");
  });
});
