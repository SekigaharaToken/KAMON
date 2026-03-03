/**
 * Format a token amount for display.
 *
 * Rules:
 *   - Max 4 decimal places
 *   - Decimals decrease as integer part grows:
 *       < 10     → 4 decimals
 *       10–99    → 3 decimals
 *       100–999  → 2 decimals
 *       1k–9999  → 1 decimal
 *       ≥ 10k    → 0 decimals
 *   - Trailing zeros are stripped
 *   - Dash placeholders pass through unchanged
 *
 * @param {string|number|null|undefined} value — raw amount (typically from formatUnits)
 * @returns {string} formatted display string
 */
export function formatTokenAmount(value) {
  if (value === "—") return "—";
  if (value == null || value === "") return "0";

  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  if (!Number.isFinite(num) || num === 0) return "0";

  // Determine how many digits are in the integer part
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const intDigits = Math.max(0, magnitude); // 0 for values < 10

  const maxDecimals = Math.max(0, 4 - intDigits);

  // Truncate (floor toward zero) instead of rounding
  const factor = 10 ** maxDecimals;
  const truncated = Math.trunc(Math.abs(num) * factor) / factor;
  const signed = num < 0 ? -truncated : truncated;

  if (signed === 0) return "0";

  const fixed = signed.toFixed(maxDecimals);
  // Remove trailing zeros after decimal point, then trailing dot
  const trimmed = fixed.includes(".")
    ? fixed.replace(/0+$/, "").replace(/\.$/, "")
    : fixed;

  return trimmed === "-0" ? "0" : trimmed || "0";
}
