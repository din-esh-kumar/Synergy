import { Request, Response, NextFunction } from "express";

// Role hierarchy levels
const ROLE_HIERARCHY = {
  INTERN: 1,
  EMPLOYEE: 2,
  MANAGER: 3,
  ADMIN: 4,
};

// Check if user has one of the required roles
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

// Check if user has minimum required role level
export function requireMinRole(minRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const userRole = user?.role ? String(user.role).toUpperCase() : undefined;
    
    if (!userRole) {
      return res.status(403).json({ message: "Access denied. Role not found." });
    }

    const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
    const minLevel = ROLE_HIERARCHY[minRole.toUpperCase() as keyof typeof ROLE_HIERARCHY] || 0;

    if (userLevel < minLevel) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient role level." });
    }

    next();
  };
}
