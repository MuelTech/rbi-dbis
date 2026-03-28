import { Router } from "express";
import {
  getDocuments,
  getDocumentById,
  createDocument,
} from "../controllers/documentController.js";

export const documentRouter = Router();

documentRouter.get("/", getDocuments);
documentRouter.get("/:id", getDocumentById);
documentRouter.post("/", createDocument);
