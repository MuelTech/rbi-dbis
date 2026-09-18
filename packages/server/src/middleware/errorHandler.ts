import type { Request, Response, NextFunction } from "express";

type HttpError = Error & { status?: number; statusCode?: number };

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err.stack ?? err);
  let status = err.status ?? err.statusCode;
  let message = err.message ?? "Internal Server Error";

  if (!status && (err as any).code === "P2002") {
    status = 400;
    message = "A record with these details already exists.";
  }
  if (!status && (err as any).code === "P2003") {
    status = 400;
    message = "A related record was not found.";
  }

  res.status(status ?? 500).json({ error: message });
}
