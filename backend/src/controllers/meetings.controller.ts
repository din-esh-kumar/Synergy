// src/controllers/meetings.controller.ts
import { Request, Response } from "express";
import Meeting from "../models/Meeting.model";
import User from "../models/User.model";
import { createNotification } from "../utils/notificationEngine";

// helper to get current user id safely
const getAuthUserId = (req: Request): string | undefined => {
  const u = (req as any).user;
  if (!u) return undefined;
  return (
    u.id?.toString?.() ||
    u._id?.toString?.() ||
    u.userId
  ) as string | undefined;
};

// Create a new meeting
export const createMeeting = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      joinLink,
      attendees,
    } = req.body;

    const organizerId = getAuthUserId(req);
    const organizerName =
      (req as any).user?.name ||
      (req as any).user?.fullName ||
      (req as any).user?.email;

    if (!organizerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    let attendeeIds: string[] = Array.isArray(attendees)
      ? attendees
          .map((id: any) =>
            typeof id === "string"
              ? id
              : id?._id?.toString() || id?.id
          )
          .filter(
            (id: any) => typeof id === "string" && id.trim().length > 0
          )
      : [];

    if (attendeeIds.length > 0) {
      const existingUsers = await User.find({ _id: { $in: attendeeIds } });
      if (existingUsers.length !== attendeeIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more attendees not found",
        });
      }
    }

    const meeting = new Meeting({
      title,
      description,
      startTime: start,
      endTime: end,
      location,
      joinLink,
      organizer: organizerId,
      attendees: attendeeIds,
    });

    await meeting.save();
    await meeting.populate("organizer attendees", "name email");

    // notify attendees (exclude organizer)
    if (attendeeIds.length > 0 && organizerId) {
      await createNotification({
        userIds: attendeeIds.filter((id) => id !== organizerId),
        type: "meeting",
        action: "assigned",
        title: "New meeting invitation",
        message: `You've been invited to "${meeting.title}"`,
        entityType: "meeting",
        entityId: meeting._id.toString(),
        icon: "video",
        color: "#3b82f6",
      });
    }

    // notify organizer
    await createNotification({
      userId: organizerId,
      type: "meeting",
      action: "created",
      title: "Meeting created successfully",
      message: `Your meeting "${meeting.title}" has ${attendeeIds.length} attendees`,
      entityType: "meeting",
      entityId: meeting._id.toString(),
      icon: "check-circle",
      color: "#10b981",
    });

    return res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meeting,
    });
  } catch (error: any) {
    console.error("Create meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating meeting",
      error: error.message,
    });
  }
};

// Get all meetings with filters
export const getMeetings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const { status, startDate, endDate, search } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const query: any = {
      $or: [{ organizer: userId }, { attendees: userId }],
    };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate as string);
      }
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search as string, $options: "i" } },
          { description: { $regex: search as string, $options: "i" } },
          { location: { $regex: search as string, $options: "i" } },
        ],
      });
    }

    const meetings = await Meeting.find(query)
      .populate("organizer attendees", "name email")
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error("Get meetings error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching meetings",
      error: error.message,
    });
  }
};

// Get single meeting by ID
export const getMeetingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const meeting = await Meeting.findById(id).populate(
      "organizer attendees",
      "name email"
    );

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    const organizerIdStr = (meeting.organizer as any)._id
      ? (meeting.organizer as any)._id.toString()
      : (meeting.organizer as any).toString();

    const isOrganizer = organizerIdStr === userId;

    const isAttendee = Array.isArray(meeting.attendees)
      ? meeting.attendees.some((attendee: any) => {
          const attId = attendee?._id
            ? attendee._id.toString()
            : attendee.toString();
          return attId === userId;
        })
      : false;

    if (!isOrganizer && !isAttendee) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, meeting });
  } catch (error: any) {
    console.error("Get meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching meeting",
      error: error.message,
    });
  }
};

