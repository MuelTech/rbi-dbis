import { Router } from "express";
import {
  getDocumentTypes,
  getDocuments,
  getDocumentById,
  getLastDocument,
  getNextOrNumber,
  getFtjsStatus,
  createDocument,
} from "../controllers/documentController.js";

export const documentRouter = Router();

documentRouter.get("/types", getDocumentTypes);
documentRouter.get("/last", getLastDocument);
documentRouter.get("/next-or-number", getNextOrNumber);
documentRouter.get("/ftjs-status", getFtjsStatus);
documentRouter.get("/", getDocuments);
documentRouter.get("/:id", getDocumentById);
documentRouter.post("/", createDocument);
