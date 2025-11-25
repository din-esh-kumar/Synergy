import { Request, Response } from 'express';
import User from '../models/User.model';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface JwtUser {
  id: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, managerId } = req.body;
    // Do not allow 'role' input except for initial bootstrapping
    const userCount = await User.countDocuments();

    let newRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE';

    if (userCount === 0) {
      // First user can be ADMIN (or passed role if needed)
      newRole = (req.body.role === 'ADMIN' || req.body.role === 'MANAGER')
        ? req.body.role
        : 'ADMIN';
    }
    // All other users default to EMPLOYEE; no role provided by caller!

    const existUser = await User.findOne({ email });
    if (existUser) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: newRole,
      managerId: newRole === 'EMPLOYEE' ? managerId || null : null,
    });

    await user.save();

    res.status(201).json({
      msg: 'Registered',
      user: { name, email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({
      msg: 'Register failed',
      error: (err as Error).message
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload: JwtUser = { 
      id: user._id.toString(), 
      role: user.role 
    };
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
    const jwtOptions: jwt.SignOptions = {
  expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
};

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      jwtOptions
    ) as string;

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ 
      msg: 'Login failed', 
      error: (err as Error).message 
    });
  }
};

