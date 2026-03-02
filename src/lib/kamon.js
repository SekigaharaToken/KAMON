/**
 * Generative Kamon SVG renderer.
 * Produces deterministic SVGs from wallet address + House element.
 * Each house uses distinct geometry: honoo (flame/cubic), mizu (wave/arc),
 * mori (leaf/quadratic), tsuchi (crystal/linear), kaze (spiral/cubic).
 */

/**
 * Simple xorshift PRNG seeded from wallet address bytes.
 */
function createRng(seed) {
  let state = seed;
  return function next() {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return ((state >>> 0) / 0xffffffff);
  };
}

/**
 * Hash a wallet address string to a 32-bit seed.
 */
function addressToSeed(address) {
  const hex = address.replace("0x", "").toLowerCase();
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = ((hash << 5) - hash + hex.charCodeAt(i)) | 0;
  }
  return hash || 1; // avoid zero seed
}

/** Round to 3 decimal places to keep SVG output compact. */
function r(n) {
  return Math.round(n * 1000) / 1000;
}

/**
 * honoo (fire) — flame petals using cubic bezier curves.
 * Each petal is a spear-like flame with swept control points.
 */
function renderHonoo(rng, cx, cy, fill, stroke) {
  const petalCount = 5 + Math.floor(rng() * 3); // 5–7 petals
  const outerR = 55 + rng() * 25;               // 55–80
  const innerR = 18 + rng() * 12;               // 18–30
  const lean = 0.25 + rng() * 0.25;             // lateral control point offset 0.25–0.5

  let paths = "";
  for (let i = 0; i < petalCount; i++) {
    const angle = (Math.PI * 2 * i) / petalCount - Math.PI / 2;
    const perpAngle = angle + Math.PI / 2;

    // Tip of petal
    const tx = r(cx + Math.cos(angle) * outerR);
    const ty = r(cy + Math.sin(angle) * outerR);

    // Base left and right at innerR
    const baseAngleL = angle - Math.PI / petalCount;
    const baseAngleR = angle + Math.PI / petalCount;
    const blx = r(cx + Math.cos(baseAngleL) * innerR);
    const bly = r(cy + Math.sin(baseAngleL) * innerR);
    const brx = r(cx + Math.cos(baseAngleR) * innerR);
    const bry = r(cy + Math.sin(baseAngleR) * innerR);

    // Cubic bezier control points: push outward laterally at mid-radius
    const midR = (outerR + innerR) * 0.5;
    const cp1x = r(cx + Math.cos(angle) * midR + Math.cos(perpAngle) * midR * lean);
    const cp1y = r(cy + Math.sin(angle) * midR + Math.sin(perpAngle) * midR * lean);
    const cp2x = r(cx + Math.cos(angle) * midR - Math.cos(perpAngle) * midR * lean);
    const cp2y = r(cy + Math.sin(angle) * midR - Math.sin(perpAngle) * midR * lean);

    paths += `<path d="M${blx},${bly} C${cp1x},${cp1y} ${tx},${ty} ${tx},${ty} C${tx},${ty} ${cp2x},${cp2y} ${brx},${bry} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="0.9"/>`;
  }

  // Central ember circle
  const embR = r(innerR * 0.7);
  return `${paths}\n  <circle cx="${cx}" cy="${cy}" r="${embR}" fill="${stroke}" opacity="0.7"/>`;
}

/**
 * mizu (water) — ripple rings + wave arcs using A (arc) commands.
 * Concentric arcs create a flowing, rippled water surface.
 */
