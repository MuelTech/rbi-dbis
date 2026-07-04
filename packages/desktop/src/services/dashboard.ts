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

export interface Transaction {
  id: string;
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
  getTransactions: (params: {
    period?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.period) searchParams.set("period", params.period);
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    const qs = searchParams.toString();
    return api.get<TransactionResponse>(`/dashboard/transactions${qs ? `?${qs}` : ""}`);
  },
};
