/**
 * Parse CSV text into rows of fields (RFC 4180).
 *
 * Handles quoted fields: a field wrapped in double quotes may contain
 * commas, and an embedded double quote is written as two double quotes.
 * Quotes are stripped and escapes unescaped in the returned fields.
 * Line endings may be LF, CRLF, or CR; quoted fields may even span
 * multiple lines. Empty lines are skipped.
 *
 * @param {string} text - Raw CSV text.
 * @returns {string[][]} Rows of field strings.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false; // inside a double-quoted field
  let rowActive = false; // current row has seen at least one field

  const endField = () => {
    row.push(field);
    field = "";
    rowActive = true;
  };

  const endRow = () => {
    if (rowActive || field !== "") {
      row.push(field);
      rows.push(row);
    }
    row = [];
    field = "";
    rowActive = false;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'; // escaped double quote
          i++;
        } else {
          quoted = false; // closing quote
        }
      } else {
        field += ch; // any character, including newlines, is literal
      }
    } else if (ch === '"') {
      quoted = true;
      rowActive = true;
    } else if (ch === ",") {
      endField();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") {
        i++; // consume CRLF as one line break
      }
      endRow();
    } else {
      field += ch;
    }
  }
  endRow(); // flush the final line if it lacked a trailing newline

  return rows;
}
