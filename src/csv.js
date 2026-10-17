/**
 * Parse CSV text into rows of fields.
 *
 * Splits the input on newline characters, then splits each line on
 * commas. Empty lines are skipped.
 *
 * @param {string} text - Raw CSV text.
 * @returns {string[][]} Rows of field strings.
 */
export function parseCsv(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (line === "") continue;
    rows.push(line.split(","));
  }
  return rows;
}
