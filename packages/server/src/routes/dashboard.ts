import { Router } from "express";
import { getResidentDemographics, getTransactions, getTransactionsExport, getPersonnel } from "../controllers/dashboardController.js";

export const dashboardRouter = Router();

dashboardRouter.get("/resident-demographics", getResidentDemographics);
dashboardRouter.get("/transactions", getTransactions);
dashboardRouter.get("/transactions/export", getTransactionsExport);
dashboardRouter.get("/personnel", getPersonnel);
