import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";
import { logAction } from "../services/auditService.js";

export async function getArchivedFamilies(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(req.query.pageSize as string) || 20)
    );
    const search = (req.query.search as string) || "";

    const where: any = { isArchived: true };

    if (search) {
      where.OR = [
        { familyName: { contains: search } },
        { headPerson: { lastName: { contains: search } } },
        { headPerson: { firstName: { contains: search } } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [total, families] = await Promise.all([
      prisma.family.count({ where }),
      prisma.family.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          headPerson: true,
          members: {
            include: { resident: true },
          },
        },
      }),
    ]);

    const data = families.map((f) => {
      const allResidents = [
        { isVoter: f.headPerson.isVoter, statusType: f.headPerson.statusType },
        ...f.members.map((m) => ({
          isVoter: m.resident.isVoter,
          statusType: m.resident.statusType,
        })),
      ];

      const voterCount = allResidents.filter((r) => r.isVoter).length;
      const residentCount = allResidents.length;

      const hasDeceased = allResidents.some((r) => r.statusType === "Deceased");
      const status: string = hasDeceased ? "Deceased" : "Moveout";

      return {
        id: f.id,
        displayId: f.displayId,
        familyName: f.familyName,
        residentCount,
        voterCount,
        status,
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    res.json({ data, meta: { page, pageSize, total, totalPages } });
  } catch (err) {
    next(err);
  }
}

export async function restoreFamily(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const familyId = req.params.familyId as string;
    const userId = req.user?.id;

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { id: true, isArchived: true },
    });

    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

    if (!family.isArchived) {
      return res.status(400).json({ error: "Family is not archived" });
    }

    await prisma.family.update({
      where: { id: familyId },
      data: { isArchived: false },
    });

    if (userId) {
      await logAction("families", familyId, userId, "RESTORE", null, "Restored archived family");
    }

    res.json({ message: "Family restored successfully" });
  } catch (err) {
    next(err);
  }
}
