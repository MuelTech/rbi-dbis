import { api } from "./api";

export interface DocumentRecord {
  id: string;
  displayId?: number;
  type: string;
  dateIssued: string;
  personnel: string;
  fee: number;
  data?: Record<string, unknown>;
  residentId: string;
}

export const documentsService = {
  getAll: () => api.get<DocumentRecord[]>("/documents"),
  getById: (id: string) => api.get<DocumentRecord>(`/documents/${id}`),
  create: (data: Partial<DocumentRecord>) =>
    api.post<DocumentRecord>("/documents", data),
};
