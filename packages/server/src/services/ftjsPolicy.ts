export const FTJS_DOCUMENT_NAME = "Barangay Certificate (FTJS)";

export type FtjsStatus = {
  hasFtjs: boolean;
  documentId?: string;
  issueDate?: string;
  validUntil?: string;
  isValid?: boolean;
  orNumber?: string | null;
  formData?: Record<string, unknown> | null;
  purpose?: string | null;
};

export function computeFtjsValidUntil(issueDate: Date): Date {
  const d = new Date(issueDate.getTime());
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function isFtjsStillValid(validUntil: Date, now: Date = new Date()): boolean {
  const end = new Date(validUntil.getTime());
  end.setHours(23, 59, 59, 999);
  return now.getTime() <= end.getTime();
}

export function formatDateLong(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
