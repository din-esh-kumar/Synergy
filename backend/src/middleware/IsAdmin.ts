import { Request, Response, NextFunction } from "express";

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const role = (req as any).user?.role;
  if (role === "ADMIN") return next();
  return res.status(403).json({ message: "Forbidden: Admins only" });
}
