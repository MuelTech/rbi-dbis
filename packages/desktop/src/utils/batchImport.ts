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
