import { describe, it, expect } from "vitest";
import { generateKamonSVG } from "@/lib/kamon.js";

describe("generateKamonSVG", () => {
  const wallet1 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const wallet2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  it("returns valid SVG string for honoo + wallet", () => {
    const svg = generateKamonSVG("honoo", wallet1);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("is deterministic (same wallet + house = same SVG)", () => {
    const svg1 = generateKamonSVG("honoo", wallet1);
    const svg2 = generateKamonSVG("honoo", wallet1);
    expect(svg1).toBe(svg2);
  });

  it("produces different SVGs for different wallets", () => {
    const svg1 = generateKamonSVG("honoo", wallet1);
    const svg2 = generateKamonSVG("honoo", wallet2);
    expect(svg1).not.toBe(svg2);
  });

  it("produces different SVGs for different Houses", () => {
    const svg1 = generateKamonSVG("honoo", wallet1);
    const svg2 = generateKamonSVG("mizu", wallet1);
    expect(svg1).not.toBe(svg2);
  });

  it("uses House-specific colors", () => {
    const honoo = generateKamonSVG("honoo", wallet1);
    const mizu = generateKamonSVG("mizu", wallet1);
    expect(honoo).toContain("#c92a22"); // honoo primary
    expect(mizu).toContain("#94bcad"); // mizu primary
  });

  it("returns empty string for missing inputs", () => {
    expect(generateKamonSVG(null, wallet1)).toBe("");
    expect(generateKamonSVG("honoo", null)).toBe("");
    expect(generateKamonSVG("", "")).toBe("");
  });
});
