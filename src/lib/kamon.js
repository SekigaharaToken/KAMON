/**
 * Generative Kamon SVG renderer.
 * Produces deterministic SVGs from wallet address + House element.
 * Implemented in Phase 2.
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

  // Placeholder: generate a simple geometric Kamon
  // Full implementation in Phase 2 with per-element base shapes
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const petals = 5 + Math.floor(rng() * 4); // 5-8 petals
  const innerR = 20 + rng() * 20;
  const outerR = 60 + rng() * 25;

  const elementColors = {
    honoo: { fill: "#c92a22", stroke: "#55011f" },
    mizu: { fill: "#94bcad", stroke: "#6f5652" },
    mori: { fill: "#9b9024", stroke: "#6f5652" },
    tsuchi: { fill: "#6f5652", stroke: "#9b9024" },
    kaze: { fill: "#94bcad", stroke: "#d0555d" },
  };

  const { fill, stroke } = elementColors[houseId] ?? elementColors.honoo;

  let paths = "";
  for (let i = 0; i < petals; i++) {
    const angle = (Math.PI * 2 * i) / petals;
    const nextAngle = (Math.PI * 2 * (i + 0.5)) / petals;
    const ox = cx + Math.cos(angle) * outerR;
    const oy = cy + Math.sin(angle) * outerR;
    const ix = cx + Math.cos(nextAngle) * innerR;
    const iy = cy + Math.sin(nextAngle) * innerR;
    paths += `<path d="M${cx},${cy} L${ox},${oy} L${ix},${iy} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="0.85"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <circle cx="${cx}" cy="${cy}" r="${outerR + 10}" fill="none" stroke="${stroke}" stroke-width="2" opacity="0.3"/>
  ${paths}
  <circle cx="${cx}" cy="${cy}" r="${innerR * 0.6}" fill="${stroke}" opacity="0.6"/>
</svg>`;
}
