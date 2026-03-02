#!/usr/bin/env node
/**
 * Generate app icons for Farcaster Mini App and OG metadata.
 *
 * Outputs:
 *   public/icon.png        — 1024x1024, no alpha (Farcaster iconUrl)
 *   public/splash.png      — 200x200 splash icon
 *   public/og-image.png    — 1200x800, 3:2 (Farcaster imageUrl / OG)
 *
 * Usage: node scripts/generate-app-icons.js
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, "..", "public");
const TMP_DIR = join(__dirname, "output");

mkdirSync(PUBLIC_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

// ── 5 house colors ──
const HOUSES = [
  { symbol: "\u708E", fill: "#c92a22", stroke: "#55011f" }, // Honoo - Fire
  { symbol: "\u6C34", fill: "#94bcad", stroke: "#3a6b5e" }, // Mizu - Water
  { symbol: "\u68EE", fill: "#9b9024", stroke: "#6f5652" }, // Mori - Forest
  { symbol: "\u571F", fill: "#6f5652", stroke: "#9b9024" }, // Tsuchi - Earth
  { symbol: "\u98A8", fill: "#94bcad", stroke: "#d0555d" }, // Kaze - Wind
];

// ── Icon SVG (1024x1024): 5 house kanji in a pentagon, KAMON text center ──
function generateIconSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.32;
  const kanjiSize = Math.round(size * 0.09);

  // Pentagon arrangement of house symbols
  let symbols = "";
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    // Glow circle behind each kanji
    symbols += `<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="${Math.round(size * 0.07)}" fill="${HOUSES[i].fill}" opacity="0.15"/>`;
    symbols += `<text x="${Math.round(x)}" y="${Math.round(y + kanjiSize * 0.35)}" text-anchor="middle" font-family="serif" font-size="${kanjiSize}" fill="${HOUSES[i].fill}" opacity="0.9">${HOUSES[i].symbol}</text>`;
  }

  // Connecting lines between houses (pentagon outline)
  let pentagonPoints = "";
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    pentagonPoints += `${Math.round(x)},${Math.round(y)} `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0f0a05"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
  </defs>

  <!-- Solid background (no alpha) -->
  <rect width="${size}" height="${size}" fill="url(#bg)"/>

  <!-- Outer ring -->
  <circle cx="${cx}" cy="${cy}" r="${Math.round(size * 0.44)}" fill="none" stroke="#6f5652" stroke-width="1.5" opacity="0.2"/>
  <circle cx="${cx}" cy="${cy}" r="${Math.round(size * 0.45)}" fill="none" stroke="#9b9024" stroke-width="0.8" opacity="0.1"/>

  <!-- Pentagon connecting lines -->
  <polygon points="${pentagonPoints.trim()}" fill="none" stroke="#6f5652" stroke-width="1" opacity="0.15"/>

  <!-- House symbols -->
  ${symbols}

  <!-- Center text: KAMON -->
  <text x="${cx}" y="${cy - Math.round(size * 0.02)}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${Math.round(size * 0.08)}" fill="#dccf8e" opacity="0.9" letter-spacing="${Math.round(size * 0.012)}">KAMON</text>
  <text x="${cx}" y="${cy + Math.round(size * 0.05)}" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(size * 0.028)}" fill="#6f5652" opacity="0.6" letter-spacing="${Math.round(size * 0.005)}">SEKIGAHARA</text>
</svg>`;
}

// ── OG Image SVG (1200x800, 3:2): wider layout with houses in a row ──
function generateOgSvg() {
  const w = 1200;
  const h = 800;
  const cx = w / 2;

  // 5 house kanji in a horizontal row
  let symbols = "";
  const spacing = 160;
  const startX = cx - spacing * 2;
  const symbolY = h * 0.5;
  const kanjiSize = 64;

  for (let i = 0; i < 5; i++) {
    const x = startX + spacing * i;
    symbols += `<circle cx="${x}" cy="${symbolY}" r="50" fill="${HOUSES[i].fill}" opacity="0.1"/>`;
    symbols += `<text x="${x}" y="${symbolY + kanjiSize * 0.35}" text-anchor="middle" font-family="serif" font-size="${kanjiSize}" fill="${HOUSES[i].fill}" opacity="0.85">${HOUSES[i].symbol}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <radialGradient id="ogbg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#0f0a05"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
  </defs>

  <rect width="${w}" height="${h}" fill="url(#ogbg)"/>

  <!-- Decorative line -->
  <line x1="${cx - 400}" y1="${h * 0.32}" x2="${cx + 400}" y2="${h * 0.32}" stroke="#6f5652" stroke-width="0.8" opacity="0.3"/>

  <!-- Title -->
  <text x="${cx}" y="${h * 0.22}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="72" fill="#dccf8e" opacity="0.9" letter-spacing="14">KAMON</text>
  <text x="${cx}" y="${h * 0.29}" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#6f5652" opacity="0.6" letter-spacing="6">SEKIGAHARA</text>

  <!-- House symbols row -->
  ${symbols}

  <!-- Decorative line -->
  <line x1="${cx - 400}" y1="${h * 0.68}" x2="${cx + 400}" y2="${h * 0.68}" stroke="#6f5652" stroke-width="0.8" opacity="0.3"/>

  <!-- Tagline -->
  <text x="${cx}" y="${h * 0.78}" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#94bcad" opacity="0.5" letter-spacing="4">CHOOSE YOUR HOUSE. STAKE YOUR CLAIM.</text>
</svg>`;
}

// ── Generate SVGs and convert to PNG ──

console.log("Generating app icons...\n");

// 1. Icon (1024x1024)
const iconSvg = generateIconSvg(1024);
const iconSvgPath = join(TMP_DIR, "app-icon.svg");
writeFileSync(iconSvgPath, iconSvg);
console.log("  Generated app-icon.svg");

execSync(`npx sharp-cli -i "${iconSvgPath}" -o "${join(PUBLIC_DIR, "icon.png")}" -- flatten --background "#000000"`, { stdio: "inherit" });
console.log("  -> public/icon.png (1024x1024)");

// 2. Splash (200x200) — same design, smaller
const splashSvg = generateIconSvg(200);
const splashSvgPath = join(TMP_DIR, "app-splash.svg");
writeFileSync(splashSvgPath, splashSvg);
console.log("  Generated app-splash.svg");

execSync(`npx sharp-cli -i "${splashSvgPath}" -o "${join(PUBLIC_DIR, "splash.png")}" -- flatten --background "#000000"`, { stdio: "inherit" });
console.log("  -> public/splash.png (200x200)");

// 3. OG image (1200x800)
const ogSvg = generateOgSvg();
const ogSvgPath = join(TMP_DIR, "app-og.svg");
writeFileSync(ogSvgPath, ogSvg);
console.log("  Generated app-og.svg");

execSync(`npx sharp-cli -i "${ogSvgPath}" -o "${join(PUBLIC_DIR, "og-image.png")}" -- flatten --background "#000000"`, { stdio: "inherit" });
console.log("  -> public/og-image.png (1200x800)");

console.log("\nDone — 3 app icons generated in public/.");
