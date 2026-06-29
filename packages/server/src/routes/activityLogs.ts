import { Router } from "express";
import { getActivityLogs, deleteActivityLog, bulkDeleteActivityLogs } from "../controllers/activityLogController.js";

export const activityLogRouter = Router();

activityLogRouter.get("/", getActivityLogs);
activityLogRouter.delete("/:id", deleteActivityLog);
activityLogRouter.post("/bulk-delete", bulkDeleteActivityLogs);
