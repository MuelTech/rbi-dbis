import { Router } from "express";
import {
  getSettings,
  updateSettings,
  backupData,
  restoreData,
  verifyBackupPassword,
  getRecoveryKey,
  regenerateRecoveryKeyHandler,
} from "../controllers/settingsController.js";
import { requireBackupUnlock } from "../middleware/backupUnlock.js";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin.js";

export const settingsRouter = Router();

settingsRouter.get("/", getSettings);
settingsRouter.put("/", updateSettings);
settingsRouter.post("/verify-password", verifyBackupPassword);
settingsRouter.get("/backup", requireBackupUnlock, backupData);
settingsRouter.post("/restore", requireBackupUnlock, restoreData);
settingsRouter.get("/encryption/recovery-key", requireSuperAdmin, getRecoveryKey);
settingsRouter.post(
  "/encryption/recovery-key/regenerate",
  requireSuperAdmin,
  regenerateRecoveryKeyHandler
);
