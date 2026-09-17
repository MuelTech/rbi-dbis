import { Router } from "express";
import {
  getResidents,
  getResidentById,
  updateResident,
  deleteResident,
  batchImportResidents,
} from "../controllers/residentController.js";

export const residentRouter = Router();

residentRouter.get("/", getResidents);
residentRouter.get("/:id", getResidentById);
residentRouter.post("/batch", batchImportResidents);
residentRouter.put("/:id", updateResident);
residentRouter.delete("/:id", deleteResident);
