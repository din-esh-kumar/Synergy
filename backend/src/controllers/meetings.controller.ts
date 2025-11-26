import { Request, Response } from 'express';
import Meeting from '../config/Meeting.model';
import User from "../config/User.model";


// Create a new meeting
export const createMeeting = async (req: Request, res: Response) => {
  try {
    const { title, description, startTime, endTime, location, meetingLink, attendees, reminder } = req.body;
    const organizerId = req.user?.id;

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: 'Cannot schedule meetings in the past' });
    }

    // Check if attendees exist
    if (attendees && attendees.length > 0) {
      const existingUsers = await User.find({ _id: { $in: attendees } });
      if (existingUsers.length !== attendees.length) {
        return res.status(400).json({ message: 'One or more attendees not found' });
      }
    }

    const meeting = new Meeting({
      title,
      description,
      startTime: start,
      endTime: end,
      location,
      meetingLink,
      organizer: organizerId,
      attendees: attendees || [],
      reminder,
    });

    await meeting.save();
    await meeting.populate('organizer attendees', 'name email');

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting,
    });
  } catch (error: any) {
    console.error('Create meeting error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating meeting', 
      error: error.message 
    });
  }
};

// Get all meetings with filters
export const getMeetings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, startDate, endDate, search } = req.query;

    let query: any = {
      $or: [{ organizer: userId }, { attendees: userId }],
    };

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const meetings = await Meeting.find(query)
      .populate('organizer attendees', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({ 
      success: true,
      count: meetings.length,
      meetings 
    });
  } catch (error: any) {
    console.error('Get meetings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching meetings', 
      error: error.message 
    });
  }
};

// Get single meeting by ID
export const getMeetingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const meeting = await Meeting.findById(id)
      .populate('organizer attendees', 'name email');

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        message: 'Meeting not found' 
      });
    }

    // Check if user has access to this meeting
    const hasAccess = 
      meeting.organizer._id.toString() === userId ||
      meeting.attendees.some((attendee: any) => attendee._id.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.status(200).json({ 
      success: true,
      meeting 
    });
  } catch (error: any) {
    console.error('Get meeting error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching meeting', 
      error: error.message 
    });
  }
};

// Update meeting
export const updateMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        message: 'Meeting not found' 
      });
    }

    // Only organizer can update
    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Only the organizer can update this meeting' 
      });
    }

    // Validate dates if provided
    if (updates.startTime || updates.endTime) {
      const startTime = updates.startTime ? new Date(updates.startTime) : meeting.startTime;
      const endTime = updates.endTime ? new Date(updates.endTime) : meeting.endTime;

      if (startTime >= endTime) {
        return res.status(400).json({ 
          success: false,
          message: 'End time must be after start time' 
        });
      }
    }

    // Validate attendees if provided
    if (updates.attendees && updates.attendees.length > 0) {
      const existingUsers = await User.find({ _id: { $in: updates.attendees } });
      if (existingUsers.length !== updates.attendees.length) {
        return res.status(400).json({ 
          success: false,
          message: 'One or more attendees not found' 
        });
      }
    }

    Object.assign(meeting, updates);
    await meeting.save();
    await meeting.populate('organizer attendees', 'name email');

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      meeting,
    });
  } catch (error: any) {
    console.error('Update meeting error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating meeting', 
      error: error.message 
    });
  }
};

// Delete meeting
export const deleteMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        message: 'Meeting not found' 
      });
    }

    // Only organizer can delete
    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Only the organizer can delete this meeting' 
      });
    }

    await meeting.deleteOne();

    res.status(200).json({ 
      success: true,
      message: 'Meeting deleted successfully' 
    });
  } catch (error: any) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting meeting', 
      error: error.message 
    });
  }
};

// Get upcoming meetings
export const getUpcomingMeetings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const now = new Date();

    const meetings = await Meeting.find({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: now },
      status: 'scheduled',
    })
      .populate('organizer attendees', 'name email')
      .sort({ startTime: 1 })
      .limit(limit);

    res.status(200).json({ 
      success: true,
      count: meetings.length,
      meetings 
    });
  } catch (error: any) {
    console.error('Get upcoming meetings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching upcoming meetings', 
      error: error.message 
    });
  }
};

// Get meetings for calendar view (monthly)
export const getMonthlyMeetings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ 
        success: false,
        message: 'Year and month are required' 
      });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const meetings = await Meeting.find({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: startDate, $lte: endDate },
    })
      .populate('organizer attendees', 'name email')
      .sort({ startTime: 1 });

    res.status(200).json({ 
      success: true,
      count: meetings.length,
      meetings 
    });
  } catch (error: any) {
    console.error('Get monthly meetings error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching monthly meetings', 
      error: error.message 
    });
  }
};
