import { test } from "node:test";
import assert from "node:assert/strict";
import { toMinorUnits, formatMinor } from "../src/money.js";

test("toMinorUnits: exact for two-decimal values", () => {
  assert.equal(toMinorUnits("19.99"), 1999);
  assert.equal(toMinorUnits("0.50"), 50);
});

test("toMinorUnits: rounds values that floating point breaks", () => {
  // Regression: truncation turned 4.35 into 434 minor units because
  // 4.35 * 100 evaluates to 434.99999999999994.
  assert.equal(toMinorUnits("4.35"), 435);
  assert.equal(toMinorUnits(4.35), 435);
  assert.equal(toMinorUnits("8.40"), 840);
  assert.equal(toMinorUnits("445.13"), 44513);
});

test("toMinorUnits: whole amounts", () => {
  assert.equal(toMinorUnits("10"), 1000);
  assert.equal(toMinorUnits("10.00"), 1000);
});

test("formatMinor: renders two decimal places", () => {
  assert.equal(formatMinor(1999), "19.99");
  assert.equal(formatMinor(5), "0.05");
  assert.equal(formatMinor(7550), "75.50");
});
