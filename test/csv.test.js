import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../src/csv.js";

test("parseCsv: splits plain records on commas and newlines", () => {
  assert.deepEqual(parseCsv("a,b,c\n1,2,3"), [
    ["a", "b", "c"],
    ["1", "2", "3"],
  ]);
});

test("parseCsv: keeps a quoted comma as part of one field", () => {
  // Regression: naive splitting turned quoted commas into extra fields,
  // which made downstream validation reject valid orders.
  assert.deepEqual(parseCsv('1,"ACME, INC.",2,19.99,2024-01-01'), [
    ["1", "ACME, INC.", "2", "19.99", "2024-01-01"],
  ]);
});

test("parseCsv: unescapes doubled quotes inside a quoted field", () => {
  assert.deepEqual(parseCsv('2,"WIDGET ""PRO""",1,4.35,2024-01-02'), [
    ["2", 'WIDGET "PRO"', "1", "4.35", "2024-01-02"],
  ]);
});

test("parseCsv: handles CRLF record separators", () => {
  // Regression: a trailing \r corrupted the last field of every row.
  assert.deepEqual(parseCsv("a,b\r\n1,2\r\n"), [
    ["a", "b"],
    ["1", "2"],
  ]);
});

test("parseCsv: skips empty lines and tolerates a trailing newline", () => {
  assert.deepEqual(parseCsv("a,b\n\n1,2\n"), [
    ["a", "b"],
    ["1", "2"],
  ]);
});