function renderMizu(rng, cx, cy, fill, stroke) {
  const ringCount = 3 + Math.floor(rng() * 3);  // 3–5 rings
  const maxR = 70 + rng() * 15;                  // 70–85
  const waveArcCount = 4 + Math.floor(rng() * 4); // 4–7 wave arcs
  const waveDepth = 8 + rng() * 12;              // ripple amplitude 8–20

  let paths = "";

  // Ripple rings: each ring is two arcs forming a broken circle shape
  for (let i = 0; i < ringCount; i++) {
    const ringR = r(maxR * ((i + 1) / ringCount));
    const sweep = i % 2 === 0 ? 1 : 0;
    // Draw a near-complete arc (330°), leaving a small gap for aesthetics
    const startAngle = (rng() * Math.PI * 2);
    const endAngle = startAngle + Math.PI * (1.8 + rng() * 0.15);
    const sx = r(cx + Math.cos(startAngle) * ringR);
    const sy = r(cy + Math.sin(startAngle) * ringR);
    const ex = r(cx + Math.cos(endAngle) * ringR);
    const ey = r(cy + Math.sin(endAngle) * ringR);
    paths += `<path d="M${sx},${sy} A${ringR},${ringR} 0 1,${sweep} ${ex},${ey}" fill="none" stroke="${fill}" stroke-width="${r(1.5 + i * 0.4)}" opacity="${r(0.6 - i * 0.08)}"/>`;
  }

  // Wave arcs: short curved strokes arranged radially
  for (let i = 0; i < waveArcCount; i++) {
    const angle = (Math.PI * 2 * i) / waveArcCount + rng() * 0.3;
    const dist = 20 + rng() * 30;
    const arcW = r(12 + rng() * 12);
    const arcH = r(waveDepth * (0.6 + rng() * 0.8));
    const wx = r(cx + Math.cos(angle) * dist);
    const wy = r(cy + Math.sin(angle) * dist);
    const ex = r(wx + Math.cos(angle + Math.PI / 2) * arcW);
    const ey = r(wy + Math.sin(angle + Math.PI / 2) * arcW);
    const sweep = i % 2;
    paths += `<path d="M${wx},${wy} A${arcH},${arcH} 0 0,${sweep} ${ex},${ey}" fill="none" stroke="${stroke}" stroke-width="2" opacity="0.75" stroke-linecap="round"/>`;
  }

  // Centre droplet
  const dropR = r(6 + rng() * 5);
  paths += `\n  <circle cx="${cx}" cy="${cy}" r="${dropR}" fill="${fill}" opacity="0.8"/>`;

  return paths;
}

/**
 * mori (forest) — leaf shapes using Q (quadratic bezier) curves.
 * Each leaf is a teardrop formed by two mirrored quadratic beziers.
 */
function renderMori(rng, cx, cy, fill, stroke) {
  const leafCount = 5 + Math.floor(rng() * 4);  // 5–8 leaves
  const outerR = 55 + rng() * 20;               // 55–75
  const innerR = 14 + rng() * 10;               // 14–24
  const width = 0.3 + rng() * 0.25;             // leaf width factor

  let paths = "";
  for (let i = 0; i < leafCount; i++) {
    const angle = (Math.PI * 2 * i) / leafCount - Math.PI / 2;
    const perp = angle + Math.PI / 2;

    // Leaf tip (outerR) and base (innerR)
    const tipX = r(cx + Math.cos(angle) * outerR);
    const tipY = r(cy + Math.sin(angle) * outerR);
    const baseX = r(cx + Math.cos(angle) * innerR);
    const baseY = r(cy + Math.sin(angle) * innerR);

    // Midpoint for control point — at 65% up the leaf, pushed sideways
    const midR = innerR + (outerR - innerR) * 0.65;
    const cpOffset = midR * width;
    const cp1x = r(cx + Math.cos(angle) * midR + Math.cos(perp) * cpOffset);
    const cp1y = r(cy + Math.sin(angle) * midR + Math.sin(perp) * cpOffset);
    const cp2x = r(cx + Math.cos(angle) * midR - Math.cos(perp) * cpOffset);
    const cp2y = r(cy + Math.sin(angle) * midR - Math.sin(perp) * cpOffset);

    // Left side: base → tip via cp1; right side: tip → base via cp2
    paths += `<path d="M${baseX},${baseY} Q${cp1x},${cp1y} ${tipX},${tipY} Q${cp2x},${cp2y} ${baseX},${baseY} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="0.88"/>`;
  }

  // Centre seed circle
  const seedR = r(innerR * 0.55);
  return `${paths}\n  <circle cx="${cx}" cy="${cy}" r="${seedR}" fill="${stroke}" opacity="0.65"/>`;
}

/**
 * tsuchi (earth) — crystal facets using only M/L/Z (no curves at all).
 * A central polygon with radiating angular shards.
 */
