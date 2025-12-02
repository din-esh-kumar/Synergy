// src/controllers/team.controller.ts
import { Request, Response } from 'express';
import Team  from '../config/Team.model';
import User from '../config/User.model';

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description, lead, members } = req.body;

    if (!name || !lead) {
      return res.status(400).json({
        success: false,
        message: 'Name and lead are required',
      });
    }

    const leadUser = await User.findById(lead);
    if (!leadUser) {
      return res.status(400).json({
        success: false,
        message: 'Lead user not found',
      });
    }

    if (members && members.length > 0) {
      const existing = await User.find({ _id: { $in: members } });
      if (existing.length !== members.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more team members not found',
        });
      }
    }

    const team = await Team.create({
      name,
      description,
      lead,
      members: members || [],
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating team',
    });
  }
};

export const getTeams = async (req: Request, res: Response) => {
  try {
    const teams = await Team.find()
      .populate('lead', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching teams',
    });
  }
};

export const getTeamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id)
      .populate('lead', 'name email')
      .populate('members', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching team',
    });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const team = await Team.findByIdAndUpdate(id, updates, {
      new: true,
    })
      .populate('lead', 'name email')
      .populate('members', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: team,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating team',
    });
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await Team.findByIdAndDelete(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting team',
    });
  }
};
