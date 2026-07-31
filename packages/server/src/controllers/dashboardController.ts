import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";

export async function getPersonnel(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get all active users who can process documents
    const personnel = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        userInfo: true,
      },
    });

    const data = personnel.map((user) => ({
      id: user.id,
      name: user.userInfo
        ? `${user.userInfo.firstName} ${user.userInfo.lastName}`
        : user.username,
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
}

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

export async function getTransactions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const period = (req.query.period as string) || "month";
    const from = req.query.from as string;
    const to = req.query.to as string;
    const personnelId = req.query.personnelId as string;
    const search = (req.query.search as string)?.trim() || "";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 20));

    const now = new Date();
    let startDate: Date;

    if (period === "custom" && from && to) {
      startDate = new Date(from);
      now.setTime(new Date(to).getTime());
    } else if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const where: any = {};

    // Only apply period filter when NOT searching
    if (!search) {
      where.orderDate = {
        gte: startDate,
        lte: now,
      };
    }

    // Add search filter (searches across ALL transactions)
    if (search) {
      where.OR = [
        { orNumber: { contains: search } },
        { resident: { firstName: { contains: search } } },
        { resident: { lastName: { contains: search } } },
        { user: { userInfo: { firstName: { contains: search } } } },
        { user: { userInfo: { lastName: { contains: search } } } },
        { document: { documentType: { documentName: { contains: search } } } },
      ];
    }

    // Filter by personnel if specified
    if (personnelId && personnelId !== 'All') {
      where.userId = personnelId;
    }

    const skip = (page - 1) * pageSize;

    const [total, orders, summary] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { orderDate: "desc" },
        include: {
          user: {
            include: { userInfo: true },
          },
          resident: true,
          document: {
            include: { documentType: true },
          },
        },
      }),
      prisma.order.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const data = orders.map((order) => ({
      id: order.id,
      documentId: order.documentId,
      orNumber: order.orNumber,
      orderDate: order.orderDate,
      amount: Number(order.amount),
      personnel: order.user?.userInfo
        ? `${order.user.userInfo.firstName} ${order.user.userInfo.lastName}`
        : order.user?.username ?? "Unknown",
      resident: `${order.resident.firstName} ${order.resident.lastName}`,
      documentType: order.document?.documentType?.documentName ?? "Unknown",
    }));

    const totalPages = Math.ceil(total / pageSize);

    res.json({
      data,
      meta: { page, pageSize, total, totalPages },
      summary: {
        accumulatedFee: Number(summary._sum.amount) || 0,
        totalTransactions: summary._count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getTransactionsExport(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const period = (req.query.period as string) || "month";
    const from = req.query.from as string;
    const to = req.query.to as string;
    const personnelId = req.query.personnelId as string;

    const now = new Date();
    let startDate: Date;

    if (period === "custom" && from && to) {
      startDate = new Date(from);
      now.setTime(new Date(to).getTime());
    } else if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const where: any = {
      orderDate: {
        gte: startDate,
        lte: now,
      },
    };

    if (personnelId && personnelId !== 'All') {
      where.userId = personnelId;
    }

    const [orders, summary] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { orderDate: "desc" },
        include: {
          user: {
            include: { userInfo: true },
          },
          resident: true,
          document: {
            include: { documentType: true },
          },
        },
      }),
      prisma.order.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const data = orders.map((order) => ({
      id: order.id,
      documentId: order.documentId,
      orNumber: order.orNumber,
      orderDate: order.orderDate,
      amount: Number(order.amount),
      personnel: order.user?.userInfo
        ? `${order.user.userInfo.firstName} ${order.user.userInfo.lastName}`
        : order.user?.username ?? "Unknown",
      resident: `${order.resident.firstName} ${order.resident.lastName}`,
      documentType: order.document?.documentType?.documentName ?? "Unknown",
    }));

    res.json({
      data,
      summary: {
        accumulatedFee: Number(summary._sum.amount) || 0,
        totalTransactions: summary._count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
}
