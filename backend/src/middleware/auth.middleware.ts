import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateJWT  = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    (req as any).user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default authenticateJWT ;
