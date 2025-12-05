// auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    const userId = decoded._id || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Attach user info to request
    (req as any).user = {
      _id: userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role ? String(decoded.role).toUpperCase() : undefined,
    };

    // This is what your notifications.controller.ts expects
    (req as any).userId = userId;

    next();
  } catch (error) {
    console.error("JWT auth error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authenticateJWT;
