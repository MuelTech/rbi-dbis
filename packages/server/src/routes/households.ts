import { Router } from "express";
import {
  getHouseholds,
  getHouseholdById,
  getHouseholdFamilies,
  createHousehold,
  updateHousehold,
  deleteHousehold,
} from "../controllers/householdController.js";

export const householdRouter = Router();

householdRouter.get("/", getHouseholds);
householdRouter.get("/:householdId/families", getHouseholdFamilies);
householdRouter.get("/:id", getHouseholdById);
householdRouter.post("/", createHousehold);
householdRouter.put("/:id", updateHousehold);
householdRouter.delete("/:id", deleteHousehold);
