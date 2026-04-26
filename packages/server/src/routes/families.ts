import { Router } from "express";
import {
  getFamilyById,
  updateFamily,
  addFamilyMember,
  reassignHead,
} from "../controllers/familyController.js";

export const familyRouter = Router();

familyRouter.get("/:familyId", getFamilyById);
familyRouter.put("/:familyId", updateFamily);
familyRouter.patch("/:familyId/head", reassignHead);
familyRouter.post("/:familyId/members", addFamilyMember);
