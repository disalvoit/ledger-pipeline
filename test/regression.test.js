import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport } from "../src/report.js";
import { parseCsv } from "../src/csv.js";
import { toMinorUnits } from "../src/money.js";

// Regression: quoted fields that contain the delimiter used to be split
// into extra fields, so the row was rejected and dropped from the ledger.
test("regression: quoted sku containing a comma is accepted", () => {
  const report = buildReport(`id,sku,qty,unitPrice,date
1,"ACME, INC.",2,19.99,2024-01-01
`);
  assert.equal(report.rowsIn, 1);
  assert.equal(report.accepted, 1);
  assert.equal(report.rejected, 0);
  assert.equal(report.totalMinor, 3998);
  assert.deepEqual(report.bySku, { "ACME, INC.": 3998 });
});

test("regression: escaped double quotes inside a quoted field are decoded", () => {
  const report = buildReport(`id,sku,qty,unitPrice,date
1,"WIDGET ""PRO""",1,4.35,2024-01-02
2,"A ""B"", C",1,0.29,2024-01-03
`);
  assert.equal(report.accepted, 2);
  assert.equal(report.rejected, 0);
  assert.equal(report.totalMinor, 464);
  assert.deepEqual(report.bySku, {
    'A "B", C': 29,
    'WIDGET "PRO"': 435,
  });
});

test("regression: quoted field may span a line break", () => {
  const rows = parseCsv('id,sku,qty,unitPrice,date\n1,"TWO\nLINES",1,1.00,2024-01-01\n');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1], ["1", "TWO\nLINES", "1", "1.00", "2024-01-01"]);
});

test("regression: CRLF line endings do not corrupt the last field", () => {
  const report = buildReport(
    'id,sku,qty,unitPrice,date\r\n1,A,2,2.50,2024-01-01\r\n2,B,1,1.25,2024-01-02\r\n'
  );
  assert.equal(report.accepted, 2);
  assert.equal(report.rejected, 0);
  assert.equal(report.totalMinor, 625);
});

test("regression: totals are exact for prices that are not float-exact", () => {
  const report = buildReport(`id,sku,qty,unitPrice,date
1,A,1,4.35,2024-01-01
2,B,1,0.29,2024-01-02
3,C,3,1.10,2024-01-03
4,D,1,19.99,2024-01-04
`);
  assert.equal(report.accepted, 4);
  assert.equal(report.totalMinor, 435 + 29 + 330 + 1999);
  assert.equal(report.totalFormatted, "27.93");
});

test("toMinorUnits parses decimal prices exactly", () => {
  assert.equal(toMinorUnits("4.35"), 435);
  assert.equal(toMinorUnits("0.29"), 29);
  assert.equal(toMinorUnits("19.99"), 1999);
  assert.equal(toMinorUnits("1.10"), 110);
  assert.equal(toMinorUnits(4.35), 435);
  assert.equal(toMinorUnits("-2.50"), -250);
  assert.equal(toMinorUnits("1.005"), 101);
});
