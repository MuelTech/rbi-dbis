import { api } from "./api";

export interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
  userId: string;
  user?: { firstName: string; lastName: string };
}

export const activityLogsService = {
  getAll: () => api.get<ActivityLog[]>("/activity-logs"),
};
