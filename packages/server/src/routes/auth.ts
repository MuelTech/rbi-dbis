import { Router } from "express";
import { login, me, changePassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);
authRouter.put("/change-password", requireAuth, changePassword);
