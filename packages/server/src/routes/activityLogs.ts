import { Router } from "express";
import { getActivityLogs } from "../controllers/activityLogController.js";

export const activityLogRouter = Router();

activityLogRouter.get("/", getActivityLogs);
