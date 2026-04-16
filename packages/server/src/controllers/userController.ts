import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@rbi/db";

const SALT_ROUNDS = 10;

export async function getUsers(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const users = await prisma.user.findMany({
      omit: { password: true },
      include: { userInfo: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      omit: { password: true },
      include: { userInfo: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = { ...req.body };
    delete data.displayId;
    delete data.display_id;
    if (data.password) {
      data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }
    const user = await prisma.user.create({ data });
    const { password: _, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const data = { ...req.body };
    delete data.displayId;
    delete data.display_id;
    if (data.password) {
      const isBcrypt = /^\$2[aby]\$\d{2}\$.{53}$/.test(data.password);
      if (!isBcrypt) {
        data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
      }
    }
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
}
