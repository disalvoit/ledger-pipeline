import { parseOrders } from "./parse.js";
import { validateAll } from "./validate.js";
import { totalMinor, bySku } from "./aggregate.js";
import { formatMinor } from "./money.js";

/**
 * Build a revenue report from raw CSV text.
 *
 * @param {string} text - Raw CSV text including the header line.
 * @returns {{rowsIn: number, accepted: number, rejected: number, rejectedRows: string[], totalMinor: number, totalFormatted: string, bySku: Object<string, number>}}
 */
export function buildReport(text) {
  const orders = parseOrders(text);
  const { accepted, rejected } = validateAll(orders);
  const total = totalMinor(accepted);
  return {
    rowsIn: orders.length,
    accepted: accepted.length,
    rejected: rejected.length,
    rejectedRows: rejected.map((row) => row.id),
    totalMinor: total,
    totalFormatted: formatMinor(total),
    bySku: bySku(accepted),
  };
}

/**
 * Render a report as a short human-readable string.
 *
 * @param {object} report
 * @returns {string}
 */
export function renderReport(report) {
  const lines = [
    `rows in: ${report.rowsIn}`,
    `accepted: ${report.accepted}`,
    `rejected: ${report.rejected}`,
    `total: ${report.totalFormatted}`,
  ];
  if (report.rejectedRows.length > 0) {
    lines.push(`rejected rows: ${report.rejectedRows.join(", ")}`);
  }
  return lines.join("\n");
}
