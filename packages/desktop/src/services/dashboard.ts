import { api } from "./api";

export interface ResidentDemographics {
  totalPopulation: number;
  totalHousehold: number;
  totalFamily: number;
  seniorCitizen: number;
  pwd: number;
  voters: number;
  male: number;
  female: number;
}

export interface Personnel {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  documentId: string;
  orNumber: string;
  orderDate: string;
  amount: number;
  personnel: string;
  resident: string;
  documentType: string;
}

export interface TransactionResponse {
  data: Transaction[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  summary: { accumulatedFee: number; totalTransactions: number };
}

export const dashboardService = {
  getResidentDemographics(block?: string): Promise<ResidentDemographics> {
    const params = new URLSearchParams();
    if (block && block !== "All") params.set("block", block);
    const qs = params.toString();
    return api.get<ResidentDemographics>(
      `/dashboard/resident-demographics${qs ? `?${qs}` : ""}`
    );
  },
  getPersonnel: (): Promise<Personnel[]> => {
    return api.get<Personnel[]>("/dashboard/personnel");
  },
  getTransactions: (params: {
    period?: string;
    from?: string;
    to?: string;
    personnelId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.period) searchParams.set("period", params.period);
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.personnelId) searchParams.set("personnelId", params.personnelId);
    if (params.search) searchParams.set("search", params.search);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    const qs = searchParams.toString();
    return api.get<TransactionResponse>(`/dashboard/transactions${qs ? `?${qs}` : ""}`);
  },
  getTransactionsExport: (params: {
    period?: string;
    from?: string;
    to?: string;
    personnelId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.period) searchParams.set("period", params.period);
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.personnelId) searchParams.set("personnelId", params.personnelId);
    const qs = searchParams.toString();
    return api.get<TransactionResponse>(`/dashboard/transactions/export${qs ? `?${qs}` : ""}`);
  },
};
