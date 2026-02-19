/**
 * useHouse — access current House selection from HouseContext.
 */

import { useContext } from "react";
import { HouseContext } from "@/context/HouseContext.jsx";

export function useHouse() {
  const context = useContext(HouseContext);
  if (!context) {
    throw new Error("useHouse must be used within a HouseProvider");
  }
  return context;
}
