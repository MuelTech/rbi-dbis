import { Router } from "express";
import { getSettings, updateSettings, backupData, restoreData } from "../controllers/settingsController.js";

export const settingsRouter = Router();

settingsRouter.get("/", getSettings);
settingsRouter.put("/", updateSettings);
settingsRouter.get("/backup", backupData);
settingsRouter.post("/restore", restoreData);
