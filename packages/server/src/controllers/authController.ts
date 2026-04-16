import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { prisma } from "@rbi/db";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-jwt-secret-change-me";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "8h") as StringValue;

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    if (!user.isActive) {
      res
        .status(403)
        .json({ error: "Account is disabled. Contact the administrator." });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      { sub: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
    });

    res.json({
      token,
      user: {
        id: user.id,
        displayId: user.displayId,
        username: user.username,
        roleType: user.roleType,
        isActive: user.isActive,
        permission: user.permission,
        lastLogin: new Date().toISOString(),
        firstName: userInfo?.firstName ?? "",
        lastName: userInfo?.lastName ?? "",
        phoneNumber: userInfo?.phoneNumber ?? "",
        profileImage: userInfo?.profileImage ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const authUser = req.user!;
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      omit: { password: true },
      include: { userInfo: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      displayId: user.displayId,
      username: user.username,
      roleType: user.roleType,
      isActive: user.isActive,
      permission: user.permission,
      lastLogin: user.lastLogin?.toISOString() ?? null,
      firstName: user.userInfo?.firstName ?? "",
      lastName: user.userInfo?.lastName ?? "",
      phoneNumber: user.userInfo?.phoneNumber ?? "",
      profileImage: user.userInfo?.profileImage ?? null,
    });
  } catch (err) {
    next(err);
  }
}
