import { parseCsv } from "./csv.js";
import { COLUMNS } from "./schema.js";

/**
 * Parse CSV text into order rows.
 *
 * Skips the header line and maps each row's positional fields onto
 * COLUMNS. `qty` and `unitPrice` are left as strings here; validation
 * and coercion happen later. The original field count is kept on each
 * row so malformed lines can be rejected downstream.
 *
 * @param {string} text - Raw CSV text including the header line.
 * @returns {Array<{id: string, sku: string, qty: string, unitPrice: string, date: string, fieldCount: number}>}
 */
export function parseOrders(text) {
  const rows = parseCsv(text);
  const orders = [];
  for (let i = 1; i < rows.length; i++) {
    const fields = rows[i];
    orders.push({
      id: fields[0],
      sku: fields[1],
      qty: fields[2],
      unitPrice: fields[3],
      date: fields[4],
      fieldCount: fields.length,
    });
  }
  return orders;
}
