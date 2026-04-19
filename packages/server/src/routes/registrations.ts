import { Router } from "express";
import { registerFamily } from "../controllers/registrationController.js";

export const registrationRouter = Router();

registrationRouter.post("/", registerFamily);
