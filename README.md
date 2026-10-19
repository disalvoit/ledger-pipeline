# ledger-pipeline

A small CSV-to-ledger pipeline that reads an order file as text and
reports revenue. It is written in ESM with zero dependencies.

## Pipeline stages

Data flows through the modules in this order:

1. `src/csv.js` — `parseCsv(text)` turns raw CSV text into rows of fields.
2. `src/parse.js` — `parseOrders(text)` skips the header and maps each
   row's fields onto the column names from `src/schema.js`.
3. `src/validate.js` — `validateAll(rows)` splits rows into accepted and
   rejected, flagging malformed rows.
4. `src/money.js` / `src/dates.js` — money and date handling helpers.
5. `src/aggregate.js` — `totalMinor(orders)` and `bySku(orders)`.
6. `src/report.js` — `buildReport(text)` composes the stages, and
   `renderReport(report)` turns a report into a short string.

## Input format

The input is CSV text. The first line is the header:

```
id,sku,qty,unitPrice,date
```

followed by one order per line. A field that contains a comma or a
double quote is wrapped in double quotes, and an embedded double quote
is written as two double quotes (RFC 4180 style). For example:

```
1,"ACME, INC.",2,19.99,2024-01-01
2,"WIDGET ""PRO""",1,4.35,2024-01-02
```

## Money

Money is stored in integer minor units (cents). A price of `19.99` is
`1999` minor units. `toMinorUnits` converts a decimal price string to
minor units, and `formatMinor` converts back to a `"19.99"`-style
string.

## Tests

```
npm test
```

Runs the test suite with `node --test`. No build step is required.

## Held-out grade

`held-out/ep5.test.mjs` is the suite the episode grades against — the tests the
models never saw. Run it with `node --test held-out/`. On the shipped `main` it
passes 5 of 17 checks.
