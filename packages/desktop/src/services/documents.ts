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

export interface FtjsStatus {
  hasFtjs: boolean;
  documentId?: string;
  issueDate?: string;
  validUntil?: string;
  isValid?: boolean;
  orNumber?: string | null;
  formData?: Record<string, any> | null;
  purpose?: string | null;
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
  getFtjsStatus: async (residentId: string): Promise<FtjsStatus> => {
    return api.get(
      `/documents/ftjs-status?residentId=${encodeURIComponent(residentId)}`
    );
  },
  getNextOrNumber: (): Promise<{ orNumber: string }> => {
    return api.get("/documents/next-or-number");
  },
};
