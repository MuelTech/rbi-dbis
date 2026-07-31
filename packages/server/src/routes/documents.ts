import { Router } from "express";
import {
  getDocumentTypes,
  getDocuments,
  getDocumentById,
  getLastDocument,
  createDocument,
} from "../controllers/documentController.js";

export const documentRouter = Router();

documentRouter.get("/types", getDocumentTypes);
documentRouter.get("/last", getLastDocument);
documentRouter.get("/", getDocuments);
documentRouter.get("/:id", getDocumentById);
documentRouter.post("/", createDocument);
