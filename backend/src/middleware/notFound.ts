import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  // Handle common browser requests silently
  if (req.originalUrl === "/favicon.ico") {
    return res.status(204).end();
  }

  // For other routes, return a proper JSON error
  return res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    message: "The requested endpoint does not exist",
  });
};
