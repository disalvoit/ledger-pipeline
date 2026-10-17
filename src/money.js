/**
 * Convert a decimal price string into integer minor units.
 *
 * @param {string|number} amount - Decimal amount, e.g. "19.99".
 * @returns {number} Minor units (cents), e.g. 1999.
 */
export function toMinorUnits(amount) {
  return Math.trunc(Number(amount) * 100);
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
