/** Coerce cell text to number, Date, or plain string for Excel typing. */
export function parseCellValue(raw: string): string | number | Date {
  const text = raw.trim();
  if (!text) return "";

  const normalized = text.replace(/,/g, "");
  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    const n = Number(normalized);
    if (Number.isFinite(n)) return n;
  }

  const iso = Date.parse(text);
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(text) && !Number.isNaN(iso)) {
    return new Date(iso);
  }

  return text.replace(/\s+/g, " ");
}

/** Merge continuation lines into prior row cells (multi-line cell content). */
export function mergeContinuationRows(rows: string[][]): string[][] {
  if (rows.length === 0) return rows;

  const merged: string[][] = [rows[0].map((c) => c.trim())];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].map((c) => c.trim());
    const nonEmpty = row.filter(Boolean).length;
    const prev = merged[merged.length - 1];

    if (nonEmpty === 1) {
      const col = row.findIndex(Boolean);
      if (col >= 0) {
        prev[col] = prev[col] ? `${prev[col]}\n${row[col]}` : row[col];
        continue;
      }
    }

    merged.push(row);
  }

  return merged;
}
