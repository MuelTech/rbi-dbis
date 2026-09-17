export interface BatchImportResult {
  created: number;
  skipped: number;
  families: number;
  errors: string[];
}

/**
 * Splits families into chunks without ever splitting a family. Chunking only
 * controls how many POST requests the client sends, so a failure can be
 * retried per chunk.
 */
export function chunkFamilies<T>(families: T[], size: number): T[][] {
  if (size < 1) {
    throw new RangeError("chunk size must be at least 1");
  }
  const chunks: T[][] = [];
  for (let i = 0; i < families.length; i += size) {
    chunks.push(families.slice(i, i + size));
  }
  return chunks;
}

export function mergeChunkResults(results: BatchImportResult[]): BatchImportResult {
  return results.reduce<BatchImportResult>(
    (acc, result) => ({
      created: acc.created + result.created,
      skipped: acc.skipped + result.skipped,
      families: acc.families + result.families,
      errors: [...acc.errors, ...result.errors],
    }),
    { created: 0, skipped: 0, families: 0, errors: [] }
  );
}

export type ImportRowStatus = "success" | "duplicate" | "error";

export interface ImportRowLike {
  data: Record<string, string>;
  status: ImportRowStatus;
  message?: string;
}

export interface FamilySummary {
  familyId: string;
  headName: string;
  memberCount: number;
  status: ImportRowStatus;
  message: string;
}

/**
 * Rolls parsed rows up into one status per family for the preview table.
 *
 * A family is treated as a duplicate when its head already exists, because the
 * server skips the whole family in that case (it only ever creates).
 */
export function summarizeImportFamilies(rows: ImportRowLike[]): FamilySummary[] {
  const byFamily = new Map<string, ImportRowLike[]>();
  for (const row of rows) {
    const id = row.data.family_id;
    if (!id) continue;
    const list = byFamily.get(id);
    if (list) list.push(row);
    else byFamily.set(id, [row]);
  }

  return Array.from(byFamily.entries()).map(([familyId, familyRows]) => {
    const head =
      familyRows.find((r) => r.data.relationship?.toLowerCase() === "head") ??
      familyRows[0];
    const hasError = familyRows.some((r) => r.status === "error");
    const headDuplicate = head?.status === "duplicate";
    const allDuplicate = familyRows.every((r) => r.status === "duplicate");
    const firstError = familyRows.find((r) => r.status === "error");

    const status: ImportRowStatus = hasError
      ? "error"
      : headDuplicate || allDuplicate
        ? "duplicate"
        : "success";

    return {
      familyId,
      headName: `${head?.data.first_name ?? ""} ${head?.data.last_name ?? ""}`.trim(),
      memberCount: familyRows.filter(
        (r) => r.data.relationship?.toLowerCase() !== "head"
      ).length,
      status,
      message: hasError && firstError
        ? firstError.message ?? ""
        : allDuplicate
          ? "All residents already exist"
          : headDuplicate
            ? "Head already exists — family will be skipped"
            : "",
    };
  });
}
