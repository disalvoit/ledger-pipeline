import { COLUMNS } from "./schema.js";
import { parseDate } from "./dates.js";

/**
 * Validate a single parsed row, returning a list of error messages.
 * An empty list means the row is valid.
 *
 * @param {{id: string, sku: string, qty: string, unitPrice: string, date: string, fieldCount: number}} row
 * @returns {string[]}
 */
export function validateOrder(row) {
  const errors = [];

  if (row.fieldCount !== COLUMNS.length) {
    errors.push(`expected ${COLUMNS.length} fields, got ${row.fieldCount}`);
    return errors;
  }

  if (String(row.id ?? "").trim() === "") {
    errors.push("id is empty");
  }
  if (String(row.sku ?? "").trim() === "") {
    errors.push("sku is empty");
  }
  if (!/^[1-9]\d*$/.test(String(row.qty ?? ""))) {
    errors.push("qty is not a positive integer");
  }
  try {
    parseDate(String(row.date ?? ""));
  } catch {
    errors.push("date is not YYYY-MM-DD");
  }

  return errors;
}

/**
 * Validate all rows, splitting them into accepted and rejected.
 *
 * @param {Array} rows
 * @returns {{accepted: Array, rejected: Array, errors: string[]}}
 */
export function validateAll(rows) {
  const accepted = [];
  const rejected = [];
  const errors = [];

  for (const row of rows) {
    const rowErrors = validateOrder(row);
    if (rowErrors.length === 0) {
      accepted.push(row);
    } else {
      rejected.push(row);
      for (const message of rowErrors) {
        errors.push(`${row.id ?? "(unknown)"}: ${message}`);
      }
    }
  }

  return { accepted, rejected, errors };
}
