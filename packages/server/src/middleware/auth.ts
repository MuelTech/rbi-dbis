import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "@rbi/db";

export interface JwtPayload {
  sub: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        roleType: string;
        isActive: boolean;
        permission: string | null;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret-change-me";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed token" });
    return;
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    prisma.user
      .findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          username: true,
          roleType: true,
          isActive: true,
          permission: true,
        },
      })
      .then((user) => {
        if (!user || !user.isActive) {
          res.status(401).json({ error: "User inactive or not found" });
          return;
        }
        req.user = user;
        next();
      })
      .catch(next);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
