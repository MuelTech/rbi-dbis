import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";

export async function getResidents(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const residents = await prisma.resident.findMany({
      include: { household: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(residents);
  } catch (err) {
    next(err);
  }
}

export async function getResidentById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const resident = await prisma.resident.findUnique({
      where: { id: req.params.id },
      include: { household: true, documents: true },
    });
    if (!resident) return res.status(404).json({ error: "Resident not found" });
    res.json(resident);
  } catch (err) {
    next(err);
  }
}

export async function createResident(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const resident = await prisma.resident.create({ data: req.body });
    res.status(201).json(resident);
  } catch (err) {
    next(err);
  }
}

export async function updateResident(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const resident = await prisma.resident.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(resident);
  } catch (err) {
    next(err);
  }
}

export async function deleteResident(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await prisma.resident.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
