import { Request, Response } from "express";

export const createProject = async (req: Request, res: Response) => {
  try {
    res.status(201).json({ message: "Project created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating project" });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    res.json({ message: "List of all projects" });
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects" });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  try {
    res.json({ message: "Project details" });
  } catch (error) {
    res.status(500).json({ message: "Error fetching project details" });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    res.json({ message: "Project updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating project" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project" });
  }
};
