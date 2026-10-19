/**
 * Parse CSV text into rows of fields.
 *
 * Follows RFC 4180 quoting: a field may be wrapped in double quotes, may
 * contain commas and line breaks, and represents an embedded double quote
 * as two adjacent double quotes. Records are terminated by LF or CRLF;
 * blank lines (including the trailing newline at end of file) are skipped.
 *
 * @param {string} text - Raw CSV text.
 * @returns {string[][]} Rows of field strings.
 */
export function parseCsv(text) {
  const source = String(text ?? "");
  const rows = [];

  let row = [];
  let field = "";
  let fieldStarted = false;
  let inQuotes = false;
  let rowHasContent = false;
  let i = source.charCodeAt(0) === 0xfeff ? 1 : 0;

  const endField = () => {
    row.push(field);
    field = "";
    fieldStarted = false;
  };

  const endRow = () => {
    endField();
    if (rowHasContent) {
      rows.push(row);
    }
    row = [];
    rowHasContent = false;
  };

  while (i < source.length) {
    const ch = source[i];

    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"' && !fieldStarted && field === "") {
      inQuotes = true;
      fieldStarted = true;
      rowHasContent = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      endField();
      rowHasContent = true;
      i += 1;
      continue;
    }

    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") {
        i += 1;
      }
      i += 1;
      endRow();
      continue;
    }

    field += ch;
    rowHasContent = true;
    i += 1;
  }

  if (rowHasContent) {
    endRow();
  }

  return rows;
}
