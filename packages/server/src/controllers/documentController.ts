import type { Request, Response, NextFunction } from "express";
import { prisma } from "@rbi/db";

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
    const data = { ...req.body };
    delete data.displayId;
    delete data.display_id;
    const document = await prisma.document.create({ data });
    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
}
