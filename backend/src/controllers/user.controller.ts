import { Request, Response } from "express";
import User from "../config/User.model";

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, "_id name email role");
    res.status(200).json({
      success: true,
      message: "List of users",
      users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, "_id name email role");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "User details",
      user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching user details",
      error: error.message
    });
  }
};

// Update user (role is NOT editable here)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let updates = { ...req.body };
    // Prevent role from being updated here
    if ('role' in updates) delete (updates as any).role;

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      select: "_id name email role"
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message
    });
  }
};

// Admin-only: Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const allowedRoles = ["ADMIN", "MANAGER", "EMPLOYEE"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }
  try {
    const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true, select: "_id name email role" });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.json({
      success: true,
      message: `Role updated to ${user.role}`,
      user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error updating user role",
      error: error.message
    });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message
    });
  }
};
