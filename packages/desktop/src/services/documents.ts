import { api } from "./api";

export interface DocumentRecord {
  id: string;
  displayId: number;
  issueDate: string;
  purpose: string;
  validityPeriod: string;
  formData: Record<string, any> | null;
  documentType: {
    id: string;
    documentName: string;
    amount: number;
  };
  order: {
    id: string;
    displayId: number;
    orNumber: string;
    amount: number;
    orderDate: string;
  } | null;
}

export interface DocumentTypeRecord {
  id: string;
  documentName: string;
  amount: number;
}

export interface CreateDocumentPayload {
  residentId: string;
  documentTypeId: string;
  purpose: string;
  validityPeriod?: string;
  formData?: Record<string, any>;
}

export const documentsService = {
  getTypes: () => api.get<DocumentTypeRecord[]>("/documents/types"),
  getAll: () => api.get<DocumentRecord[]>("/documents"),
  getById: (id: string) => api.get<DocumentRecord>(`/documents/${id}`),
  create: (data: CreateDocumentPayload) =>
    api.post<DocumentRecord>("/documents", data),
  getLastDocument: async (
    residentId: string,
    documentTypeId: string
  ): Promise<{
    id: string;
    formData: Record<string, any> | null;
    purpose: string | null;
    issueDate: string;
  } | null> => {
    const params = new URLSearchParams({
      residentId,
      documentTypeId,
    });
    return api.get(`/documents/last?${params.toString()}`);
  },
  getNextOrNumber: (): Promise<{ orNumber: string }> => {
    return api.get("/documents/next-or-number");
  },
};
