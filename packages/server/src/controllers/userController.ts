import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@rbi/db";
import { logCreate, logUpdate } from "../services/auditService.js";

const SALT_ROUNDS = 10;

function extractUserInfoFields(body: Record<string, any>) {
  const nested = body.userInfo ?? {};
  const firstName = body.firstName ?? nested.firstName;
  const lastName = body.lastName ?? nested.lastName;
  const phoneNumber = body.phoneNumber ?? nested.phoneNumber;

  const data = { ...body };
  delete data.firstName;
  delete data.lastName;
  delete data.phoneNumber;
  delete data.userInfo;

  const hasInfo = firstName !== undefined || lastName !== undefined;
  return {
    data,
    userInfoFields: hasInfo
      ? { firstName, lastName, phoneNumber }
      : null,
  };
}

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
    const { data, userInfoFields } = extractUserInfoFields(req.body);
    const authUserId = req.user?.id;
    delete data.displayId;
    delete data.display_id;
    if (data.password) {
      data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    } else {
      data.password = await bcrypt.hash("brgy418", SALT_ROUNDS);
    }
    const user = await prisma.user.create({
      data: {
        ...data,
        ...(userInfoFields && { userInfo: { create: userInfoFields } }),
      },
      omit: { password: true },
      include: { userInfo: true },
    });

    if (authUserId) {
      await logCreate("users", user.id, authUserId, {
        username: user.username,
        roleType: user.roleType,
      });
    }

    res.status(201).json(user);
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
    const authUserId = req.user?.id;

    const oldUser = await prisma.user.findUnique({
      where: { id },
      include: { userInfo: true },
    });

    const { data, userInfoFields } = extractUserInfoFields(req.body);
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
      data: {
        ...data,
        ...(userInfoFields && {
          userInfo: {
            upsert: {
              create: userInfoFields,
              update: userInfoFields,
            },
          },
        }),
      },
      omit: { password: true },
      include: { userInfo: true },
    });

    if (authUserId && oldUser) {
      const oldData = {
        username: oldUser.username,
        roleType: oldUser.roleType,
        isActive: oldUser.isActive,
        firstName: oldUser.userInfo?.firstName,
        lastName: oldUser.userInfo?.lastName,
      };
      const updatedData = {
        username: user.username,
        roleType: user.roleType,
        isActive: user.isActive,
        firstName: user.userInfo?.firstName,
        lastName: user.userInfo?.lastName,
      };
      await logUpdate("users", id, authUserId, oldData, updatedData);
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}
