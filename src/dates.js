/**
 * Parse a `YYYY-MM-DD` date string into an ISO date string, in UTC.
 *
 * Avoids `new Date(s)` so the result is independent of the local
 * timezone. Rejects impossible calendar dates (e.g. 2024-02-31).
 *
 * @param {string} s
 * @returns {string} The date as an ISO `YYYY-MM-DD` string.
 * @throws {Error} If the input is not a valid `YYYY-MM-DD` date.
 */
export function parseDate(s) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
  if (!match) {
    throw new Error(`Invalid date: ${s}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${s}`);
  }
  return date.toISOString().slice(0, 10);
}
