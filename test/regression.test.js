import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../src/csv.js";
import { toMinorUnits } from "../src/money.js";
import { buildReport } from "../src/report.js";

// Regression tests for two root-cause bugs:
// 1. parseCsv split naively on newlines/commas, so RFC 4180 quoted
//    fields (containing commas or escaped quotes) produced wrong field
//    counts and valid orders were rejected and dropped from the report.
// 2. toMinorUnits multiplied by 100 in binary floating point and
//    truncated, losing cents on prices like 4.35 (434 instead of 435).

test("toMinorUnits is exact for prices where float math loses a cent", () => {
  assert.equal(toMinorUnits("4.35"), 435); // 4.35 * 100 === 434.9999…
  assert.equal(toMinorUnits("1.15"), 115); // 1.15 * 100 === 114.9999…
  assert.equal(toMinorUnits("8.20"), 820); // 8.20 * 100 === 819.9999…
  assert.equal(toMinorUnits("19.99"), 1999);
  assert.equal(toMinorUnits("0.07"), 7);
  assert.equal(toMinorUnits("57.03"), 5703);
  assert.equal(toMinorUnits(4.35), 435); // numeric input also works
});

test("toMinorUnits handles short, missing, and extra decimals", () => {
  assert.equal(toMinorUnits("2.5"), 250);
  assert.equal(toMinorUnits("19."), 1900);
  assert.equal(toMinorUnits("7"), 700);
  assert.equal(toMinorUnits(".5"), 50);
  assert.equal(toMinorUnits("4.345"), 434); // truncates, as before
  assert.equal(toMinorUnits("-4.35"), -435);
  assert.equal(toMinorUnits("-4.356"), -435); // toward zero, as before
  assert.equal(toMinorUnits("0"), 0);
  assert.ok(Number.isNaN(toMinorUnits("abc")));
  assert.equal(toMinorUnits(""), 0); // same as before: Number("") is 0
});

test("parseCsv keeps quoted fields with embedded commas as one field", () => {
  assert.deepEqual(
    parseCsv('id,sku,qty,unitPrice,date\n1,"ACME, INC.",2,19.99,2024-01-01\n'),
    [
      ["id", "sku", "qty", "unitPrice", "date"],
      ["1", "ACME, INC.", "2", "19.99", "2024-01-01"],
    ]
  );
});

test("parseCsv unescodes doubled quotes inside quoted fields", () => {
  assert.deepEqual(parseCsv('2,"WIDGET ""PRO""",1,4.35,2024-01-02'), [
    ["2", 'WIDGET "PRO"', "1", "4.35", "2024-01-02"],
  ]);
});

test("parseCsv handles CRLF line endings and quoted multi-line fields", () => {
  assert.deepEqual(parseCsv('a,b\r\n1,"x\ny"\r\n'), [
    ["a", "b"],
    ["1", "x\ny"],
  ]);
});

test("report: quoted-comma and quoted-quote orders are not dropped", () => {
  const report = buildReport(`id,sku,qty,unitPrice,date
1,"ACME, INC.",2,19.99,2024-01-01
2,"WIDGET ""PRO""",1,4.35,2024-01-02
`);
  assert.equal(report.rowsIn, 2);
  assert.equal(report.accepted, 2);
  assert.equal(report.rejected, 0);
  assert.deepEqual(report.rejectedRows, []);
  // 19.99 * 2 + 4.35 = 39.98 + 4.35 = 44.33 exactly
  assert.equal(report.totalMinor, 4433);
  assert.equal(report.totalFormatted, "44.33");
  assert.deepEqual(report.bySku, {
    "ACME, INC.": 3998,
    'WIDGET "PRO"': 435,
  });
});

test("report: CRLF input counts every order", () => {
  const text =
    "id,sku,qty,unitPrice,date\r\n" +
    "1,A,2,2.50,2024-01-01\r\n" +
    "2,B,1,4.35,2024-01-02\r\n";
  const report = buildReport(text);
  assert.equal(report.rowsIn, 2);
  assert.equal(report.accepted, 2);
  assert.equal(report.rejected, 0);
  assert.equal(report.totalMinor, 935); // 5.00 + 4.35, no cent lost
});

test("report: total matches the exact sum for float-hostile prices", () => {
  const report = buildReport(`id,sku,qty,unitPrice,date
1,A,3,4.35,2024-01-01
2,B,1,1.15,2024-01-02
3,C,2,8.20,2024-01-03
`);
  // 3 * 435 + 115 + 2 * 820 = 1305 + 115 + 1640 = 3060
  assert.equal(report.totalMinor, 3060);
  assert.equal(report.totalFormatted, "30.60");
  assert.equal(report.accepted, 3);
  assert.equal(report.rejected, 0);
});
