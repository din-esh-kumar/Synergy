import { Request, Response } from "express";

export const createIssue = (req: Request, res: Response) => {
  res.json({ message: "Issue created" });
};

export const getIssues = (req: Request, res: Response) => {
  res.json({ message: "Get all issues" });
};

export const updateIssue = (req: Request, res: Response) => {
  res.json({ message: "Issue updated" });
};

export const deleteIssue = (req: Request, res: Response) => {
  res.json({ message: "Issue deleted" });
};
