import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";
import { logCreate } from "../services/auditService.js";

export async function getDocuments(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const documents = await prisma.document.findMany({
      include: { resident: true },
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
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { resident: true },
    });
    if (!document)
      return res.status(404).json({ error: "Document not found" });
    res.json(document);
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
    const { residentId, documentTypeId, purpose, validityPeriod } = req.body;

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

    // Generate unique document number: DOC-XXXXX
    const lastDocument = await prisma.document.findFirst({
      orderBy: { createdAt: "desc" },
      select: { documentNumber: true },
    });

    let docSequence = 1;
    if (lastDocument) {
      const match = lastDocument.documentNumber.match(/DOC-(\d+)/);
      if (match) {
        docSequence = parseInt(match[1], 10) + 1;
      }
    }
    const documentNumber = `DOC-${String(docSequence).padStart(5, "0")}`;

    // Create Document and Order in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data: {
          documentNumber,
          issueDate: new Date(),
          purpose: purpose || null,
          validityPeriod: validityPeriod || null,
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
        documentNumber: result.document.documentNumber,
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
