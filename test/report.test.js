import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, renderReport } from "../src/report.js";

// A well-formed input with no quoted fields and only "clean" prices
// (values for which the minor-unit conversion is exact).
const HAPPY = `id,sku,qty,unitPrice,date
1,A,2,2.50,2024-01-01
2,B,1,1.25,2024-01-02
3,C,4,10.00,2024-01-03
4,D,1,0.50,2024-01-04
5,E,2,4.00,2024-01-05
6,F,1,20.00,2024-01-06
7,G,3,0.25,2024-01-07
`;

const HAPPY_BY_SKU = {
  A: 500,
  B: 125,
  C: 4000,
  D: 50,
  E: 800,
  F: 2000,
  G: 75,
};

test("happy path: rowsIn counts every data row", () => {
  const report = buildReport(HAPPY);
  assert.equal(report.rowsIn, 7);
});

test("happy path: all rows are accepted", () => {
  const report = buildReport(HAPPY);
  assert.equal(report.accepted, 7);
});

test("happy path: no rows are rejected", () => {
  const report = buildReport(HAPPY);
  assert.equal(report.rejected, 0);
});

test("happy path: totalMinor is the exact sum", () => {
  const report = buildReport(HAPPY);
  assert.equal(report.totalMinor, 7550);
});

test("happy path: totalFormatted is the decimal total", () => {
  const report = buildReport(HAPPY);
  assert.equal(report.totalFormatted, "75.50");
});

test("happy path: bySku groups revenue per sku", () => {
  const report = buildReport(HAPPY);
  assert.deepEqual(report.bySku, HAPPY_BY_SKU);
});

test("happy path: bySku keys are sorted", () => {
  const report = buildReport(HAPPY);
  assert.deepEqual(Object.keys(report.bySku), ["A", "B", "C", "D", "E", "F", "G"]);
});

test("a row with an empty sku is rejected", () => {
  const report = buildReport(`id,sku,qty,unitPrice,date
1,A,2,2.50,2024-01-01
2,,1,1.25,2024-01-02
`);
  assert.equal(report.accepted, 1);
  assert.equal(report.rejected, 1);
  assert.deepEqual(report.rejectedRows, ["2"]);
});

test("a row with too many fields is rejected", () => {
  const report = buildReport(`id,sku,qty,unitPrice,date
1,A,2,2.50,2024-01-01,EXTRA
`);
  assert.equal(report.accepted, 0);
  assert.equal(report.rejected, 1);
});

test("a row with a malformed date is rejected", () => {
  const report = buildReport(`id,sku,qty,unitPrice,date
1,A,2,2.50,2024/01/01
`);
  assert.equal(report.rejected, 1);
  assert.equal(report.accepted, 0);
});

test("a row with a non-positive quantity is rejected", () => {
  const report = buildReport(`id,sku,qty,unitPrice,date
1,A,0,2.50,2024-01-01
`);
  assert.equal(report.rejected, 1);
  assert.equal(report.accepted, 0);
});

test("renderReport contains the formatted total", () => {
  const report = buildReport(HAPPY);
  const text = renderReport(report);
  assert.match(text, /75\.50/);
  assert.match(text, /accepted: 7/);
});

// Regression: RFC 4180 quoting + float-truncated money once made this
// input report a short total and drop the quoted-comma orders entirely.
const TRICKY = `id,sku,qty,unitPrice,date
1,"ACME, INC.",2,19.99,2024-01-01
2,"WIDGET ""PRO""",1,4.35,2024-01-02
3,D,3,445.13,2024-01-03
4,E,1,8.40,2024-01-04
`;

test("regression: quoted fields and float prices report exact totals", () => {
  const report = buildReport(TRICKY);
  assert.equal(report.rowsIn, 4);
  assert.equal(report.accepted, 4);
  assert.equal(report.rejected, 0);
  // 2*1999 + 1*435 + 3*44513 + 1*840 = 138812
  assert.equal(report.totalMinor, 138812);
  assert.equal(report.totalFormatted, "1388.12");
  assert.deepEqual(report.bySku, { "ACME, INC.": 3998, "WIDGET \"PRO\"": 435, D: 133539, E: 840 });
});
