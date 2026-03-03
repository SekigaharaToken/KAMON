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

  it("shows up to 4 decimals for values < 10", () => {
    expect(formatTokenAmount("0.00123456")).toBe("0.0012");
    expect(formatTokenAmount("1.23456789")).toBe("1.2345");
    expect(formatTokenAmount("9.99999")).toBe("9.9999");
  });

  it("shows up to 3 decimals for values 10–99", () => {
    expect(formatTokenAmount("10.123456")).toBe("10.123");
    expect(formatTokenAmount("99.99999")).toBe("99.999");
  });

  it("shows up to 2 decimals for values 100–999", () => {
    expect(formatTokenAmount("100.123456")).toBe("100.12");
    expect(formatTokenAmount("999.999")).toBe("999.99");
  });

  it("shows up to 1 decimal for values 1000–9999", () => {
    expect(formatTokenAmount("1000.123")).toBe("1000.1");
    expect(formatTokenAmount("9999.99")).toBe("9999.9");
  });

  it("shows 0 decimals for values >= 10000", () => {
    expect(formatTokenAmount("10000.123")).toBe("10000");
    expect(formatTokenAmount("123456.789")).toBe("123456");
  });

  it("strips trailing zeros", () => {
    expect(formatTokenAmount("1.10000")).toBe("1.1");
    expect(formatTokenAmount("10.00")).toBe("10");
    expect(formatTokenAmount("100.50")).toBe("100.5");
  });

  it("handles full 18-decimal wei-formatted strings", () => {
    // formatUnits(1000000000000000000n, 18) = "1.0"
    expect(formatTokenAmount("1.0")).toBe("1");
    // formatUnits(1234567890123456789n, 18) = "1.234567890123456789"
    expect(formatTokenAmount("1.234567890123456789")).toBe("1.2345");
  });

  it("handles very small fractional values", () => {
    expect(formatTokenAmount("0.000000001")).toBe("0");
    expect(formatTokenAmount("0.0001")).toBe("0.0001");
    expect(formatTokenAmount("0.00019")).toBe("0.0001");
  });

  it("accepts numeric input", () => {
    expect(formatTokenAmount(42.567)).toBe("42.567");
    expect(formatTokenAmount(1234.5678)).toBe("1234.5");
  });
});
