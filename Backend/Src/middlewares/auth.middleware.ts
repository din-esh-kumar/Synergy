// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ==================== UNIFIED INTERFACES ====================
export interface IUserPayload {
  id: string;
  _id?: string;
  email: string;
  name?: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: IUserPayload;
  userId?: string;
}

// ==================== JWT CONFIG (Environment-based) ====================
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const jwtConfig = {
  secret: JWT_SECRET,
};

// ==================== MERGED AUTHENTICATION MIDDLEWARE ====================
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization || req.headers['authorization'];

    // Synergy: Check Bearer prefix + API route detection
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const isApiRoute = req.path.startsWith('/api/');
      if (isApiRoute) {
        return res.status(401).json({ 
          success: false,
          message: 'Authorization header missing or invalid Bearer token' 
        });
      }
      return res.redirect('/login');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      const isApiRoute = req.path.startsWith('/api/');
      if (isApiRoute) {
        return res.status(401).json({ 
          success: false,
          message: 'Token missing' 
        });
      }
      return res.redirect('/login');
    }

    // Leave: Synchronous JWT verification + full payload
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Synergy: Flexible ID handling (id or _id)
    const userId = decoded._id || decoded.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload - missing user ID' 
      });
    }

    // ✅ MERGED USER OBJECT (Both frontends compatible)
    const userPayload: IUserPayload = {
      id: userId,
      _id: decoded._id || userId,
      email: decoded.email,
      name: decoded.name,
      role: String(decoded.role).toUpperCase(),
    };

    // Attach to request (Synergy + Leave compatible)
    req.user = userPayload;
    (req as any).user = userPayload;  // Legacy support
    (req as any).userId = userId;     // notifications.controller.ts

    next();
  } catch (error: any) {
    console.error('JWT auth error:', error);
    
    const isApiRoute = req.path.startsWith('/api/');
    if (isApiRoute) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    return res.redirect('/login');
  }
};

// ==================== ROLE-BASED AUTHORIZATION ====================
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Role ${req.user.role} not authorized for this action` 
      });
    }

    next();
  };
};

// ==================== ADMIN ONLY ====================
export const isAdmin = authorizeRoles('ADMIN');

// ==================== ADMIN OR MANAGER ====================
export const isAdminOrManager = authorizeRoles('ADMIN', 'MANAGER');

// ==================== EXPORTS (Both styles) ====================
export default {
  authenticateToken,
  authorizeRoles,
  isAdmin,
  isAdminOrManager,
};

// Class-style export (Leave compatibility)
export class AuthMiddleware {
  static authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    return authenticateToken(req, res, next);
  }

  static authorizeRoles(...allowedRoles: string[]) {
    return authorizeRoles(...allowedRoles);
  }

  static isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    return isAdmin(req, res, next);
  }

  static isAdminOrManager(req: AuthRequest, res: Response, next: NextFunction) {
    return isAdminOrManager(req, res, next);
  }
}
