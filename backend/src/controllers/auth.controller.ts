import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../config/User.model";

// REGISTER (EMPLOYEE only)
export const register = async (req: Request, res: Response) => {
  try {
    let { name, email, password, managerId } = req.body;
    const role = 'EMPLOYEE'; // Always employee

    // Check if user exists
    const existingUser = await User.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      managerId: managerId || null,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        managerId: user.managerId,
      },
      isNew: true
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOGIN with welcome detection
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user: IUser | null = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // New user if created in last 5 minutes
    const now = new Date().getTime();
    const isNew = user.createdAt && (now - new Date(user.createdAt).getTime() < 5 * 60000);

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "changeme",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        managerId: user.managerId,
      },
      isNew
    });
  } catch (error: any) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
