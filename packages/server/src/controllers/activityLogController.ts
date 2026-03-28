import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";

export async function getActivityLogs(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const logs = await prisma.activityLog.findMany({
      include: { user: { omit: { password: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}
