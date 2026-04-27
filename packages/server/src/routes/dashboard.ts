import { Router } from "express";
import { getResidentDemographics } from "../controllers/dashboardController.js";

export const dashboardRouter = Router();

dashboardRouter.get("/resident-demographics", getResidentDemographics);
