import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";

const STATUS_MAP_TO_DB: Record<string, string> = {
  Active: "Alive",
  Deceased: "Deceased",
  "Move out": "MovedOut",
};

const STATUS_MAP_TO_UI: Record<string, string> = {
  Alive: "Active",
  Deceased: "Deceased",
  MovedOut: "Move out",
};

function computeAge(dateOfBirth: Date | null): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) age--;
  return age;
}

export async function getResidents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const qStr = (key: string): string => {
      const v = req.query[key];
      return typeof v === "string" ? v.trim() : "";
    };

    const page = Math.max(1, parseInt(qStr("page")) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(qStr("pageSize")) || 20));
    const search = qStr("search");
    const statusParam = qStr("status");
    const sexParam = qStr("sex");
    const voterParam = qStr("voter");

    const where: Prisma.ResidentWhereInput = {};
    const andClauses: Prisma.ResidentWhereInput[] = [];

    if (search) {
      const searchOr: Prisma.ResidentWhereInput[] = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
      const parsed = parseInt(search);
      if (!isNaN(parsed)) {
        searchOr.push({ displayId: { equals: parsed } });
      }
      andClauses.push({ OR: searchOr });
    }

    if (statusParam) {
      const dbStatuses = statusParam
        .split(",")
        .map((s) => STATUS_MAP_TO_DB[s.trim()])
        .filter(Boolean) as any[];
      if (dbStatuses.length > 0) {
        andClauses.push({ statusType: { in: dbStatuses } });
      }
    }

    if (sexParam) {
      const sexValues = sexParam
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s === "Male" || s === "Female") as any[];
      if (sexValues.length > 0) {
        andClauses.push({ sex: { in: sexValues } });
      }
    }

    if (voterParam) {
      if (voterParam === "Voter") {
        andClauses.push({ isVoter: true });
      } else if (voterParam === "Non-Voter") {
        andClauses.push({ isVoter: false });
      }
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const skip = (page - 1) * pageSize;

    const [total, residents] = await Promise.all([
      prisma.resident.count({ where }),
      prisma.resident.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    const data = residents.map((r) => ({
      id: r.id,
      displayId: r.displayId,
      lastName: r.lastName,
      firstName: r.firstName,
      middleName: r.middleName,
      suffix: r.suffix,
      placeOfBirth: r.placeOfBirth,
      dateOfBirth: r.dateOfBirth,
      sex: r.sex,
      civilStatus: r.civilStatus,
      voter: r.isVoter ? "Yes" : "No",
      isVoter: r.isVoter,
      isPwd: r.isPwd,
      isSoloParent: r.isSoloParent,
      isOwner: r.isOwner,
      studentType: r.studentType,
      status: STATUS_MAP_TO_UI[r.statusType] ?? "Active",
      statusType: r.statusType,
      contactNumber: r.contactNumber,
      occupation: r.occupationType,
      profileImage: r.profileImage,
      age: computeAge(r.dateOfBirth),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json({ data, meta: { page, pageSize, total, totalPages } });
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
    const id = req.params.id as string;
    const resident = await prisma.resident.findUnique({
      where: { id },
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
    const data = { ...req.body };
    delete data.displayId;
    delete data.display_id;
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    const resident = await prisma.resident.create({ data });
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
    const id = req.params.id as string;
    const data = { ...req.body };
    delete data.displayId;
    delete data.display_id;
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    const resident = await prisma.resident.update({
      where: { id },
      data,
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
    const id = req.params.id as string;
    await prisma.resident.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
