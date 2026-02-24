/**
 * HouseContext — provides House selection state + theme application.
 *
 * On selection: persists to localStorage, applies CSS class to <html>,
 * and provides the full House config from houses.js.
 */

import { createContext, useState, useCallback, useEffect } from "react";
import { HOUSES, HOUSE_LIST } from "@/config/houses.js";

const STORAGE_KEY = "kamon:selected_house";

// eslint-disable-next-line react-refresh/only-export-components
export const HouseContext = createContext(null);

export function HouseProvider({ children }) {
  const [selectedHouse, setSelectedHouse] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null;
  });

  const houseConfig = selectedHouse ? HOUSES[selectedHouse] ?? null : null;

  const selectHouse = useCallback((houseId) => {
    setSelectedHouse(houseId);
    if (houseId) {
      localStorage.setItem(STORAGE_KEY, houseId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Apply/remove CSS class on <html> when selection changes
  useEffect(() => {
    const root = document.documentElement;

    // Remove all House CSS classes
    for (const house of HOUSE_LIST) {
      root.classList.remove(house.cssClass);
    }

    // Apply current House class
    if (houseConfig) {
      root.classList.add(houseConfig.cssClass);
    }
  }, [houseConfig]);

  return (
    <HouseContext.Provider value={{ selectedHouse, houseConfig, selectHouse }}>
      {children}
    </HouseContext.Provider>
  );
}
