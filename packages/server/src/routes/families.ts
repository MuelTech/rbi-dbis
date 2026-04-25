import { Router } from "express";
import {
  getFamilyById,
  updateFamily,
} from "../controllers/familyController.js";

export const familyRouter = Router();

familyRouter.get("/:familyId", getFamilyById);
familyRouter.put("/:familyId", updateFamily);
