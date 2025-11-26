import { Request, Response } from 'express';
import WeeklyReport from '../models/WeeklyUpdate.model';
import Project from '../models/Project.model';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  };
}

// @desc    Create a weekly report (Draft or Submitted)
// @route   POST /api/weekly-reports
// @access  Manager only
export const createWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      projectId, 
      weekStart, 
      weekEnd, 
      summary, 
      progressPercentage, 
      teamPerformance, 
      issuesFaced, 
      nextWeekPlan,
      status 
    } = req.body;

    // 1. Validate Project Ownership
    // A manager should only report on projects they are assigned to.
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Strict Check: Is this manager assigned to this project?
    // (Admin bypass optional, but typically Managers write reports)
    if (project.assignedManagerId.toString() !== req.user!.id && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ msg: 'Access denied. You are not the manager of this project.' });
    }

    // 2. Create Report
    const report = new WeeklyReport({
      managerId: req.user!.id,
      projectId,
      weekStart,
      weekEnd,
      summary,
      progressPercentage,
      teamPerformance,
      issuesFaced,
      nextWeekPlan,
      status: status || 'DRAFT' // Default to Draft if not specified
    });

    await report.save();
    res.status(201).json(report);

  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Get weekly reports
// @route   GET /api/weekly-reports
// @access  Private
export const getWeeklyReports = async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};

    // 1. Manager: See my own reports (Drafts & Submitted)
    if (req.user?.role === 'MANAGER') {
      query = { managerId: req.user.id };
    }
    // 2. Admin: See ALL reports (Usually just SUBMITTED, but let's show all for oversight)
    //    If you want Admins to only see SUBMITTED, uncomment below:
    //    else if (req.user?.role === 'ADMIN') { query = { status: 'SUBMITTED' }; }

    // Optional Filtering
    if (req.query.projectId) query.projectId = req.query.projectId;
    if (req.query.status) query.status = req.query.status;

    const reports = await WeeklyReport.find(query)
      .populate('projectId', 'name key')
      .populate('managerId', 'name email')
      .sort({ weekStart: -1 }); // Newest weeks first

    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Get single report
// @route   GET /api/weekly-reports/:id
// @access  Private
export const getWeeklyReportById = async (req: AuthRequest, res: Response) => {
  try {
    const report = await WeeklyReport.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('managerId', 'name');

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Access Control
    if (req.user?.role === 'MANAGER' && report.managerId._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied.' });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Update a weekly report
// @route   PUT /api/weekly-reports/:id
// @access  Manager (Own Drafts)
export const updateWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await WeeklyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Authorization
    if (report.managerId.toString() !== req.user!.id) {
      return res.status(403).json({ msg: 'Access denied. You do not own this report.' });
    }

    // Logic: Prevent editing if already SUBMITTED (unless Admin override, not implemented here)
    if (report.status === 'SUBMITTED' && req.body.status !== 'SUBMITTED') {
       // Optional: Allow them to un-submit? Or strictly block edits?
       // Let's strictly block editing content of submitted reports for integrity.
       // Use case: "I submitted it, it's official record now."
       return res.status(400).json({ msg: 'Cannot edit a submitted report.' });
    }

    const updatedReport = await WeeklyReport.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedReport);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

// @desc    Delete a weekly report
// @route   DELETE /api/weekly-reports/:id
// @access  Manager (Own Drafts) or Admin
export const deleteWeeklyReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await WeeklyReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Admin can delete anything. Manager can only delete their own DRAFTS.
    if (req.user?.role === 'MANAGER') {
      if (report.managerId.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Access denied.' });
      }
      if (report.status === 'SUBMITTED') {
        return res.status(400).json({ msg: 'Cannot delete a submitted report. Contact Admin.' });
      }
    }

    await report.deleteOne();
    res.json({ msg: 'Report removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};