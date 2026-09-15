import type { Request, Response, NextFunction } from "express";

export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.user?.roleType !== "SuperAdmin") {
    res.status(403).json({ error: "SuperAdmin access required" });
    return;
  }
  next();
}
