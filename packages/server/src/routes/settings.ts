import { Router } from "express";
import {
  getSettings,
  updateSettings,
  backupData,
  restoreData,
  verifyBackupPassword,
} from "../controllers/settingsController.js";
import { requireBackupUnlock } from "../middleware/backupUnlock.js";

export const settingsRouter = Router();

settingsRouter.get("/", getSettings);
settingsRouter.put("/", updateSettings);
settingsRouter.post("/verify-password", verifyBackupPassword);
settingsRouter.get("/backup", requireBackupUnlock, backupData);
settingsRouter.post("/restore", requireBackupUnlock, restoreData);
