import { Router } from "express";
import {
  getDocumentTypes,
  getDocuments,
  getDocumentById,
  getLastDocument,
  getNextOrNumber,
  createDocument,
} from "../controllers/documentController.js";

export const documentRouter = Router();

documentRouter.get("/types", getDocumentTypes);
documentRouter.get("/last", getLastDocument);
documentRouter.get("/next-or-number", getNextOrNumber);
documentRouter.get("/", getDocuments);
documentRouter.get("/:id", getDocumentById);
documentRouter.post("/", createDocument);
