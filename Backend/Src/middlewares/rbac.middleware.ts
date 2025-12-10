// backend/src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';

// ==================== UNIFIED INTERFACES ====================
interface UserRequest extends Request {
  user?: { 
    id: string; 
    _id?: string;
    role: string; 
    name?: string;
    email?: string;
  };
}

// ==================== MERGED RBAC MIDDLEWARE ====================
export function requireRole(allowedRoles: string[]) {
  return (req: UserRequest, res: Response, next: NextFunction) => {
    const user = req.user || (req as any).user;
    
    // ✅ FLEXIBLE ROLE NORMALIZATION (Both versions)
    const userRole = user?.role 
      ? String(user.role).toUpperCase() 
      : undefined;
    
    const normalizedAllowedRoles = allowedRoles.map(role => 
      String(role).toUpperCase()
    );

    // ✅ ENHANCED ERROR MESSAGES
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    if (!userRole) {
      return res.status(403).json({ 
        success: false,
        message: 'User role not found' 
      });
    }

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required one of: ${normalizedAllowedRoles.join(', ')}. Got: ${userRole}` 
      });
    }

    // ✅ ATTACH USER TO REQUEST (for controllers)
    (req as any).userRole = userRole;
    next();
  };
}

// ==================== ALTERNATIVE NAME (Leave compatibility) ====================
export const rbac = requireRole;

// ==================== COMMON PRESETS ====================
export const isAdmin = requireRole(['admin', 'ADMIN']);
export const isAdminOrManager = requireRole(['admin', 'ADMIN', 'manager', 'MANAGER']);
export const isManagerOrHigher = requireRole(['admin', 'ADMIN', 'manager', 'MANAGER']);
export const isEmployeeOrHigher = requireRole(['admin', 'ADMIN', 'manager', 'MANAGER', 'employee', 'EMPLOYEE']);

// ==================== ROLE HIERARCHY CHECK ====================
export function requireRoleOrHigher(requiredRole: string) {
  const roleHierarchy = ['EMPLOYEE', 'MANAGER', 'ADMIN'];
  const requiredLevel = roleHierarchy.indexOf(requiredRole.toUpperCase());
  
  return requireRole(roleHierarchy.slice(requiredLevel));
}

// ==================== DEBUG MODE (Development) ====================
export function logRoleCheck(roles: string[]) {
  return (req: UserRequest, res: Response, next: NextFunction) => {
    const user = req.user || (req as any).user;
    console.log(`🔐 RBAC: ${user?.email || 'anonymous'} (${user?.role}) → ${roles.join(',')}`);
    requireRole(roles)(req, res, next);
  };
}

// ==================== EXPORTS (Both styles) ====================
export default {
  requireRole,
  rbac,
  isAdmin,
  isAdminOrManager,
  isManagerOrHigher,
  isEmployeeOrHigher,
  requireRoleOrHigher,
  logRoleCheck,
};

// ==================== CLASS EXPORT (Optional) ====================
export class RBAC {
  static requireRole(roles: string[]) {
    return requireRole(roles);
  }
  
  static rbac(roles: string[]) {
    return rbac(roles);
  }
  
  static isAdmin() {
    return isAdmin;
  }
  
  static isAdminOrManager() {
    return isAdminOrManager;
  }
}
