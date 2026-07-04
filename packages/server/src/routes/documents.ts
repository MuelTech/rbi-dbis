import { Router } from "express";
import {
  getDocumentTypes,
  getDocuments,
  getDocumentById,
  createDocument,
} from "../controllers/documentController.js";

export const documentRouter = Router();

documentRouter.get("/types", getDocumentTypes);
documentRouter.get("/", getDocuments);
documentRouter.get("/:id", getDocumentById);
documentRouter.post("/", createDocument);
