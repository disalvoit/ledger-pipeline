/**
 * Convert a decimal price string into integer minor units.
 *
 * Parses the decimal digits directly so the result is exact; a naive
 * `Number(amount) * 100` suffers float error (e.g. 4.35 * 100 is
 * 434.9999… and would truncate to 434). Digits beyond the second
 * decimal place are truncated toward zero.
 *
 * @param {string|number} amount - Decimal amount, e.g. "19.99".
 * @returns {number} Minor units (cents), e.g. 1999.
 */
export function toMinorUnits(amount) {
  const s = typeof amount === "string" ? amount.trim() : String(amount);
  const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s);
  if (match && (match[2] !== "" || match[3] !== "")) {
    const sign = match[1] === "-" ? -1 : 1;
    const whole = match[2] === "" ? "0" : match[2];
    const fraction = (match[3] ?? "").padEnd(2, "0").slice(0, 2); // truncates extras
    return sign * Number(whole + fraction);
  }
  return Math.trunc(Number(amount) * 100); // fallback: NaN for junk input
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
