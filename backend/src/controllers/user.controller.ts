import { Request, Response } from 'express';
import User from '../models/User.model';
import mongoose from 'mongoose';

export const promoteToManager = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already a manager or admin
    if (user.role === 'MANAGER') {
      return res.status(400).json({ msg: 'User is already a manager' });
    }
    if (user.role === 'ADMIN') {
      return res.status(400).json({ msg: 'Cannot change admin role' });
    }

    // Update to manager
    user.role = 'MANAGER';
    user.managerId = null; // Managers don't have managers
    await user.save();

    res.json({ 
      msg: 'User promoted to manager successfully', 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ 
      msg: 'Promotion failed', 
      error: (err as Error).message 
    });
  }
};


export const assignManager = async (req: Request, res: Response) => {
  try {
    const employeeId = req.params.id;
    const { managerId } = req.body;

    // This throws if managerId is invalid length!
    const managerObjectId = new mongoose.Types.ObjectId(managerId);

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    // Check if manager is valid and has MANAGER role
    const manager = await User.findById(managerObjectId);
    if (!manager || manager.role !== 'MANAGER') {
      return res.status(400).json({ msg: 'Invalid manager ID' });
    }

    employee.managerId = managerObjectId;
    await employee.save();

    res.json({ msg: 'Manager assigned successfully', employee });
  } catch (err) {
    res.status(500).json({ msg: 'Assignment failed', error: (err as Error).message });
  }
};