import { api } from "./api";

export interface AuditLog {
  id: string;
  timestamp: string;
  tableName: string;
  recordId: string;
  actionType: string;
  changes: Record<string, [any, any]> | null;
  summary: string | null;
  personnel: string;
  userId: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityLogFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  actionType?: string;
  tableName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const activityLogsService = {
  getAll: (params?: ActivityLogFilters) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.actionType) searchParams.set("actionType", params.actionType);
    if (params?.tableName) searchParams.set("tableName", params.tableName);
    if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.set("dateTo", params.dateTo);
    const qs = searchParams.toString();
    return api.get<AuditLogResponse>(`/activity-logs${qs ? `?${qs}` : ""}`);
  },
  delete: (id: string) => api.delete(`/activity-logs/${id}`),
  bulkDelete: (ids: string[]) => api.post("/activity-logs/bulk-delete", { ids }),
  bulkDeleteOlderThan: (date: string) => api.post("/activity-logs/bulk-delete", { olderThan: date }),
};
