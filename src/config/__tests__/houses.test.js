import { describe, it, expect } from "vitest";
import { HOUSES, HOUSE_LIST, getHouseByAddress, HOUSE_MAX_SUPPLY, HOUSE_STARTING_PRICE } from "@/config/houses.js";

describe("houses config", () => {
  it("defines exactly 5 Houses", () => {
    expect(Object.keys(HOUSES)).toHaveLength(5);
    expect(HOUSE_LIST).toHaveLength(5);
  });

  it("includes all 5 elements", () => {
    const elements = HOUSE_LIST.map((h) => h.element);
    expect(elements).toContain("fire");
    expect(elements).toContain("water");
    expect(elements).toContain("forest");
    expect(elements).toContain("earth");
    expect(elements).toContain("wind");
  });

  it.each(HOUSE_LIST)("$id has all required fields", (house) => {
    expect(house.id).toBeTruthy();
    expect(house.element).toBeTruthy();
    expect(house.symbol).toBeTruthy();
    expect(house.nameKey).toMatch(/^house\./);
    expect(house.descriptionKey).toMatch(/^house\.description\./);
    expect(house.cssClass).toMatch(/^house-/);
    expect(house.colors).toBeDefined();
    expect(house.colors.primary).toBeTruthy();
    expect(house.colors.secondary).toBeTruthy();
    expect(house.colors.accent).toBeTruthy();
  });

  it("HOUSE_LIST matches HOUSES values", () => {
    expect(HOUSE_LIST).toEqual(Object.values(HOUSES));
  });

  it("getHouseByAddress returns null for unknown address", () => {
    expect(getHouseByAddress("0xdeadbeef")).toBeNull();
  });

  it("has correct constants", () => {
    expect(HOUSE_MAX_SUPPLY).toBe(1000);
    expect(HOUSE_STARTING_PRICE).toBe(10);
  });
});
