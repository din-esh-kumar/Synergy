import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export const protect = (req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) => {
  let token = req.header('Authorization') ?? '';
  if (token.startsWith('Bearer ')) token = token.slice(7);

  if (!token) return res.status(401).json({ msg: 'No token, auth denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};

export const managerOnly = (req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) => {
  if (req.user?.role === 'MANAGER') return next();
  return res.status(403).json({ msg: 'Managers only' });
};

export const adminOnly = (req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) => {
  if (req.user?.role === 'ADMIN') return next();
  return res.status(403).json({ msg: 'Admins only' });
};
