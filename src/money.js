/**
 * Convert a decimal price string into integer minor units.
 *
 * @param {string|number} amount - Decimal amount, e.g. "19.99".
 * @returns {number} Minor units (cents), e.g. 1999.
 */
export function toMinorUnits(amount) {
  // Round instead of truncating: binary floating point makes decimal
  // values like 4.35 multiply to 434.999..., and truncating silently
  // drops a cent. Every value with at most two decimals is within
  // 0.5 minor unit of the exact product, so rounding recovers it.
  return Math.round(Number(amount) * 100);
}

/**
 * Format integer minor units back into a "12.34"-style string.
 *
 * @param {number} minor - Minor units, e.g. 1999.
 * @returns {string} e.g. "19.99".
 */
export function formatMinor(minor) {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}
