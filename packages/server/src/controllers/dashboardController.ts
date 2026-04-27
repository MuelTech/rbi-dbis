import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";

export async function getResidentDemographics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const block = (req.query.block as string) ?? "All";

    const blockFilter: Prisma.ResidentWhereInput =
      block !== "All"
        ? {
            OR: [
              {
                familyHead: {
                  household: { block: { blockNumber: block } },
                },
              },
              {
                familyMember: {
                  family: {
                    household: { block: { blockNumber: block } },
                  },
                },
              },
            ],
          }
        : {};

    const baseWhere: Prisma.ResidentWhereInput = {
      statusType: "Alive",
      ...blockFilter,
    };

    const today = new Date();
    const seniorCutoff = new Date(
      today.getFullYear() - 60,
      today.getMonth(),
      today.getDate()
    );

    const [
      totalPopulation,
      male,
      female,
      seniorCitizen,
      pwd,
      voters,
      totalFamily,
      totalHousehold,
    ] = await Promise.all([
      prisma.resident.count({ where: baseWhere }),
      prisma.resident.count({ where: { ...baseWhere, sex: "Male" } }),
      prisma.resident.count({ where: { ...baseWhere, sex: "Female" } }),
      prisma.resident.count({
        where: {
          ...baseWhere,
          dateOfBirth: { not: null, lte: seniorCutoff },
        },
      }),
      prisma.resident.count({ where: { ...baseWhere, isPwd: true } }),
      prisma.resident.count({ where: { ...baseWhere, isVoter: true } }),
      prisma.family.count({
        where: {
          isArchived: false,
          ...(block !== "All"
            ? { household: { block: { blockNumber: block } } }
            : {}),
        },
      }),
      prisma.household.count({
        where:
          block !== "All" ? { block: { blockNumber: block } } : {},
      }),
    ]);

    res.json({
      totalPopulation,
      totalHousehold,
      totalFamily,
      seniorCitizen,
      pwd,
      voters,
      male,
      female,
    });
  } catch (err) {
    next(err);
  }
}
