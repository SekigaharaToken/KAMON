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

  // --- Per-element geometry tests ---

  it("all 5 houses produce valid SVG with path elements", () => {
    const houses = ["honoo", "mizu", "mori", "tsuchi", "kaze"];
    for (const house of houses) {
      const svg = generateKamonSVG(house, wallet1);
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
      expect(svg).toContain("<path");
      expect(svg).toContain('viewBox="0 0 200 200"');
    }
  });

  it("honoo SVG uses cubic bezier curves for flame petals (C command in path d)", () => {
    const svg = generateKamonSVG("honoo", wallet1);
    // Flame petals need cubic beziers for organic flame shape
    expect(svg).toMatch(/d="[^"]*C[^"]*"/);
  });

  it("mizu SVG uses arc or quadratic curves for wave/ripple forms (A or Q command in path d)", () => {
    const svg = generateKamonSVG("mizu", wallet1);
    // Water uses arcs or quadratic beziers for flowing wave forms
    expect(svg).toMatch(/d="[^"]*(A|Q)[^"]*"/);
  });

  it("mori SVG uses quadratic bezier curves for leaf/organic shapes (Q command in path d)", () => {
    const svg = generateKamonSVG("mori", wallet1);
    // Leaf shapes need quadratic beziers
    expect(svg).toMatch(/d="[^"]*Q[^"]*"/);
  });

  it("tsuchi SVG uses only line-to commands for angular/crystal geometry (L command, no curves)", () => {
    const svg = generateKamonSVG("tsuchi", wallet1);
    // Crystal facets are purely angular — straight lines only
    expect(svg).toMatch(/d="[^"]*L[^"]*"/);
    expect(svg).not.toMatch(/d="[^"]*(C|Q|A)[^"]*"/);
  });

  it("kaze SVG uses cubic bezier curves for spiral/ribbon forms (C command in path d)", () => {
    const svg = generateKamonSVG("kaze", wallet1);
    // Spiral swooshes need cubic beziers
    expect(svg).toMatch(/d="[^"]*C[^"]*"/);
  });

  it("each house produces geometrically distinct path data from every other house", () => {
    const houses = ["honoo", "mizu", "mori", "tsuchi", "kaze"];
    const svgs = houses.map((h) => generateKamonSVG(h, wallet1));

    // Extract all path d attributes from each SVG
    const extractPaths = (svg) => {
      const matches = [...svg.matchAll(/d="([^"]*)"/g)];
      return matches.map((m) => m[1]).join("|");
    };

    const pathSets = svgs.map(extractPaths);

    // Every pair of houses must have different path geometry
    for (let i = 0; i < pathSets.length; i++) {
      for (let j = i + 1; j < pathSets.length; j++) {
        expect(pathSets[i]).not.toBe(pathSets[j]);
      }
    }
  });

  it("determinism holds for all 5 houses across two calls each", () => {
    const houses = ["honoo", "mizu", "mori", "tsuchi", "kaze"];
    for (const house of houses) {
      const svg1 = generateKamonSVG(house, wallet1);
      const svg2 = generateKamonSVG(house, wallet1);
      expect(svg1).toBe(svg2);
    }
  });

  it("different wallets produce different path geometry for each house", () => {
    const houses = ["honoo", "mizu", "mori", "tsuchi", "kaze"];
    for (const house of houses) {
      const svg1 = generateKamonSVG(house, wallet1);
      const svg2 = generateKamonSVG(house, wallet2);
      expect(svg1).not.toBe(svg2);
    }
  });

  it("honoo and kaze both use cubic beziers but produce different path data", () => {
    const honoo = generateKamonSVG("honoo", wallet1);
    const kaze = generateKamonSVG("kaze", wallet1);
    // Both use C commands but geometry differs
    expect(honoo).toMatch(/d="[^"]*C[^"]*"/);
    expect(kaze).toMatch(/d="[^"]*C[^"]*"/);
    expect(honoo).not.toBe(kaze);
  });

  it("SVG has correct width, height attributes (200x200)", () => {
    const houses = ["honoo", "mizu", "mori", "tsuchi", "kaze"];
    for (const house of houses) {
      const svg = generateKamonSVG(house, wallet1);
      expect(svg).toContain('width="200"');
      expect(svg).toContain('height="200"');
    }
  });
});
