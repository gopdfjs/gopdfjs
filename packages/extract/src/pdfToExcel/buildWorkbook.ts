import ExcelJS from "exceljs";
import { mergeContinuationRows, parseCellValue } from "./parseCellValue";
import type { DetectedTable, ExportFormat, ExportOptions, SheetMode } from "./types";

function filterTables(tables: DetectedTable[], includedTableIds?: string[]): DetectedTable[] {
  if (!includedTableIds?.length) return tables;
  const allowed = new Set(includedTableIds);
  return tables.filter((t) => allowed.has(t.id));
}

function tableToRows(table: DetectedTable): string[][] {
  const raw = table.rows.map((r) => r.cells.map((c) => c.trim()));
  return mergeContinuationRows(raw);
}

function writeRow(ws: ExcelJS.Worksheet, row: string[]) {
  const excelRow = ws.addRow(
    row.map((cell) => {
      const parsed = parseCellValue(cell);
      return parsed;
    }),
  );
  excelRow.eachCell((cell) => {
    cell.alignment = { wrapText: true, vertical: "top" };
    if (typeof cell.value === "number") {
      cell.numFmt = "0.##########";
    }
    if (cell.value instanceof Date) {
      cell.numFmt = "yyyy-mm-dd";
    }
  });
}

async function buildXlsx(
  tables: DetectedTable[],
  sheetMode: SheetMode,
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();

  if (sheetMode === "per-page") {
    const byPage = new Map<number, DetectedTable[]>();
    for (const table of tables) {
      const list = byPage.get(table.pageIndex) ?? [];
      list.push(table);
      byPage.set(table.pageIndex, list);
    }
    for (const [pageIndex, pageTables] of [...byPage.entries()].sort((a, b) => a[0] - b[0])) {
      const ws = workbook.addWorksheet(`Page ${pageIndex + 1}`);
      for (const table of pageTables) {
        for (const row of tableToRows(table)) writeRow(ws, row);
        ws.addRow([]);
      }
    }
  } else {
    const ws = workbook.addWorksheet("Extracted Tables");
    for (const table of tables) {
      for (const row of tableToRows(table)) writeRow(ws, row);
      ws.addRow([]);
    }
  }

  if (workbook.worksheets.length === 0) {
    workbook.addWorksheet("Empty").addRow(["No tables detected"]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(tables: DetectedTable[], sheetMode: SheetMode): Blob {
  const sections: string[] = [];

  if (sheetMode === "per-page") {
    const byPage = new Map<number, DetectedTable[]>();
    for (const table of tables) {
      const list = byPage.get(table.pageIndex) ?? [];
      list.push(table);
      byPage.set(table.pageIndex, list);
    }
    for (const [pageIndex, pageTables] of [...byPage.entries()].sort((a, b) => a[0] - b[0])) {
      sections.push(`# Page ${pageIndex + 1}`);
      for (const table of pageTables) {
        for (const row of tableToRows(table)) {
          sections.push(row.map(escapeCsvField).join(","));
        }
        sections.push("");
      }
    }
  } else {
    for (const table of tables) {
      for (const row of tableToRows(table)) {
        sections.push(row.map(escapeCsvField).join(","));
      }
      sections.push("");
    }
  }

  const body = sections.join("\n").trim() || "No tables detected";
  return new Blob([body], { type: "text/csv;charset=utf-8" });
}

/** Build XLSX or CSV blob from detected tables. */
export async function exportTables(
  tables: DetectedTable[],
  options: ExportOptions,
): Promise<Blob> {
  const selected = filterTables(tables, options.includedTableIds);
  if (options.format === "csv") {
    return buildCsv(selected, options.sheetMode);
  }
  return buildXlsx(selected, options.sheetMode);
}

export type { ExportFormat, SheetMode };
