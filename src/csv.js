/**
 * Parse CSV text into rows of fields.
 *
 * Parse CSV text into rows of fields, following RFC 4180 quoting.
 *
 * Fields are split on commas, and records on CRLF or LF. A field
 * wrapped in double quotes may contain commas, newlines, and escaped
 * double quotes written as two double quotes; the wrapping quotes are
 * stripped from the value. Empty lines are skipped.
 *
 * @param {string} text - Raw CSV text.
 * @returns {string[][]} Rows of field strings.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // Escaped double quote inside a quoted field.
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushField();
    } else if (ch === "\n" || ch === "\r") {
      // Normalize CRLF to a single record separator.
      if (ch === "\r" && text[i + 1] === "\n") i++;
      pushField();
      // Skip blank lines, matching the previous behaviour.
      if (row.length === 1 && row[0] === "") {
        row = [];
      } else {
        pushRow();
      }
    } else {
      field += ch;
    }
  }

  // Flush the final field/row when the input does not end with a newline.
  pushField();
  if (row.length === 1 && row[0] === "") {
    row = [];
  } else if (row.length > 0) {
    pushRow();
  }

  return rows;
}