// Update meeting
export const updateMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);
    const updates: any = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    // robust organizer comparison (handles ObjectId or populated doc)
    const meetingOrganizerId =
      (meeting.organizer as any)?._id?.toString?.() ||
      (meeting.organizer as any)?.id?.toString?.() ||
      meeting.organizer.toString();

    if (!meetingOrganizerId || meetingOrganizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the organizer can update this meeting",
      });
    }

    // Validate time range if either time is changing
    if (updates.startTime || updates.endTime) {
      const startTime = updates.startTime
        ? new Date(updates.startTime)
        : new Date(meeting.startTime);
      const endTime = updates.endTime
        ? new Date(updates.endTime)
        : new Date(meeting.endTime);

      if (startTime >= endTime) {
        return res.status(400).json({
          success: false,
          message: "End time must be after start time",
        });
      }
    }

    // Normalize attendees to valid string IDs before validating
    if (Array.isArray(updates.attendees)) {
      const normalizedIds: string[] = updates.attendees
        .map((a: any) =>
          typeof a === "string" ? a : a?._id?.toString() || a?.id
        )
        .filter(
          (id: any) => typeof id === "string" && id.trim().length > 0
        );

      console.log("PUT /meetings/:id raw attendees:", updates.attendees);
      console.log("PUT /meetings/:id normalized attendees:", normalizedIds);
      updates.attendees = normalizedIds;

      if (normalizedIds.length > 0) {
        const existingUsers = await User.find({ _id: { $in: normalizedIds } });
        const existingIds = existingUsers.map((u: any) =>
          u._id.toString()
        );
        console.log("Existing user IDs:", existingIds);
        console.log(
          "Invalid attendee IDs:",
          normalizedIds.filter((id) => !existingIds.includes(id))
        );

        if (existingUsers.length !== normalizedIds.length) {
          return res.status(400).json({
            success: false,
            message: "One or more attendees not found",
          });
        }
      }
    }

    const oldAttendees = (meeting.attendees || []).map((a: any) =>
      a?.toString ? a.toString() : a
    );
    const oldTitle = meeting.title;

    Object.assign(meeting, updates);
    await meeting.save();
    await meeting.populate("organizer attendees", "name email");

    // ✅ Notify attendees about update (excluding organizer)
    const updatedAttendeeIds: string[] = (meeting.attendees || []).map(
      (a: any) => (a?._id ? a._id.toString() : a.toString())
    );
    const notifyIds = updatedAttendeeIds.filter((id) => id !== userId);

    if (notifyIds.length > 0) {
      await createNotification({
        userIds: notifyIds,
        type: "meeting",
        action: "updated",
        title: "Meeting updated",
        message: `Meeting "${meeting.title}" was updated`,
        entityType: "meeting",
        entityId: meeting._id.toString(),
        icon: "edit",
        color: "#0ea5e9",
      });
    }

    // ✅ If new attendees were added, send them a dedicated invite notification
    if (Array.isArray(updates.attendees)) {
      const added = updatedAttendeeIds.filter(
        (id) => !oldAttendees.includes(id) && id !== userId
      );
      if (added.length > 0) {
        await createNotification({
          userIds: added,
          type: "meeting",
          action: "assigned",
          title: "New meeting invitation",
          message: `You've been invited to "${meeting.title}"`,
          entityType: "meeting",
          entityId: meeting._id.toString(),
          icon: "video",
          color: "#3b82f6",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
      meeting,
    });
  } catch (error: any) {
    console.error("Update meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating meeting",
      error: error.message,
    });
  }
};

// Delete meeting
export const deleteMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });
    }

    const meetingOrganizerId =
      (meeting.organizer as any)?._id?.toString?.() ||
      (meeting.organizer as any)?.id?.toString?.() ||
      meeting.organizer.toString();

    if (!meetingOrganizerId || meetingOrganizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the organizer can delete this meeting",
      });
    }

    const attendeeIds: string[] = (meeting.attendees || []).map((a: any) =>
      a?._id ? a._id.toString() : a.toString()
    );

    await meeting.deleteOne();

    // ✅ Notify attendees about cancellation
    if (attendeeIds.length > 0) {
      await createNotification({
        userIds: attendeeIds.filter((id) => id !== userId),
        type: "meeting",
        action: "deleted",
        title: "Meeting cancelled",
        message: `Meeting "${meeting.title}" has been cancelled`,
        entityType: "meeting",
        entityId: id,
        icon: "x-circle",
        color: "#ef4444",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Meeting deleted successfully" });
  } catch (error: any) {
    console.error("Delete meeting error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting meeting",
      error: error.message,
    });
  }
};

// Get upcoming meetings
export const getUpcomingMeetings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const now = new Date();

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const meetings = await Meeting.find({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: now },
    })
      .populate("organizer attendees", "name email")
      .sort({ startTime: 1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error("Get upcoming meetings error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching upcoming meetings",
      error: error.message,
    });
  }
};

// Get meetings for calendar view (monthly)
export const getMonthlyMeetings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const { year, month } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year and month are required",
      });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const meetings = await Meeting.find({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: startDate, $lte: endDate },
    })
      .populate("organizer attendees", "name email")
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error("Get monthly meetings error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching monthly meetings",
      error: error.message,
    });
  }
};
