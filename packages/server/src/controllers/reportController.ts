import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";
import { logAction } from "../services/auditService.js";

export async function getFilteredResidents(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    const sex = req.query.sex as string;
    const isVoter = req.query.isVoter as string;
    const isPwd = req.query.isPwd as string;
    const isSoloParent = req.query.isSoloParent as string;
    const isFamilyHead = req.query.isFamilyHead as string;
    const studentType = req.query.studentType as string;
    const status = req.query.status as string;
    const ageFrom = parseInt(req.query.ageFrom as string) || 0;
    const ageTo = parseInt(req.query.ageTo as string) || 150;

    const where: Prisma.ResidentWhereInput = {
      statusType: "Alive",
    };

    if (sex) where.sex = sex as any;
    if (isVoter === "true") where.isVoter = true;
    if (isVoter === "false") where.isVoter = false;
    if (isPwd === "true") where.isPwd = true;
    if (isSoloParent === "true") where.isSoloParent = true;
    if (studentType) where.studentType = studentType;
    if (status) where.statusType = status as any;

    if (isFamilyHead === "true") {
      where.familyHead = { isNot: null };
    }

    if (ageFrom > 0 || ageTo < 150) {
      const today = new Date();
      const maxDob = new Date(today.getFullYear() - ageFrom, today.getMonth(), today.getDate());
      const minDob = new Date(today.getFullYear() - ageTo, today.getMonth(), today.getDate());
      
      where.dateOfBirth = {
        gte: minDob,
        lte: maxDob,
      };
    }

    const residents = await prisma.resident.findMany({
      where,
      include: {
        familyHead: {
          include: {
            household: true,
            address: true,
          },
        },
        familyMember: {
          include: {
            family: {
              include: {
                household: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    const data = residents.map((r, index) => {
      const family = r.familyHead ?? r.familyMember?.family;
      const address = family?.address;
      
      return {
        no: index + 1,
        lastName: r.lastName,
        firstName: r.firstName,
        middleName: r.middleName || "",
        age: computeAge(r.dateOfBirth),
        sex: r.sex,
        address: address
          ? `${address.houseNo} ${address.streetName}, ${address.alleyName}`
          : "",
        contact: r.contactNumber || "",
        status: r.statusType,
      };
    });

    // Log the report generation
    if (userId) {
      const filters = Object.entries({ sex, isVoter, isPwd, isSoloParent, isFamilyHead, studentType, status })
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      
      await logAction(
        "reports",
        "resident-list",
        userId,
        "CREATE",
        null,
        `Generated resident report (${data.length} records)${filters ? ` with filters: ${filters}` : ""}`
      );
    }

    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
}

function computeAge(dateOfBirth: Date | null): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const m = today.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}
