import { Router } from "express";
import {
  getFilteredResidents,
  logReportExport,
} from "../controllers/reportController.js";

export const reportRouter = Router();

reportRouter.get("/residents", getFilteredResidents);
reportRouter.post("/export", logReportExport);