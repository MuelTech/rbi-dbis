import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";

export async function getHouseholds(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const households = await prisma.household.findMany({
      include: { members: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(households);
  } catch (err) {
    next(err);
  }
}

export async function getHouseholdById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const household = await prisma.household.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });
    if (!household)
      return res.status(404).json({ error: "Household not found" });
    res.json(household);
  } catch (err) {
    next(err);
  }
}

export async function createHousehold(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const household = await prisma.household.create({ data: req.body });
    res.status(201).json(household);
  } catch (err) {
    next(err);
  }
}

export async function updateHousehold(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const household = await prisma.household.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(household);
  } catch (err) {
    next(err);
  }
}

export async function deleteHousehold(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await prisma.household.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
