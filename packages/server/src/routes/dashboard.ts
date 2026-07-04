import { Router } from "express";
import { getResidentDemographics, getTransactions } from "../controllers/dashboardController.js";

export const dashboardRouter = Router();

dashboardRouter.get("/resident-demographics", getResidentDemographics);
dashboardRouter.get("/transactions", getTransactions);
