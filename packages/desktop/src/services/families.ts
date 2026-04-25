import { api } from "./api";

export interface FamilyRow {
  id: string;
  displayId: number;
  familyName: string;
  residentCount: number;
  voterCount: number;
}

export interface FamilySummary {
  motorcycles: number;
  vehicles: number;
  cats: number;
  dogs: number;
}

export interface HouseholdFamiliesResponse {
  data: FamilyRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  summary: FamilySummary;
  householdNo: string;
}

export interface FamilyListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface FamilyMemberRow {
  id: string;
  displayId: number;
  lastName: string;
  firstName: string;
  sex: string;
  age: number;
  voter: string;
  status: string;
}

export interface FamilyDetail {
  id: string;
  displayId: number;
  familyName: string;
  household: { id: string; brgyHouseholdNo: string };
  familyHead: {
    id: string;
    displayId: number;
    firstName: string;
    lastName: string;
    fullName: string;
    isVoter: boolean;
    status: string;
  };
  address: { houseNo: string; streetName: string; alleyName: string };
  pet: { numberOfCats: number; numberOfDogs: number; others: string };
  vehicle: {
    numberOfMotorcycles: number;
    motorcyclePlateNumber: string;
    numberOfVehicles: number;
    vehiclePlateNumber: string;
  };
  members: FamilyMemberRow[];
}

export interface FamilyUpdatePayload {
  address?: { houseNo: string; streetName: string; alleyName: string };
  pet?: { numberOfCats: number; numberOfDogs: number; others: string };
  vehicle?: {
    numberOfMotorcycles: number;
    motorcyclePlateNumber: string;
    numberOfVehicles: number;
    vehiclePlateNumber: string;
  };
}

export const familiesService = {
  listByHousehold: (householdId: string, params: FamilyListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return api.get<HouseholdFamiliesResponse>(
      `/households/${householdId}/families${query ? `?${query}` : ""}`
    );
  },

  getById: (familyId: string) =>
    api.get<FamilyDetail>(`/families/${familyId}`),

  update: (familyId: string, payload: FamilyUpdatePayload) =>
    api.put<FamilyDetail>(`/families/${familyId}`, payload),
};
