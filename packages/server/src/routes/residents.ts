import { Router } from "express";
import {
  getResidents,
  getResidentById,
  getResidentLookup,
  updateResident,
  deleteResident,
  batchImportResidents,
} from "../controllers/residentController.js";

export const residentRouter = Router();

residentRouter.get("/", getResidents);
residentRouter.get("/lookup", getResidentLookup);
residentRouter.get("/:id", getResidentById);
residentRouter.post("/batch", batchImportResidents);
residentRouter.put("/:id", updateResident);
residentRouter.delete("/:id", deleteResident);
