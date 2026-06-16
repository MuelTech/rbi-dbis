import { Router } from "express";
import {
  getArchivedFamilies,
  restoreFamily,
} from "../controllers/archivedController.js";

export const archivedRouter = Router();

archivedRouter.get("/", getArchivedFamilies);
archivedRouter.patch("/:familyId/restore", restoreFamily);
