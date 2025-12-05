// src/controllers/team.controller.ts
import { Request, Response } from "express";
import { Types } from "mongoose";
import { Team } from "../models/Team.model";
import Project from "../models/Project.model";
import Task from "../models/Task.model";

// Create team
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description, leadId, memberIds } = req.body;
    const user = (req as any).user;

    if (!user?._id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not found" });
    }

    const team = await Team.create({
      name,
      description,
      lead: leadId ? new Types.ObjectId(leadId) : null,
      members: (memberIds || []).map(
        (id: string) => new Types.ObjectId(id)
      ),
      createdBy: user._id,
    });

    const populated = await Team.findById(team._id)
      .populate("lead", "name email role")
      .populate("members", "name email role")
      .populate("projects", "title status")
      .populate("tasks", "title status");

    return res.status(201).json(populated);
  } catch (error: any) {
    console.error("createTeam error:", error);
    return res
      .status(500)
      .json({ message: "Failed to create team", error: error.message });
  }
};

// Get all teams (admin/manager)
export const getTeams = async (req: Request, res: Response) => {
  try {
    const teams = await Team.find()
      .populate("lead", "name email role")
      .populate("members", "name email role")
      .populate("projects", "title status")
      .populate("tasks", "title status");

    res.json(teams);
  } catch (error: any) {
    console.error("getTeams error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch teams", error: error.message });
  }
};

// NEW: teams for logged‑in user (employee/manager/admin)
export const getMyTeams = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const teams = await Team.find({
      members: new Types.ObjectId(userId),
    })
      .populate("lead", "name email role")
      .populate("members", "name email role")
      .populate("projects", "title status")
      .populate("tasks", "title status");

    return res.json(teams);
  } catch (error: any) {
    console.error("getMyTeams error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch user teams", error: error.message });
  }
};

// Get single team
export const getTeamById = async (req: Request, res: Response) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("lead", "name email role")
      .populate("members", "name email role")
      .populate("projects", "title status")
      .populate("tasks", "title status");

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json(team);
  } catch (error: any) {
    console.error("getTeamById error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch team", error: error.message });
  }
};

// Update team
export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { name, description, leadId, memberIds } = req.body as {
      name?: string;
      description?: string;
      leadId?: string;
      memberIds?: string[];
    };

    const update: any = {};

    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (leadId !== undefined)
      update.lead = leadId ? new Types.ObjectId(leadId) : null;
    if (memberIds !== undefined) {
      update.members = memberIds.map((id) => new Types.ObjectId(id));
    }

    const team = await Team.findByIdAndUpdate(req.params.id, update, {
      new: true,
    })
      .populate("lead", "name email role")
      .populate("members", "name email role")
      .populate("projects", "title status")
      .populate("tasks", "title status");

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json(team);
  } catch (error: any) {
    console.error("updateTeam error:", error);
    res
      .status(500)
      .json({ message: "Failed to update team", error: error.message });
  }
};

// Delete team
export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json({ message: "Team deleted successfully" });
  } catch (error: any) {
    console.error("deleteTeam error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete team", error: error.message });
  }
};

// Update members only
export const updateTeamMembers = async (req: Request, res: Response) => {
  try {
    const { memberIds } = req.body as { memberIds: string[] };

    const membersObjectIds = (memberIds || []).map(
      (id) => new Types.ObjectId(id)
    );

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { members: membersObjectIds },
      { new: true }
    )
      .populate("lead", "name email role")
      .populate("members", "name email role")
      .populate("projects", "title status")
      .populate("tasks", "title status");

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json(team);
  } catch (error: any) {
    console.error("updateTeamMembers error:", error);
    res.status(500).json({
      message: "Failed to update team members",
      error: error.message,
    });
  }
};

// Assign projects
export const assignProjectsToTeam = async (req: Request, res: Response) => {
  try {
    const { projectIds } = req.body as { projectIds: string[] };

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (projectIds && projectIds.length > 0) {
      const count = await Project.countDocuments({ _id: { $in: projectIds } });
      if (count !== projectIds.length) {
        return res.status(400).json({ message: "Some projects not found" });
      }

      const projectObjectIds = (projectIds || []).map(
        (id) => new Types.ObjectId(id)
      );
      team.projects = projectObjectIds;
      await team.save();
    }

    const populated = await Team.findById(team._id)
      .populate("lead", "name email role")
      .populate("members", "name email role")
      .populate("projects", "title status")
      .populate("tasks", "title status");

    res.json(populated);
  } catch (error: any) {
    console.error("assignProjectsToTeam error:", error);
    res.status(500).json({
      message: "Failed to assign projects",
      error: error.message,
    });
  }
};

// Assign tasks
export const assignTasksToTeam = async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body as { taskIds: string[] };

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (taskIds && taskIds.length > 0) {
      const count = await Task.countDocuments({ _id: { $in: taskIds } });
      if (count !== taskIds.length) {
        return res.status(400).json({ message: "Some tasks not found" });
      }

      const taskObjectIds = (taskIds || []).map(
        (id) => new Types.ObjectId(id)
      );
      team.tasks = taskObjectIds;
      await team.save();
    }

    const populated = await Team.findById(team._id)
      .populate("lead", "name email role")
      .populate("members", "name email role")
      .populate("projects", "title status")
      .populate("tasks", "title status");

    res.json(populated);
  } catch (error: any) {
    console.error("assignTasksToTeam error:", error);
    res
      .status(500)
      .json({ message: "Failed to assign tasks", error: error.message });
  }
};
