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

export const dashboardService = {
  getResidentDemographics(block?: string): Promise<ResidentDemographics> {
    const params = new URLSearchParams();
    if (block && block !== "All") params.set("block", block);
    const qs = params.toString();
    return api.get<ResidentDemographics>(
      `/dashboard/resident-demographics${qs ? `?${qs}` : ""}`
    );
  },
};
