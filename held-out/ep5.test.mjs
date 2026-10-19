// Held-out suite for EP5, "Regression archaeology" — disalvoit/ledger-pipeline.
// Graded against README.md: RFC 4180 quoting, money in integer minor units,
// and a report that matches the input for every valid file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, toMinorUnits, formatMinor } from "../src/index.js";

const QUOTED = `id,sku,qty,unitPrice,date
1,"ACME, INC.",2,19.99,2024-01-01
2,"WIDGET ""PRO""",1,0.29,2024-01-02
3,PLAIN,3,1.15,2024-01-03
`;

const QUOTED_BY_SKU = {
  "ACME, INC.": 3998,
  PLAIN: 345,
  'WIDGET "PRO"': 29,
};

// ---------------------------------------------------------------- core

test("core: a quoted field containing a comma does not lose the row", () => {
  const r = buildReport(QUOTED);
  assert.equal(r.rowsIn, 3);
  assert.equal(r.accepted, 3);
  assert.equal(r.rejected, 0);
});

test("core: escaped double quotes are unescaped, not left doubled", () => {
  const r = buildReport(QUOTED);
  assert.ok(Object.hasOwn(r.bySku, 'WIDGET "PRO"'));
});

test("core: the total is the exact sum of the orders", () => {
  const r = buildReport(QUOTED);
  assert.equal(r.totalMinor, 4372);
  assert.equal(r.totalFormatted, "43.72");
});

test("core: bySku groups the quoted skus exactly", () => {
  const r = buildReport(QUOTED);
  assert.deepEqual(r.bySku, QUOTED_BY_SKU);
});

test("core: bySku keys stay sorted", () => {
  const r = buildReport(QUOTED);
  assert.deepEqual(Object.keys(r.bySku), ["ACME, INC.", "PLAIN", 'WIDGET "PRO"']);
});

test("core: toMinorUnits is exact on decimals that float-multiply short", () => {
  for (const [amount, minor] of [
    ["19.99", 1999], ["0.29", 29], ["1.15", 115], ["2.50", 250],
    ["0.07", 7], ["4.35", 435], ["10.01", 1001], ["0.01", 1],
  ]) {
    assert.equal(toMinorUnits(amount), minor, `${amount}`);
  }
});

test("core: formatMinor round-trips the minor units", () => {
  assert.equal(formatMinor(1999), "19.99");
  assert.equal(formatMinor(29), "0.29");
  assert.equal(formatMinor(4372), "43.72");
});

test("core: a quoted price field is still read as a price", () => {
  const text = `id,sku,qty,unitPrice,date
1,QQ,1,"19.99",2024-01-01
`;
  const r = buildReport(text);
  assert.equal(r.accepted, 1);
  assert.equal(r.totalMinor, 1999);
});

test("core: CRLF input does not reject every row", () => {
  const r = buildReport(QUOTED.replace(/\n/g, "\r\n"));
  assert.equal(r.accepted, 3);
  assert.equal(r.totalMinor, 4372);
});

test("core: an ordinary unquoted file still works", () => {
  const text = `id,sku,qty,unitPrice,date
1,A,2,2.50,2024-01-01
2,B,1,1.25,2024-01-02
`;
  const r = buildReport(text);
  assert.equal(r.totalMinor, 625);
  assert.equal(r.totalFormatted, "6.25");
});

// ---------------------------------------------------------------- edge

test("edge: invalid rows are still rejected, not accepted", () => {
  const text = `id,sku,qty,unitPrice,date
1,A,2,2.50,2024-01-01
2,B,abc,1.25,2024-01-02
3,C,1,1.00,2024-02-31
`;
  const r = buildReport(text);
  assert.equal(r.accepted, 1);
  assert.equal(r.rejected, 2);
  assert.equal(r.totalMinor, 500);   // 2.50 x 2
});

test("edge: a row with a missing field is rejected, not silently mapped", () => {
  const text = `id,sku,qty,unitPrice,date
1,A,2,2.50,2024-01-01
2,B,1,1.25
`;
  const r = buildReport(text);
  assert.equal(r.accepted, 1);
  assert.equal(r.rejected, 1);
});

test("edge: comma and escaped quote together in one field", () => {
  const text = `id,sku,qty,unitPrice,date
1,"A ""B"", C",1,1.00,2024-01-01
`;
  const r = buildReport(text);
  assert.equal(r.accepted, 1);
  assert.deepEqual(r.bySku, { 'A "B", C': 100 });
});

test("edge: an empty quoted field is a field, not a column shift", () => {
  const text = `id,sku,qty,unitPrice,date
1,A,1,1.00,2024-01-01
2,"",1,1.00,2024-01-02
`;
  const r = buildReport(text);
  assert.equal(r.rejected, 1);   // empty sku fails validation, but the row is aligned
  assert.equal(r.totalMinor, 100);
});

test("edge: no cents are lost over many small prices", () => {
  const rows = Array.from({ length: 100 }, (_, i) =>
    `${i + 1},S,1,0.07,2024-01-01`);
  const r = buildReport(`id,sku,qty,unitPrice,date\n${rows.join("\n")}\n`);
  assert.equal(r.totalMinor, 700);
});

test("edge: quoted qty is validated as a number, not accepted blindly", () => {
  const text = `id,sku,qty,unitPrice,date
1,A,2,"2.50",2024-01-01
2,B,1,1.00,2024-01-02
`;
  const r = buildReport(text);
  assert.equal(r.totalMinor, 600);
});

test("edge: prices with trailing zeros survive the round trip", () => {
  assert.equal(toMinorUnits("20.00"), 2000);
  assert.equal(formatMinor(2000), "20.00");
  assert.equal(formatMinor(5), "0.05");
});
