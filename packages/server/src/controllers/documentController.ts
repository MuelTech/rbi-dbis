import type { Request, Response, NextFunction } from "express";
import { prisma, Prisma } from "@rbi/db";
import { logCreate } from "../services/auditService.js";
import {
  FTJS_DOCUMENT_NAME,
  computeFtjsValidUntil,
  isFtjsStillValid,
  type FtjsStatus,
} from "../services/ftjsPolicy.js";

export async function getNextOrNumber(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const currentYear = new Date().getFullYear();
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { orNumber: true },
    });

    let orSequence = 1;
    if (lastOrder) {
      const parts = lastOrder.orNumber.split("-");
      if (parts.length === 3 && parts[0] === String(currentYear)) {
        orSequence = parseInt(parts[2], 10) + 1;
      }
    }
    const orNumber = `${currentYear}-418-${String(orSequence).padStart(5, "0")}`;

    res.json({ orNumber });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentTypes(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const types = await prisma.documentType.findMany({
      orderBy: { documentName: "asc" },
    });
    res.json(types);
  } catch (err) {
    next(err);
  }
}

export async function getDocuments(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const documents = await prisma.document.findMany({
      include: {
        documentType: true,
        order: {
          include: {
            resident: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(documents);
  } catch (err) {
    next(err);
  }
}

export async function getDocumentById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id as string;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        documentType: true,
        order: {
          include: {
            resident: true,
          },
        },
        signers: true,
      },
    });
    if (!document)
      return res.status(404).json({ error: "Document not found" });
    res.json(document);
  } catch (err) {
    next(err);
  }
}

export async function getLastDocument(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { residentId, documentTypeId } = req.query;

    if (!residentId || !documentTypeId) {
      res.json(null);
      return;
    }

    const document = await prisma.document.findFirst({
      where: {
        order: {
          residentId: residentId as string,
        },
        documentTypeId: documentTypeId as string,
      },
      include: {
        order: true,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    if (!document) {
      res.json(null);
      return;
    }

    res.json({
      id: document.id,
      formData: document.formData,
      purpose: document.purpose,
      issueDate: document.issueDate,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFtjsStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const residentId = req.query.residentId as string | undefined;
    if (!residentId) {
      res.json({ hasFtjs: false } satisfies FtjsStatus);
      return;
    }

    const type = await prisma.documentType.findFirst({
      where: { documentName: FTJS_DOCUMENT_NAME },
    });
    if (!type) {
      res.json({ hasFtjs: false } satisfies FtjsStatus);
      return;
    }

    const doc = await prisma.document.findFirst({
      where: {
        documentTypeId: type.id,
        order: { residentId },
      },
      include: { order: true },
      orderBy: { issueDate: "desc" },
    });

    if (!doc) {
      res.json({ hasFtjs: false } satisfies FtjsStatus);
      return;
    }

    const formData = (doc.formData ?? {}) as Record<string, unknown>;
    const rawValid =
      (typeof formData.validUntil === "string" && formData.validUntil) ||
      doc.validityPeriod ||
      null;

    let validUntilDate: Date | null = null;
    if (rawValid) {
      const parsed = new Date(rawValid);
      if (!Number.isNaN(parsed.getTime())) validUntilDate = parsed;
    }
    if (!validUntilDate) {
      validUntilDate = computeFtjsValidUntil(doc.issueDate);
    }

    res.json({
      hasFtjs: true,
      documentId: doc.id,
      issueDate: doc.issueDate.toISOString(),
      validUntil: validUntilDate.toISOString(),
      isValid: isFtjsStillValid(validUntilDate),
      orNumber: doc.order?.orNumber ?? null,
      formData,
      purpose: doc.purpose,
    } satisfies FtjsStatus);
  } catch (err) {
    next(err);
  }
}

export async function createDocument(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    const { residentId, documentTypeId, purpose, validityPeriod, formData } = req.body;

    // Validate required fields
    if (!residentId || !documentTypeId) {
      return res
        .status(400)
        .json({ error: "residentId and documentTypeId are required" });
    }

    // Verify document type exists
    const documentType = await prisma.documentType.findUnique({
      where: { id: documentTypeId },
    });
    if (!documentType) {
      return res.status(404).json({ error: "Document type not found" });
    }

    const isFtjs = documentType.documentName === FTJS_DOCUMENT_NAME;
    if (isFtjs) {
      const existing = await prisma.document.findFirst({
        where: {
          documentTypeId: documentType.id,
          order: { residentId },
        },
        select: { id: true },
      });
      if (existing) {
        return res.status(409).json({
          error:
            "FTJS certificate already issued for this resident. Reprint is allowed only while still valid; a new availment is not allowed.",
        });
      }
    }

    // Generate unique OR number: YYYY-418-XXXXX
    const currentYear = new Date().getFullYear();
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: "desc" },
      select: { orNumber: true },
    });

    let orSequence = 1;
    if (lastOrder) {
      const parts = lastOrder.orNumber.split("-");
      if (parts.length === 3 && parts[0] === String(currentYear)) {
        orSequence = parseInt(parts[2], 10) + 1;
      }
    }
    const orNumber = `${currentYear}-418-${String(orSequence).padStart(5, "0")}`;

    const issueDate = new Date();
    let formPayload: Record<string, unknown> | null =
      formData && typeof formData === "object" && formData !== null
        ? { ...(formData as Record<string, unknown>) }
        : null;
    let storedValidity: string | null = validityPeriod || null;

    if (isFtjs) {
      const until = computeFtjsValidUntil(issueDate);
      storedValidity = until.toISOString().slice(0, 10);
      if (!formPayload) formPayload = {};
      if (formPayload.validUntil == null) {
        formPayload.validUntil = storedValidity;
      }
    }

    // Create Document and Order in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          issueDate,
          purpose: purpose || null,
          validityPeriod: storedValidity,
          formData: (formPayload as Prisma.InputJsonObject | null) ?? Prisma.DbNull,
          documentTypeId,
        },
      });

      const order = await tx.order.create({
        data: {
          orNumber,
          orderDate: new Date(),
          amount: documentType.amount,
          userId: userId!,
          residentId,
          documentId: document.id,
        },
      });

      return { document, order };
    });

    // Log the creation
    if (userId) {
      await logCreate("documents", result.document.id, userId, {
        purpose: result.document.purpose,
        orNumber: result.order.orNumber,
      });
    }

    // Return full document with relations
    const fullDocument = await prisma.document.findUnique({
      where: { id: result.document.id },
      include: {
        documentType: true,
        order: true,
        signers: true,
      },
    });

    res.status(201).json(fullDocument);
  } catch (err) {
    next(err);
  }
}
