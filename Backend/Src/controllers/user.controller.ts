// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User.model';
import mongoose from 'mongoose';

interface UserRequest extends Request {
  user?: { 
    id: string; 
    role: string;
    name?: string;    // ✅ FIXED
    email?: string;   // ✅ FIXED
  };
}

// ==================== SYNERGY FUNCTIONS (Enhanced MongoDB) ====================

export const createUser = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role, phone, designation } = req.body;
    const creatorId = req.user!.id;
    const creatorName = req.user?.name || req.user?.email || 'Admin'; // ✅ FIXED

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ email });
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
      email,
      password: hashedPassword,
      role: role || 'EMPLOYEE',
      phone,
      designation,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        designation: newUser.designation,
      },
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    next(error);
  }
};

export const getAllUsers = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { role, search } = req.query;
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    let filter: any = {};

    if (currentUserRole === 'ADMIN') {
      filter._id = { $ne: currentUserId };
    } else if (currentUserRole === 'MANAGER') {
      filter.$or = [
        { _id: currentUserId },
        { managerId: currentUserId } // ✅ FIXED - managerId exists now
      ];
    } else {
      filter._id = currentUserId;
    }

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        ...(filter.$or || []),
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

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
    console.error('Get user error:', error);
    next(error);
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
    next(error);
  }
};

export const updateProfile = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const authUserId = req.user!.id;
    const { name, phone, designation, email } = req.body;

    const user = await User.findById(authUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updateData: any = {};

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists. Please use a different email address.',
        });
      }
      updateData.email = email;
    }

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (designation !== undefined) updateData.designation = designation;

    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No changes made',
        data: user,
      });
    }

    Object.assign(user, updateData);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        designation: user.designation,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    next(error);
  }
};

export const updateUser = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updaterId = req.user!.id;
    const updaterName = req.user?.name || req.user?.email || 'Admin'; // ✅ FIXED
    const { name, role, phone, designation, status, managerId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let wasUpdated = false;

    if (name !== undefined) { user.name = name; wasUpdated = true; }
    if (role !== undefined) { user.role = role; wasUpdated = true; }
    if (phone !== undefined) { user.phone = phone; wasUpdated = true; }
    if (designation !== undefined) { user.designation = designation; wasUpdated = true; }
    if (status !== undefined) { user.status = status; wasUpdated = true; }
    if (managerId !== undefined) { 
      user.managerId = new mongoose.Types.ObjectId(managerId); // ✅ FIXED
      wasUpdated = true; 
    }

    if (!wasUpdated) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        designation: user.designation,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    next(error);
  }
};

export const updateUserStatus = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updaterId = req.user!.id;
    const updaterName = req.user?.name || req.user?.email || 'Admin'; // ✅ FIXED
    const { status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Status must be a boolean',
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Update user status error:', error);
    next(error);
  }
};

export const deleteUser = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const authUserId = req.user!.id;

    if (id === authUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    next(error);
  }
};

export const assignRole = async (req: UserRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updaterId = req.user!.id;
    const updaterName = req.user?.name || req.user?.email || 'Admin'; // ✅ FIXED
    const { role } = req.body;

    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role!)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role assigned successfully',
      data: user,
    });
  } catch (error: any) {
    console.error('Assign role error:', error);
    next(error);
  }
};

// ==================== CLASS EXPORT ====================
export class UserController {
  static async getProfiles(req: UserRequest, res: Response, next: NextFunction) {
    return getAllUsers(req, res, next);
  }
  static async getProfile(req: UserRequest, res: Response, next: NextFunction) {
    return getUser(req, res, next);
  }
  static async updateProfile(req: UserRequest, res: Response, next: NextFunction) {
    return updateProfile(req, res, next);
  }
  static async updateUserAdmin(req: UserRequest, res: Response, next: NextFunction) {
    return updateUser(req, res, next);
  }
}

// ==================== DEFAULT EXPORT ====================
export default {
  createUser,
  getAllUsers,
  getUserById,
  getUser,
  updateProfile,
  updateUser,
  updateUserStatus,
  deleteUser,
  assignRole,
};
