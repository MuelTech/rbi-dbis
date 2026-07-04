import { api } from "./api";

export interface DocumentRecord {
  id: string;
  displayId: number;
  issueDate: string;
  purpose: string;
  validityPeriod: string;
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
}

export const documentsService = {
  getTypes: () => api.get<DocumentTypeRecord[]>("/documents/types"),
  getAll: () => api.get<DocumentRecord[]>("/documents"),
  getById: (id: string) => api.get<DocumentRecord>(`/documents/${id}`),
  create: (data: CreateDocumentPayload) =>
    api.post<DocumentRecord>("/documents", data),
};
