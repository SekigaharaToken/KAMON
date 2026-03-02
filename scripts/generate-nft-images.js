#!/usr/bin/env node
/**
 * Generate canonical "base" NFT images for the 5 Houses.
 * Uses the zero address as seed for a deterministic, house-representative Kamon.
 * Outputs SVG files to scripts/output/.
 *
 * Usage: node scripts/generate-nft-images.js
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "output");

// ── Copied from src/lib/kamon.js (Node-compatible, no import.meta.env) ──

function createRng(seed) {
  let state = seed;
  return function next() {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return ((state >>> 0) / 0xffffffff);
  };
}

function addressToSeed(address) {
  const hex = address.replace("0x", "").toLowerCase();
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = ((hash << 5) - hash + hex.charCodeAt(i)) | 0;
  }
  return hash || 1;
}

function r(n) {
  return Math.round(n * 1000) / 1000;
}

function renderHonoo(rng, cx, cy, fill, stroke) {
  const petalCount = 5 + Math.floor(rng() * 3);
  const outerR = 55 + rng() * 25;
  const innerR = 18 + rng() * 12;
  const lean = 0.25 + rng() * 0.25;
  let paths = "";
  for (let i = 0; i < petalCount; i++) {
    const angle = (Math.PI * 2 * i) / petalCount - Math.PI / 2;
    const perpAngle = angle + Math.PI / 2;
    const tx = r(cx + Math.cos(angle) * outerR);
    const ty = r(cy + Math.sin(angle) * outerR);
    const baseAngleL = angle - Math.PI / petalCount;
    const baseAngleR = angle + Math.PI / petalCount;
    const blx = r(cx + Math.cos(baseAngleL) * innerR);
    const bly = r(cy + Math.sin(baseAngleL) * innerR);
    const brx = r(cx + Math.cos(baseAngleR) * innerR);
    const bry = r(cy + Math.sin(baseAngleR) * innerR);
    const midR = (outerR + innerR) * 0.5;
    const cp1x = r(cx + Math.cos(angle) * midR + Math.cos(perpAngle) * midR * lean);
    const cp1y = r(cy + Math.sin(angle) * midR + Math.sin(perpAngle) * midR * lean);
    const cp2x = r(cx + Math.cos(angle) * midR - Math.cos(perpAngle) * midR * lean);
    const cp2y = r(cy + Math.sin(angle) * midR - Math.sin(perpAngle) * midR * lean);
    paths += `<path d="M${blx},${bly} C${cp1x},${cp1y} ${tx},${ty} ${tx},${ty} C${tx},${ty} ${cp2x},${cp2y} ${brx},${bry} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="0.9"/>`;
  }
  const embR = r(innerR * 0.7);
  return `${paths}\n  <circle cx="${cx}" cy="${cy}" r="${embR}" fill="${stroke}" opacity="0.7"/>`;
}

function renderMizu(rng, cx, cy, fill, stroke) {
  const ringCount = 3 + Math.floor(rng() * 3);
  const maxR = 70 + rng() * 15;
  const waveArcCount = 4 + Math.floor(rng() * 4);
  const waveDepth = 8 + rng() * 12;
  let paths = "";
  for (let i = 0; i < ringCount; i++) {
    const ringR = r(maxR * ((i + 1) / ringCount));
    const sweep = i % 2 === 0 ? 1 : 0;
    const startAngle = (rng() * Math.PI * 2);
    const endAngle = startAngle + Math.PI * (1.8 + rng() * 0.15);
    const sx = r(cx + Math.cos(startAngle) * ringR);
    const sy = r(cy + Math.sin(startAngle) * ringR);
    const ex = r(cx + Math.cos(endAngle) * ringR);
    const ey = r(cy + Math.sin(endAngle) * ringR);
    paths += `<path d="M${sx},${sy} A${ringR},${ringR} 0 1,${sweep} ${ex},${ey}" fill="none" stroke="${fill}" stroke-width="${r(1.5 + i * 0.4)}" opacity="${r(0.6 - i * 0.08)}"/>`;
  }
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
  const dropR = r(6 + rng() * 5);
  paths += `\n  <circle cx="${cx}" cy="${cy}" r="${dropR}" fill="${fill}" opacity="0.8"/>`;
  return paths;
}

function renderMori(rng, cx, cy, fill, stroke) {
  const leafCount = 5 + Math.floor(rng() * 4);
  const outerR = 55 + rng() * 20;
  const innerR = 14 + rng() * 10;
  const width = 0.3 + rng() * 0.25;
  let paths = "";
  for (let i = 0; i < leafCount; i++) {
    const angle = (Math.PI * 2 * i) / leafCount - Math.PI / 2;
    const perp = angle + Math.PI / 2;
    const tipX = r(cx + Math.cos(angle) * outerR);
    const tipY = r(cy + Math.sin(angle) * outerR);
    const baseX = r(cx + Math.cos(angle) * innerR);
    const baseY = r(cy + Math.sin(angle) * innerR);
    const midR = innerR + (outerR - innerR) * 0.65;
    const cpOffset = midR * width;
    const cp1x = r(cx + Math.cos(angle) * midR + Math.cos(perp) * cpOffset);
    const cp1y = r(cy + Math.sin(angle) * midR + Math.sin(perp) * cpOffset);
    const cp2x = r(cx + Math.cos(angle) * midR - Math.cos(perp) * cpOffset);
    const cp2y = r(cy + Math.sin(angle) * midR - Math.sin(perp) * cpOffset);
    paths += `<path d="M${baseX},${baseY} Q${cp1x},${cp1y} ${tipX},${tipY} Q${cp2x},${cp2y} ${baseX},${baseY} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="0.88"/>`;
  }
  const seedR = r(innerR * 0.55);
  return `${paths}\n  <circle cx="${cx}" cy="${cy}" r="${seedR}" fill="${stroke}" opacity="0.65"/>`;
}

function renderTsuchi(rng, cx, cy, fill, stroke) {
  const shardCount = 5 + Math.floor(rng() * 4);
  const outerR = 58 + rng() * 22;
  const innerR = 20 + rng() * 14;
  const midR = innerR + (outerR - innerR) * (0.45 + rng() * 0.2);
  const facetFrac = 0.18 + rng() * 0.18;
  let paths = "";
  let centerPoly = "";
  for (let i = 0; i < shardCount; i++) {
    const angle = (Math.PI * 2 * i) / shardCount - Math.PI / 2;
    const px = r(cx + Math.cos(angle) * innerR);
    const py = r(cy + Math.sin(angle) * innerR);
    centerPoly += (i === 0 ? `M${px},${py}` : ` L${px},${py}`);
  }
  paths += `<path d="${centerPoly} Z" fill="${stroke}" stroke="${stroke}" stroke-width="1" opacity="0.8"/>`;
  for (let i = 0; i < shardCount; i++) {
    const angle = (Math.PI * 2 * i) / shardCount - Math.PI / 2;
    const nextAngle = (Math.PI * 2 * (i + 1)) / shardCount - Math.PI / 2;
    const halfStep = (Math.PI * 2) / shardCount;
    const b1x = r(cx + Math.cos(angle - halfStep * facetFrac) * innerR);
    const b1y = r(cy + Math.sin(angle - halfStep * facetFrac) * innerR);
    const b2x = r(cx + Math.cos(angle + halfStep * facetFrac) * innerR);
    const b2y = r(cy + Math.sin(angle + halfStep * facetFrac) * innerR);
    const m1x = r(cx + Math.cos(angle - halfStep * facetFrac * 0.5) * midR);
    const m1y = r(cy + Math.sin(angle - halfStep * facetFrac * 0.5) * midR);
    const m2x = r(cx + Math.cos(angle + halfStep * facetFrac * 0.5) * midR);
    const m2y = r(cy + Math.sin(angle + halfStep * facetFrac * 0.5) * midR);
    const tipX = r(cx + Math.cos(angle) * outerR);
    const tipY = r(cy + Math.sin(angle) * outerR);
    paths += `<path d="M${b1x},${b1y} L${m1x},${m1y} L${m2x},${m2y} L${b2x},${b2y} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="0.9"/>`;
    paths += `<path d="M${m1x},${m1y} L${tipX},${tipY} L${m2x},${m2y} Z" fill="${stroke}" stroke="${stroke}" stroke-width="1" opacity="0.6"/>`;
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

function renderKaze(rng, cx, cy, fill, stroke) {
  const armCount = 4 + Math.floor(rng() * 3);
  const outerR = 60 + rng() * 20;
  const innerR = 12 + rng() * 10;
  const swirl = 0.55 + rng() * 0.35;
  const ribbonW = 8 + rng() * 10;
  let paths = "";
  for (let i = 0; i < armCount; i++) {
    const startAngle = (Math.PI * 2 * i) / armCount - Math.PI / 2;
    const endAngle = startAngle + Math.PI * swirl * (1.5 + rng() * 0.4);
    const s1x = r(cx + Math.cos(startAngle) * innerR);
    const s1y = r(cy + Math.sin(startAngle) * innerR);
    const s2x = r(cx + Math.cos(startAngle + 0.35) * innerR);
    const s2y = r(cy + Math.sin(startAngle + 0.35) * innerR);
    const tipX = r(cx + Math.cos(endAngle) * outerR);
    const tipY = r(cy + Math.sin(endAngle) * outerR);
    const perpEnd = endAngle + Math.PI / 2;
    const e1x = r(tipX + Math.cos(perpEnd) * ribbonW * 0.2);
    const e1y = r(tipY + Math.sin(perpEnd) * ribbonW * 0.2);
    const midAngle1 = startAngle + (endAngle - startAngle) * 0.4;
    const midAngle2 = startAngle + (endAngle - startAngle) * 0.7;
    const midR1 = innerR + (outerR - innerR) * 0.35;
    const midR2 = innerR + (outerR - innerR) * 0.7;
    const perp1 = midAngle1 + Math.PI / 2;
    const perp2 = midAngle2 + Math.PI / 2;
    const oc1x = r(cx + Math.cos(midAngle1) * midR1 + Math.cos(perp1) * ribbonW);
    const oc1y = r(cy + Math.sin(midAngle1) * midR1 + Math.sin(perp1) * ribbonW);
    const oc2x = r(cx + Math.cos(midAngle2) * midR2 + Math.cos(perp2) * ribbonW * 0.5);
    const oc2y = r(cy + Math.sin(midAngle2) * midR2 + Math.sin(perp2) * ribbonW * 0.5);
    const ic1x = r(cx + Math.cos(midAngle1) * midR1 - Math.cos(perp1) * ribbonW);
    const ic1y = r(cy + Math.sin(midAngle1) * midR1 - Math.sin(perp1) * ribbonW);
    const ic2x = r(cx + Math.cos(midAngle2) * midR2 - Math.cos(perp2) * ribbonW * 0.5);
    const ic2y = r(cy + Math.sin(midAngle2) * midR2 - Math.sin(perp2) * ribbonW * 0.5);
    paths += `<path d="M${s1x},${s1y} C${oc1x},${oc1y} ${oc2x},${oc2y} ${e1x},${e1y} C${ic2x},${ic2y} ${ic1x},${ic1y} ${s2x},${s2y} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" opacity="0.88"/>`;
  }
  const eyeR = r(innerR * 0.65);
  return `${paths}\n  <circle cx="${cx}" cy="${cy}" r="${eyeR}" fill="${stroke}" opacity="0.6"/>`;
}

// ── House definitions ──

const HOUSES = [
  { id: "honoo",  symbol: "\u708E", name: "House Honoo",  element: "Fire",   render: renderHonoo,  fill: "#c92a22", stroke: "#55011f", bg: "#1a0505", label: "#dccf8e" },
  { id: "mizu",   symbol: "\u6C34", name: "House Mizu",   element: "Water",  render: renderMizu,   fill: "#94bcad", stroke: "#6f5652", bg: "#0a1510" },
  { id: "mori",   symbol: "\u68EE", name: "House Mori",   element: "Forest", render: renderMori,   fill: "#9b9024", stroke: "#6f5652", bg: "#0f0e05" },
  { id: "tsuchi", symbol: "\u571F", name: "House Tsuchi",  element: "Earth",  render: renderTsuchi, fill: "#6f5652", stroke: "#9b9024", bg: "#0e0c08" },
  { id: "kaze",   symbol: "\u98A8", name: "House Kaze",   element: "Wind",   render: renderKaze,   fill: "#94bcad", stroke: "#d0555d", bg: "#080f0f" },
];

// Canonical seed: zero address
const CANONICAL_ADDRESS = "0x0000000000000000000000000000000000000000";

const SIZE = 512;
const KAMON_SIZE = 200;

for (const house of HOUSES) {
  const seed = addressToSeed(CANONICAL_ADDRESS);
  const rng = createRng(seed);

  const cx = KAMON_SIZE / 2;
  const cy = KAMON_SIZE / 2;

  const inner = house.render(rng, cx, cy, house.fill, house.stroke);
  const outerRing = `<circle cx="${cx}" cy="${cy}" r="92" fill="none" stroke="${house.stroke}" stroke-width="2" opacity="0.2"/>`;

  // Scale the 200x200 kamon to fit within 512x512 with padding
  const scale = 2.2;
  const offsetX = (SIZE - KAMON_SIZE * scale) / 2;
  const offsetY = (SIZE - KAMON_SIZE * scale) / 2 - 20; // shift up for label room

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <defs>
    <radialGradient id="bg-grad" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="${house.bg}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg-grad)"/>

  <!-- Outer decorative circle -->
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 - 20}" r="210" fill="none" stroke="${house.stroke}" stroke-width="1" opacity="0.15"/>
  <circle cx="${SIZE / 2}" cy="${SIZE / 2 - 20}" r="215" fill="none" stroke="${house.fill}" stroke-width="0.5" opacity="0.08"/>

  <!-- Kamon shape -->
  <g transform="translate(${r(offsetX)}, ${r(offsetY)}) scale(${scale})">
    ${outerRing}
    ${inner}
  </g>

  <!-- House kanji -->
  <text x="${SIZE / 2}" y="${SIZE - 55}" text-anchor="middle" font-family="serif" font-size="36" fill="${house.fill}" opacity="0.9">${house.symbol}</text>

  <!-- House name -->
  <text x="${SIZE / 2}" y="${SIZE - 20}" text-anchor="middle" font-family="sans-serif" font-size="16" fill="${house.label || house.stroke}" opacity="0.6" letter-spacing="3">${house.name.toUpperCase()}</text>
</svg>`;

  const outPath = join(OUTPUT_DIR, `${house.id}.svg`);
  writeFileSync(outPath, svg);
  console.log(`  ${house.symbol}  ${outPath}`);
}

console.log("\nDone — 5 canonical House NFT images generated.");