function renderTsuchi(rng, cx, cy, fill, stroke) {
  const shardCount = 5 + Math.floor(rng() * 4);  // 5–8 shards
  const outerR = 58 + rng() * 22;                 // 58–80
  const innerR = 20 + rng() * 14;                 // 20–34
  const midR = innerR + (outerR - innerR) * (0.45 + rng() * 0.2);
  const facetFrac = 0.18 + rng() * 0.18;          // how wide the facet cut is

  let paths = "";

  // Central polygon
  let centerPoly = "";
  for (let i = 0; i < shardCount; i++) {
    const angle = (Math.PI * 2 * i) / shardCount - Math.PI / 2;
    const px = r(cx + Math.cos(angle) * innerR);
    const py = r(cy + Math.sin(angle) * innerR);
    centerPoly += (i === 0 ? `M${px},${py}` : ` L${px},${py}`);
  }
  paths += `<path d="${centerPoly} Z" fill="${stroke}" stroke="${stroke}" stroke-width="1" opacity="0.8"/>`;

  // Crystal shards — each is a quadrilateral with angular facet cut
  for (let i = 0; i < shardCount; i++) {
    const angle = (Math.PI * 2 * i) / shardCount - Math.PI / 2;
    const nextAngle = (Math.PI * 2 * (i + 1)) / shardCount - Math.PI / 2;
    const halfStep = (Math.PI * 2) / shardCount;

    // Inner base: two points on innerR either side of main angle
    const b1x = r(cx + Math.cos(angle - halfStep * facetFrac) * innerR);
    const b1y = r(cy + Math.sin(angle - halfStep * facetFrac) * innerR);
    const b2x = r(cx + Math.cos(angle + halfStep * facetFrac) * innerR);
    const b2y = r(cy + Math.sin(angle + halfStep * facetFrac) * innerR);

    // Mid facet: narrower lateral spread
    const m1x = r(cx + Math.cos(angle - halfStep * facetFrac * 0.5) * midR);
    const m1y = r(cy + Math.sin(angle - halfStep * facetFrac * 0.5) * midR);
    const m2x = r(cx + Math.cos(angle + halfStep * facetFrac * 0.5) * midR);
    const m2y = r(cy + Math.sin(angle + halfStep * facetFrac * 0.5) * midR);

    // Outer tip: sharp point
    const tipX = r(cx + Math.cos(angle) * outerR);
    const tipY = r(cy + Math.sin(angle) * outerR);

    // Draw as two triangles: base-to-mid and mid-to-tip for faceted look
    paths += `<path d="M${b1x},${b1y} L${m1x},${m1y} L${m2x},${m2y} L${b2x},${b2y} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="0.9"/>`;
    paths += `<path d="M${m1x},${m1y} L${tipX},${tipY} L${m2x},${m2y} Z" fill="${stroke}" stroke="${stroke}" stroke-width="1" opacity="0.6"/>`;

    // Thin dividing line between shards
    const divAngle = nextAngle - halfStep * 0.5;
    const divR = innerR + (outerR - innerR) * 0.7;
    const divX = r(cx + Math.cos(divAngle) * divR);
    const divY = r(cy + Math.sin(divAngle) * divR);
    const divBx = r(cx + Math.cos(divAngle) * innerR);
    const divBy = r(cy + Math.sin(divAngle) * innerR);
    paths += `<path d="M${divBx},${divBy} L${divX},${divY}" fill="none" stroke="${stroke}" stroke-width="0.75" opacity="0.4"/>`;
  }

  return paths;
}

/**
 * kaze (wind) — spiral ribbon arms using C (cubic bezier) curves.
 * Each arm sweeps outward from the centre in a curved ribbon shape.
 */
