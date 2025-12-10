// src/controllers/auth.controller.ts - FINAL 100% CLEAN VERSION
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';

interface UserRequest extends Request {
  user?: { id: string; role: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, phone, designation } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'EMPLOYEE',
      phone,
      designation,
      status: true,
    });

    await newUser.save();

    // ✅ SIMPLIFIED JWT - NO TYPE ERRORS
    const token = jwt.sign(
      { id: newUser._id.toString(), role: newUser.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: newUser._id.toString() },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        refreshToken,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          designation: newUser.designation,
        }
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.status) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ✅ SIMPLIFIED JWT - NO TYPE ERRORS
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user._id.toString() },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          designation: user.designation,
        }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

export const getUser = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const authUserId = req.user!.id;
    const user = await User.findById(authUserId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile',
    });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  res.status(501).json({ 
    success: false, 
    message: 'Google login coming soon' 
  });
};

export const refresh = async (req: Request, res: Response) => {
  res.status(501).json({ 
    success: false, 
    message: 'Refresh token coming soon' 
  });
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    return register(req, res, next);
  }
  static async login(req: Request, res: Response, next: NextFunction) {
    return login(req, res, next);
  }
  static async profile(req: UserRequest, res: Response, next: NextFunction) {
    return getUser(req, res, next);
  }
}

export default {
  register,
  login,
  getUser,
  googleLogin,
  refresh,
};
