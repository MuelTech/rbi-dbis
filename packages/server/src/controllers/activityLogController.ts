import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";

export async function getActivityLogs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 20));
    const search = (req.query.search as string) || "";
    const actionType = (req.query.actionType as string) || "";
    const tableName = (req.query.tableName as string) || "";
    const dateFrom = (req.query.dateFrom as string) || "";
    const dateTo = (req.query.dateTo as string) || "";

    const where: Prisma.AuditTrailWhereInput = {};

    const andClauses: Prisma.AuditTrailWhereInput[] = [];

    if (search) {
      andClauses.push({
        OR: [
          { summary: { contains: search } },
          { user: { userInfo: { firstName: { contains: search } } } },
          { user: { userInfo: { lastName: { contains: search } } } },
        ],
      });
    }

    if (actionType) {
      const actionTypes = actionType.split(",").map((a) => a.trim()).filter(Boolean);
      if (actionTypes.length > 0) {
        andClauses.push({ actionType: { in: actionTypes } });
      }
    }

    if (tableName) {
      const tableNames = tableName.split(",").map((t) => t.trim()).filter(Boolean);
      if (tableNames.length > 0) {
        andClauses.push({ tableName: { in: tableNames } });
      }
    }

    if (dateFrom) {
      andClauses.push({ timestamp: { gte: new Date(dateFrom) } });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      andClauses.push({ timestamp: { lte: toDate } });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const skip = (page - 1) * pageSize;

    const [total, logs] = await Promise.all([
      prisma.auditTrail.count({ where }),
      prisma.auditTrail.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          timestamp: true,
          tableName: true,
          recordId: true,
          actionType: true,
          changes: true,
          summary: true,
          userId: true,
          user: {
            select: {
              username: true,
              userInfo: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: "desc" },
      }),
    ]);

    const data = logs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      tableName: log.tableName,
      recordId: log.recordId,
      actionType: log.actionType,
      changes: log.changes,
      summary: log.summary,
      personnel: log.user?.userInfo
        ? `${log.user.userInfo.firstName} ${log.user.userInfo.lastName}`
        : log.user?.username ?? "Unknown",
      userId: log.userId,
    }));

    const totalPages = Math.ceil(total / pageSize);

    res.json({ data, meta: { page, pageSize, total, totalPages } });
  } catch (err) {
    next(err);
  }
}

export async function deleteActivityLog(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    await prisma.auditTrail.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function bulkDeleteActivityLogs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { ids, olderThan } = req.body;

    if (ids && Array.isArray(ids)) {
      await prisma.auditTrail.deleteMany({ where: { id: { in: ids } } });
      res.json({ deleted: ids.length });
    } else if (olderThan) {
      const cutoffDate = new Date(olderThan);
      const result = await prisma.auditTrail.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      });
      res.json({ deleted: result.count });
    } else {
      res.status(400).json({ error: "Provide ids array or olderThan date" });
    }
  } catch (err) {
    next(err);
  }
}
