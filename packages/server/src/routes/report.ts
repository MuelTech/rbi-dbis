import { Router } from "express";
import { getFilteredResidents } from "../controllers/reportController.js";

export const reportRouter = Router();

reportRouter.get("/residents", getFilteredResidents);