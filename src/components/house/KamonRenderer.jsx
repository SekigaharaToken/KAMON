/**
 * KamonRenderer — renders a generative SVG Kamon emblem.
 *
 * Props:
 *   houseId       — House identifier (honoo, mizu, etc.)
 *   walletAddress — 0x wallet address to seed generation
 *   size          — Display size in px (default 120)
 *   className     — Optional additional CSS classes
 */

import { useMemo } from "react";
import { generateKamonSVG } from "@/lib/kamon.js";

export function KamonRenderer({ houseId, walletAddress, size = 120, className = "" }) {
  const svg = useMemo(
    () => generateKamonSVG(houseId, walletAddress),
    [houseId, walletAddress],
  );

  if (!svg) return null;

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-label={`Kamon emblem for ${houseId}`}
      role="img"
    />
  );
}
