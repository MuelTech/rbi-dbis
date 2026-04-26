import { Router } from "express";
import {
  getFamilyById,
  updateFamily,
  addFamilyMember,
} from "../controllers/familyController.js";

export const familyRouter = Router();

familyRouter.get("/:familyId", getFamilyById);
familyRouter.put("/:familyId", updateFamily);
familyRouter.post("/:familyId/members", addFamilyMember);
