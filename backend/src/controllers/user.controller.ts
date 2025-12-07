// user.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import { createNotification } from '../utils/notificationEngine';

// Create User (Admin/Manager Only - route middleware handles this)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, designation } = req.body;
    const creatorId = (req as any).user.id;
    const creatorName = (req as any).user.name || (req as any).user.email;

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

    // ✅ NOTIFY NEWLY CREATED USER
    await createNotification({
      userId: newUser._id.toString(),
      type: 'system',
      action: 'created',
      title: 'Account created',
      message: `Your account was created by ${creatorName}`,
      entityType: 'user',
      entityId: newUser._id.toString(),
      icon: 'user-plus',
      color: '#10b981',
      actionUrl: '/login',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        designation: newUser.designation,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating user',
    });
  }
};

// Get All Users (Admin/Manager Only - route middleware handles this)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role, search } = req.query;
    const filter: any = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
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
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching users',
    });
  }
};

// Get Single User by ID (Admin/Manager Only - route middleware handles this)
export const getUserById = async (req: Request, res: Response) => {
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
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user',
    });
  }
};

// Get Current User Profile (Any authenticated user)
export const getUser = async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user.id;

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
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching profile',
    });
  }
};

// Update Current User Profile (Any authenticated user)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authUserId = (req as any).user.id;
    const { name, phone, designation } = req.body;

    const user = await User.findById(authUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (designation !== undefined) user.designation = designation;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        designation: user.designation,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

// Update User (Admin Only - route middleware handles this)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updaterId = (req as any).user.id;
    const updaterName = (req as any).user.name || (req as any).user.email;
    const { name, role, phone, designation, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let wasUpdated = false;
    if (name !== undefined) {
      user.name = name;
      wasUpdated = true;
    }
    if (role !== undefined) {
      user.role = role;
      wasUpdated = true;
    }
    if (phone !== undefined) {
      user.phone = phone;
      wasUpdated = true;
    }
    if (designation !== undefined) {
      user.designation = designation;
      wasUpdated = true;
    }
    if (status !== undefined) {
      user.status = status;
      wasUpdated = true;
    }

    if (!wasUpdated) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    await user.save();

    // ✅ NOTIFY USER IF UPDATED BY ANOTHER USER (not self-update)
    if (updaterId !== id) {
      await createNotification({
        userId: id,
        type: 'system',
        action: 'updated',
        title: 'Account updated',
        message: `Your account was updated by ${updaterName}`,
        entityType: 'user',
        entityId: id,
        icon: 'user',
        color: '#6366f1',
        actionUrl: '/profile',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        designation: user.designation,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user',
    });
  }
};

// Update User Status (Admin Only - route middleware handles this)
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updaterId = (req as any).user.id;
    const updaterName = (req as any).user.name || (req as any).user.email;
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

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // ✅ NOTIFY USER ABOUT STATUS CHANGE (if not self-updating)
    if (updaterId !== id) {
      await createNotification({
        userId: id,
        type: 'system',
        action: 'updated',
        title: 'Account status updated',
        message: `Your account status was changed to ${status ? 'active' : 'inactive'} by ${updaterName}`,
        entityType: 'user',
        entityId: id,
        icon: status ? 'check-circle' : 'x-circle',
        color: status ? '#10b981' : '#ef4444',
        actionUrl: '/profile',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        designation: user.designation,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user status',
    });
  }
};

// Delete User (Admin Only - route middleware handles this)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authUserId = (req as any).user.id;
    const deleterName = (req as any).user.name || (req as any).user.email;

    if (id === authUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await User.findByIdAndDelete(id);

    // ✅ NOTIFY TEAM/PROJECT MEMBERS ABOUT USER DELETION (optional - if needed)
    // This would require additional logic to find affected teams/projects

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user',
    });
  }
};

// Assign Role to User (Admin Only - route middleware handles this)
export const assignRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updaterId = (req as any).user.id;
    const updaterName = (req as any).user.name || (req as any).user.email;
    const { role } = req.body;

    if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
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

    // ✅ NOTIFY USER ABOUT ROLE CHANGE (if not self-assigning)
    if (updaterId !== id) {
      await createNotification({
        userId: id,
        type: 'system',
        action: 'updated',
        title: 'Role updated',
        message: `Your role was changed to "${role}" by ${updaterName}`,
        entityType: 'user',
        entityId: id,
        icon: 'user-check',
        color: '#6366f1',
        actionUrl: '/profile',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role assigned successfully',
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error assigning role',
    });
  }
};