function renderKaze(rng, cx, cy, fill, stroke) {
  const armCount = 4 + Math.floor(rng() * 3);   // 4–6 arms
  const outerR = 60 + rng() * 20;               // 60–80
  const innerR = 12 + rng() * 10;               // 12–22
  const swirl = 0.55 + rng() * 0.35;            // how far the arm curls (0.55–0.9)
  const ribbonW = 8 + rng() * 10;               // ribbon half-width

  let paths = "";
  for (let i = 0; i < armCount; i++) {
    const startAngle = (Math.PI * 2 * i) / armCount - Math.PI / 2;
    const endAngle = startAngle + Math.PI * swirl * (1.5 + rng() * 0.4);

    // Inner anchor points
    const s1x = r(cx + Math.cos(startAngle) * innerR);
    const s1y = r(cy + Math.sin(startAngle) * innerR);
    const s2x = r(cx + Math.cos(startAngle + 0.35) * innerR);
    const s2y = r(cy + Math.sin(startAngle + 0.35) * innerR);

    // Outer tip points — the ribbon tapers to a point
    const tipX = r(cx + Math.cos(endAngle) * outerR);
    const tipY = r(cy + Math.sin(endAngle) * outerR);

    // Ribbon edge: offset perpendicular to tip direction
    const perpEnd = endAngle + Math.PI / 2;
    const e1x = r(tipX + Math.cos(perpEnd) * ribbonW * 0.2);
    const e1y = r(tipY + Math.sin(perpEnd) * ribbonW * 0.2);

    // Control points for outer edge sweep
    const midAngle1 = startAngle + (endAngle - startAngle) * 0.4;
    const midAngle2 = startAngle + (endAngle - startAngle) * 0.7;
    const midR1 = innerR + (outerR - innerR) * 0.35;
    const midR2 = innerR + (outerR - innerR) * 0.7;
    const perp1 = midAngle1 + Math.PI / 2;
    const perp2 = midAngle2 + Math.PI / 2;

    // Outer edge control points
    const oc1x = r(cx + Math.cos(midAngle1) * midR1 + Math.cos(perp1) * ribbonW);
    const oc1y = r(cy + Math.sin(midAngle1) * midR1 + Math.sin(perp1) * ribbonW);
    const oc2x = r(cx + Math.cos(midAngle2) * midR2 + Math.cos(perp2) * ribbonW * 0.5);
    const oc2y = r(cy + Math.sin(midAngle2) * midR2 + Math.sin(perp2) * ribbonW * 0.5);

    // Inner edge control points
    const ic1x = r(cx + Math.cos(midAngle1) * midR1 - Math.cos(perp1) * ribbonW);
    const ic1y = r(cy + Math.sin(midAngle1) * midR1 - Math.sin(perp1) * ribbonW);
    const ic2x = r(cx + Math.cos(midAngle2) * midR2 - Math.cos(perp2) * ribbonW * 0.5);
    const ic2y = r(cy + Math.sin(midAngle2) * midR2 - Math.sin(perp2) * ribbonW * 0.5);

    // Outer ribbon edge: s1 → tip via oc1/oc2
    // Inner ribbon edge: tip → s2 via ic2/ic1
    paths += `<path d="M${s1x},${s1y} C${oc1x},${oc1y} ${oc2x},${oc2y} ${e1x},${e1y} C${ic2x},${ic2y} ${ic1x},${ic1y} ${s2x},${s2y} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" opacity="0.88"/>`;
  }

  // Centre eye of the wind
  const eyeR = r(innerR * 0.65);
  return `${paths}\n  <circle cx="${cx}" cy="${cy}" r="${eyeR}" fill="${stroke}" opacity="0.6"/>`;
}

/**
 * Generate a deterministic Kamon SVG string.
 * Same wallet + same house = same SVG every time.
 *
 * @param {string} houseId — one of: honoo, mizu, mori, tsuchi, kaze
 * @param {string} walletAddress — 0x-prefixed address
 * @returns {string} SVG markup
 */
export function generateKamonSVG(houseId, walletAddress) {
  if (!houseId || !walletAddress) return "";

  const seed = addressToSeed(walletAddress);
  const rng = createRng(seed);

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;

  const elementColors = {
    honoo: { fill: "#c92a22", stroke: "#55011f" },
    mizu:  { fill: "#94bcad", stroke: "#6f5652" },
    mori:  { fill: "#9b9024", stroke: "#6f5652" },
    tsuchi: { fill: "#6f5652", stroke: "#9b9024" },
    kaze:  { fill: "#94bcad", stroke: "#d0555d" },
  };

  const { fill, stroke } = elementColors[houseId] ?? elementColors.honoo;

  let inner;
  switch (houseId) {
    case "honoo":
      inner = renderHonoo(rng, cx, cy, fill, stroke);
      break;
    case "mizu":
      inner = renderMizu(rng, cx, cy, fill, stroke);
      break;
    case "mori":
      inner = renderMori(rng, cx, cy, fill, stroke);
      break;
    case "tsuchi":
      inner = renderTsuchi(rng, cx, cy, fill, stroke);
      break;
    case "kaze":
      inner = renderKaze(rng, cx, cy, fill, stroke);
      break;
    default:
      inner = renderHonoo(rng, cx, cy, fill, stroke);
  }

  // Outer ring decoration
  const outerRing = `<circle cx="${cx}" cy="${cy}" r="92" fill="none" stroke="${stroke}" stroke-width="2" opacity="0.2"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${outerRing}
  ${inner}
</svg>`;
}
