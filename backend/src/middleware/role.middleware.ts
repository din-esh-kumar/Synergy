import { Request, Response, NextFunction } from "express";

// For each logged in user, check if their role is allowed
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const userRole = user?.role ? String(user.role).toUpperCase() : undefined;

    const allowed = roles.map((r) => r.toUpperCase());

    if (!userRole || !allowed.includes(userRole)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient role." });
    }

    next();
  };
}
