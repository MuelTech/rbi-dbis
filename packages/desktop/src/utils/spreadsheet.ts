import * as XLSX from "xlsx";

/**
 * Parses the first sheet into normalized string rows.
 *
 * `raw: true` is essential: without it the CSV/Excel parser coerces values,
 * turning "1980-01-01" into an Excel serial number and dropping leading zeros
 * from fields like household_number and contact_number.
 */
export function readSheetRows(data: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(new Uint8Array(data), { type: "array", raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });
  return json.map((row) => {
    const normalized: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      normalized[key.toLowerCase().trim().replace(/\s+/g, "_")] = String(
        row[key]
      ).trim();
    }
    return normalized;
  });
}
