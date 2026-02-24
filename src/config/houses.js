/**
 * House metadata — single source of truth for all 5 Houses.
 * Never hardcode House data elsewhere; always import from here.
 */

import { getEnv } from "./env.js";

export const HOUSES = {
  honoo: {
    id: "honoo",
    numericId: 1,
    element: "fire",
    symbol: "炎",
    nameKey: "house.honoo",
    descriptionKey: "house.description.honoo",
    cssClass: "house-honoo",
    address: getEnv("VITE_HOUSE_FIRE_ADDRESS", "").toLowerCase(),
    colors: {
      primary: "#c92a22",
      secondary: "#55011f",
      accent: "#dccf8e",
    },
  },
  mizu: {
    id: "mizu",
    numericId: 2,
    element: "water",
    symbol: "水",
    nameKey: "house.mizu",
    descriptionKey: "house.description.mizu",
    cssClass: "house-mizu",
    address: getEnv("VITE_HOUSE_WATER_ADDRESS", "").toLowerCase(),
    colors: {
      primary: "#94bcad",
      secondary: "#6f5652",
      accent: "#dccf8e",
    },
  },
  mori: {
    id: "mori",
    numericId: 3,
    element: "forest",
    symbol: "森",
    nameKey: "house.mori",
    descriptionKey: "house.description.mori",
    cssClass: "house-mori",
    address: getEnv("VITE_HOUSE_FOREST_ADDRESS", "").toLowerCase(),
    colors: {
      primary: "#9b9024",
      secondary: "#6f5652",
      accent: "#94bcad",
    },
  },
  tsuchi: {
    id: "tsuchi",
    numericId: 4,
    element: "earth",
    symbol: "土",
    nameKey: "house.tsuchi",
    descriptionKey: "house.description.tsuchi",
    cssClass: "house-tsuchi",
    address: getEnv("VITE_HOUSE_EARTH_ADDRESS", "").toLowerCase(),
    colors: {
      primary: "#6f5652",
      secondary: "#9b9024",
      accent: "#dccf8e",
    },
  },
  kaze: {
    id: "kaze",
    numericId: 5,
    element: "wind",
    symbol: "風",
    nameKey: "house.kaze",
    descriptionKey: "house.description.kaze",
    cssClass: "house-kaze",
    address: getEnv("VITE_HOUSE_WIND_ADDRESS", "").toLowerCase(),
    colors: {
      primary: "#94bcad",
      secondary: "#d0555d",
      accent: "#dccf8e",
    },
  },
};

/** Ordered array for iteration (carousel, leaderboard) */
export const HOUSE_LIST = Object.values(HOUSES);

/** Lookup House by contract address */
export function getHouseByAddress(address) {
  const normalized = address?.toLowerCase();
  return HOUSE_LIST.find((h) => h.address === normalized) ?? null;
}

/** Lookup House by numeric EAS houseId (1-5). Returns null for unknown IDs. */
export function getHouseByNumericId(numericId) {
  return HOUSE_LIST.find((h) => h.numericId === numericId) ?? null;
}

/** Maximum NFT supply per House */
export const HOUSE_MAX_SUPPLY = 1000;

/** Starting mint price in $SEKI */
export const HOUSE_STARTING_PRICE = 10;
