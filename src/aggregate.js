import { toMinorUnits } from "./money.js";

/**
 * Sum the minor-unit total of all accepted orders.
 *
 * @param {Array} orders - Accepted order rows.
 * @returns {number}
 */
export function totalMinor(orders) {
  let total = 0;
  for (const order of orders) {
    total += toMinorUnits(order.unitPrice) * Number(order.qty);
  }
  return total;
}

/**
 * Group accepted orders by sku, summing minor units per sku.
 *
 * @param {Array} orders - Accepted order rows.
 * @returns {Object<string, number>} Keys sorted alphabetically.
 */
export function bySku(orders) {
  const map = {};
  for (const order of orders) {
    const minor = toMinorUnits(order.unitPrice) * Number(order.qty);
    map[order.sku] = (map[order.sku] ?? 0) + minor;
  }
  const sorted = {};
  for (const key of Object.keys(map).sort()) {
    sorted[key] = map[key];
  }
  return sorted;
}
