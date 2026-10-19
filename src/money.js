/**
 * Convert a decimal price string into integer minor units.
 *
 * Parses the decimal digits directly instead of multiplying a binary
 * floating point value by 100. `Number("4.35") * 100` is
 * `434.99999999999994`, which truncates to `434`; parsing the digits
 * gives the exact `435`. Sub-cent digits are rounded half away from zero.
 *
 * @param {string|number} amount - Decimal amount, e.g. "19.99".
 * @returns {number} Minor units (cents), e.g. 1999.
 */
export function toMinorUnits(amount) {
  if (typeof amount === "number" && !Number.isFinite(amount)) {
    return NaN;
  }

  const text = String(amount).trim();
  const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(text);
  if (!match || (match[2] === "" && !match[3])) {
    const value = Number(text);
    return Number.isFinite(value) ? Math.round(value * 100) : NaN;
  }

  const negative = match[1] === "-";
  const wholePart = match[2] === "" ? "0" : match[2];
  const fraction = match[3] ?? "";

  // Pad or cut the fraction to exactly two digits, then round based on
  // the first discarded digit (half away from zero).
  const padded = (fraction + "00").slice(0, 2);
  const minor = Number(wholePart) * 100 + Number(padded);
  const rounded = fraction.length > 2 && Number(fraction[2]) >= 5 ? minor + 1 : minor;

  return negative ? -rounded : rounded;
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
