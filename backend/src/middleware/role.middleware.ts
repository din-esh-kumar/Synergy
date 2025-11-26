import { Request, Response, NextFunction } from 'express';

// Interface matching your AuthRequest structure used in controllers
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  };
}

/**
 * @desc    Middleware to restrict access based on User Roles
 * @usage   router.get('/', protect, authorize('ADMIN', 'MANAGER'), controller)
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Safety Check: Ensure auth middleware ran first
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized, user context missing' });
    }

    // 2. Role Check
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        msg: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};