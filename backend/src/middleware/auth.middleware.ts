// auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    (req as any).user = {
      _id: decoded._id || decoded.id,        // <<< ensure _id exists
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
        ? String(decoded.role).toUpperCase()
        : undefined,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authenticateJWT;
