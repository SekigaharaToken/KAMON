/**
 * seasonHistory — localStorage-backed season winner persistence.
 *
 * Stores the previous season winner so the next season can display it
 * above the current leaderboard.
 *
 * Storage key: kamon:previous_winner
 * Shape: { seasonId: number, winner: { houseId: string, score: number, memberCount: number } }
 */

const STORAGE_KEY = "kamon:previous_winner";

/**
 * Retrieve the stored previous season winner.
 * @returns {{ seasonId: number, winner: { houseId: string, score: number, memberCount: number } } | null}
 */
export function getPreviousWinner() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persist the winner of a completed season.
 * @param {number} seasonId
 * @param {{ houseId: string, score: number, memberCount: number }} winner
 */
export function savePreviousWinner(seasonId, winner) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seasonId, winner }));
  } catch {
    // Storage full or disabled — silently ignore
  }
}

/**
 * Remove the stored previous winner (cleanup / season reset).
 */
export function clearPreviousWinner() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — silently ignore
  }
}
