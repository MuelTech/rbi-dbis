import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";
import type { Prisma } from "@rbi/db";

export async function getHouseholds(
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
    const block = (req.query.block as string) || "";
    const search = (req.query.search as string) || "";

    const where: Prisma.HouseholdWhereInput = {};

    if (block) {
      where.block = { blockNumber: block };
    }

    if (search) {
      where.brgyHouseholdNo = { contains: search };
    }

    const skip = (page - 1) * pageSize;

    const [total, households] = await Promise.all([
      prisma.household.count({ where }),
      prisma.household.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          block: true,
          families: {
            where: { isArchived: false },
            include: {
              headPerson: { select: { isVoter: true } },
              members: {
                include: {
                  resident: { select: { isVoter: true } },
                },
              },
              pet: {
                select: { numberOfCats: true, numberOfDogs: true },
              },
            },
          },
        },
      }),
    ]);

    const data = households.map((h) => {
      let voterCount = 0;
      let catCount = 0;
      let dogCount = 0;

      for (const f of h.families) {
        if (f.headPerson.isVoter) voterCount++;
        for (const m of f.members) {
          if (m.resident.isVoter) voterCount++;
        }
        if (f.pet) {
          catCount += f.pet.numberOfCats;
          dogCount += f.pet.numberOfDogs;
        }
      }

      return {
        id: h.id,
        displayId: h.displayId,
        blockNumber: h.block.blockNumber,
        brgyHouseholdNo: h.brgyHouseholdNo,
        familyCount: h.families.length,
        voterCount,
        catCount,
        dogCount,
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    res.json({ data, meta: { page, pageSize, total, totalPages } });
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
    const data = { ...req.body };
    delete data.displayId;
    delete data.display_id;
    const household = await prisma.household.create({ data });
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
    const data = { ...req.body };
    delete data.displayId;
    delete data.display_id;
    const household = await prisma.household.update({
      where: { id: req.params.id },
      data,
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
