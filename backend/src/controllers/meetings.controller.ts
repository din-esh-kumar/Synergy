// src/controllers/meetings.controller.ts
import { Request, Response } from 'express';
import Meeting from '../models/Meeting.model';
import User from '../models/User.model';
import { createNotification } from '../utils/notificationEngine';
import { emitToRoom } from '../utils/socketEmitter';
import { createGoogleCalendarEvent } from '../utils/googleCalendar';

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

// small helper for 1‑hour default end time
const addHours = (date: Date, hours: number) =>
  new Date(date.getTime() + hours * 60 * 60 * 1000);

// get frontend base URL for internal room links
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ------------------------------------
// CREATE SCHEDULED MEETING (CALENDAR)
// ------------------------------------
export const createMeeting = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      joinLink,          // optional (external link)
      attendees,
      mode,              // optional: 'scheduled' | 'instant' | 'link-only'
      syncToGoogle,      // optional flag from frontend
    } = req.body;

    const organizerId = getAuthUserId(req);
    const organizerName =
      (req as any).user?.name ||
      (req as any).user?.fullName ||
      (req as any).user?.email;

    if (!organizerId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start or end time',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    let attendeeIds: string[] = Array.isArray(attendees)
      ? attendees
          .map((id: any) =>
            typeof id === 'string'
              ? id
              : id?._id?.toString() || id?.id,
          )
          .filter(
            (id: any) => typeof id === 'string' && id.trim().length > 0,
          )
      : [];

    if (attendeeIds.length > 0) {
      const existingUsers = await User.find({ _id: { $in: attendeeIds } });
      if (existingUsers.length !== attendeeIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more attendees not found',
        });
      }
    }

    const meeting = new Meeting({
      title,
      description,
      startTime: start,
      endTime: end,
      location,
      joinLink: joinLink || '', // placeholder; may be overwritten below
      organizer: organizerId,
      attendees: attendeeIds,
      mode: mode || 'scheduled',
      status: 'scheduled',
      organiserName: organizerName,
    });

    // Try to create Google Calendar event if requested or if no joinLink
    if (!joinLink || syncToGoogle) {
      try {
        const attendeesForGoogle =
          attendeeIds.length > 0
            ? await User.find({ _id: { $in: attendeeIds } }).select('email')
            : [];

        const googleEvent = await createGoogleCalendarEvent({
          organizerId, // required by helper
          summary: title,
          description,
          startTime: start,
          endTime: end,
          location,
          attendees: attendeesForGoogle.map((u: any) => u.email),
        });

        console.log('googleEvent for scheduled meeting', googleEvent);
        console.log('organizerId used for calendar (scheduled)', organizerId);

        if (googleEvent.meetLink) {
          meeting.joinLink = googleEvent.meetLink; // Google Meet URL
        } else if (!meeting.joinLink) {
          // fallback to internal URL
          meeting.joinLink = `${FRONTEND_URL}/meet/${meeting._id.toString()}`;
        }
      } catch (err) {
        console.error('Google Calendar sync failed, using internal link', err);
        if (!meeting.joinLink) {
          meeting.joinLink = `${FRONTEND_URL}/meet/${meeting._id.toString()}`;
        }
      }
    }

    await meeting.save();
    await meeting.populate('organizer attendees', 'name email');

    // notify attendees (exclude organizer)
    if (attendeeIds.length > 0 && organizerId) {
      await createNotification({
        userIds: attendeeIds.filter((id) => id !== organizerId),
        type: 'meeting',
        action: 'assigned',
        title: 'New meeting invitation',
        message: `You've been invited to "${meeting.title}"`,
        entityType: 'meeting',
        entityId: meeting._id.toString(),
        icon: 'video',
        color: '#3b82f6',
      });
    }

    // notify organizer
    await createNotification({
      userId: organizerId,
      type: 'meeting',
      action: 'created',
      title: 'Meeting created successfully',
      message: `Your meeting "${meeting.title}" has ${attendeeIds.length} attendees`,
      entityType: 'meeting',
      entityId: meeting._id.toString(),
      icon: 'check-circle',
      color: '#10b981',
    });

    return res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting,
    });
  } catch (error: any) {
    console.error('Create meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating meeting',
      error: error.message,
    });
  }
};

// ------------------------------------
// CREATE INSTANT MEETING (START NOW)
// ------------------------------------
export const createInstantMeeting = async (req: Request, res: Response) => {
  try {
    const { title, description, location, attendees, syncToGoogle } = req.body;

    const organizerId = getAuthUserId(req);
    if (!organizerId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    const now = new Date();
    const end = addHours(now, 1); // default 1 hour

    let attendeeIds: string[] = Array.isArray(attendees)
      ? attendees
          .map((id: any) =>
            typeof id === 'string'
              ? id
              : id?._id?.toString() || id?.id,
          )
          .filter(
            (id: any) => typeof id === 'string' && id.trim().length > 0,
          )
      : [];

    if (attendeeIds.length > 0) {
      const existingUsers = await User.find({ _id: { $in: attendeeIds } });
      if (existingUsers.length !== attendeeIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more attendees not found',
        });
      }
    }

    const meeting = new Meeting({
      title: title || 'Instant meeting',
      description,
      startTime: now,
      endTime: end,
      location: location || 'Online',
      joinLink: '',
      organizer: organizerId,
      attendees: attendeeIds,
      mode: 'instant',
      status: 'live',
    });

    await meeting.save();

    // Prefer Google Meet if requested, else internal WebRTC URL
    if (syncToGoogle) {
      try {
        const attendeesForGoogle =
          attendeeIds.length > 0
            ? await User.find({ _id: { $in: attendeeIds } }).select('email')
            : [];

        const googleEvent = await createGoogleCalendarEvent({
          organizerId,
          summary: meeting.title,
          description,
          startTime: now,
          endTime: end,
          location: meeting.location,
          attendees: attendeesForGoogle.map((u: any) => u.email),
        });

        console.log('googleEvent for instant meeting', googleEvent);
        console.log('organizerId used for calendar (instant)', organizerId);

        if (googleEvent.meetLink) {
          meeting.joinLink = googleEvent.meetLink;
        } else {
          meeting.joinLink = `${FRONTEND_URL}/meet/${meeting._id.toString()}`;
        }
      } catch (err) {
        console.error(
          'Instant Google Meet creation failed, using internal link',
          err,
        );
        meeting.joinLink = `${FRONTEND_URL}/meet/${meeting._id.toString()}`;
      }
    } else {
      meeting.joinLink = `${FRONTEND_URL}/meet/${meeting._id.toString()}`;
    }

    await meeting.save();
    await meeting.populate('organizer attendees', 'name email');

    if (attendeeIds.length > 0) {
      await createNotification({
        userIds: attendeeIds.filter((id) => id !== organizerId),
        type: 'meeting',
        action: 'assigned',
        title: 'Instant meeting started',
        message: `An instant meeting "${meeting.title}" has started`,
        entityType: 'meeting',
        entityId: meeting._id.toString(),
        icon: 'video',
        color: '#22c55e',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Instant meeting created',
      meeting,
    });
  } catch (error: any) {
    console.error('Create instant meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating instant meeting',
      error: error.message,
    });
  }
};

// ------------------------------------
// CREATE LINK-ONLY MEETING (NO TIME)
// ------------------------------------
export const createLinkOnlyMeeting = async (req: Request, res: Response) => {
  try {
    const { title, description, location, syncToGoogle } = req.body;

    const organizerId = getAuthUserId(req);
    if (!organizerId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    // still store some time window (now .. +1h) so schema is valid
    const now = new Date();
    const end = addHours(now, 1);

    const meeting = new Meeting({
      title: title || 'Meeting link',
      description,
      startTime: now,
      endTime: end,
      location: location || 'Online',
      joinLink: '',
      organizer: organizerId,
      attendees: [],
      mode: 'link-only',
      status: 'scheduled',
    });

    await meeting.save();

    // Try Google Meet link if requested; else internal link
    if (syncToGoogle) {
      try {
        const googleEvent = await createGoogleCalendarEvent({
          organizerId,
          summary: meeting.title,
          description,
          startTime: now,
          endTime: end,
          location: meeting.location,
          attendees: [],
        });

        console.log('googleEvent for link-only meeting', googleEvent);
        console.log('organizerId used for calendar (link-only)', organizerId);

        if (googleEvent.meetLink) {
          meeting.joinLink = googleEvent.meetLink;
        } else {
          meeting.joinLink = `${FRONTEND_URL}/meet/${meeting._id.toString()}`;
        }
      } catch (err) {
        console.error(
          'Link-only Google Meet creation failed, using internal link',
          err,
        );
        meeting.joinLink = `${FRONTEND_URL}/meet/${meeting._id.toString()}`;
      }
    } else {
      meeting.joinLink = `${FRONTEND_URL}/meet/${meeting._id.toString()}`;
    }

    await meeting.save();
    await meeting.populate('organizer', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Meeting link created',
      meeting,
    });
  } catch (error: any) {
    console.error('Create link-only meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating meeting link',
      error: error.message,
    });
  }
};

// ------------------------------------
// JOIN MEETING
// ------------------------------------
export const joinMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: 'Meeting not found' });
    }

    const attendeeIds = (meeting.attendees || []).map((a: any) =>
      a?.toString ? a.toString() : a,
    );

    if (
      !attendeeIds.includes(userId) &&
      meeting.organizer.toString() !== userId
    ) {
      // auto-add as attendee when joining by link
      (meeting.attendees as any).push(userId as any);
    }

    if (meeting.status === 'scheduled') {
      meeting.status = 'live';
    }

    await meeting.save();

    emitToRoom(`meeting:${meeting._id.toString()}`, 'meeting-joined', {
      userId,
    });

    return res.status(200).json({
      success: true,
      message: 'Joined meeting',
      meeting,
    });
  } catch (error: any) {
    console.error('Join meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error joining meeting',
      error: error.message,
    });
  }
};

// ------------------------------------
// LEAVE MEETING
// ------------------------------------
export const leaveMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: 'Meeting not found' });
    }

    meeting.attendees = (meeting.attendees || []).filter((a: any) => {
      const attId = a?.toString ? a.toString() : a;
      return attId !== userId;
    });

    if (meeting.attendees.length === 0 && meeting.status === 'live') {
      meeting.status = 'ended';
    }

    await meeting.save();

    emitToRoom(`meeting:${meeting._id.toString()}`, 'meeting-left', { userId });

    return res.status(200).json({
      success: true,
      message: 'Left meeting',
      meeting,
    });
  } catch (error: any) {
    console.error('Leave meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error leaving meeting',
      error: error.message,
    });
  }
};

// ------------------------------------
// LIST / DETAILS / DELETE / STATS
// ------------------------------------
export const getMeetings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const { status, startDate, endDate, search } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    const query: any = {
      $or: [{ organizer: userId }, { attendees: userId }],
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        const sd = new Date(startDate as string);
        if (!Number.isNaN(sd.getTime())) {
          query.startTime.$gte = sd;
        }
      }
      if (endDate) {
        const ed = new Date(endDate as string);
        if (!Number.isNaN(ed.getTime())) {
          query.startTime.$lte = ed;
        }
      }
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search as string, $options: 'i' } },
          { description: { $regex: search as string, $options: 'i' } },
          { location: { $regex: search as string, $options: 'i' } },
        ],
      });
    }

    const meetings = await Meeting.find(query)
      .populate('organizer attendees', 'name email')
      .sort({ startTime: 1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error('Get meetings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching meetings',
      error: error.message,
    });
  }
};

export const getMeetingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    const meeting = await Meeting.findById(id).populate(
      'organizer attendees',
      'name email',
    );

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: 'Meeting not found' });
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
        .json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, meeting });
  } catch (error: any) {
    console.error('Get meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching meeting',
      error: error.message,
    });
  }
};

export const updateMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);
    const updates: any = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: 'Meeting not found' });
    }

    const meetingOrganizerId =
      (meeting.organizer as any)?._id?.toString?.() ||
      (meeting.organizer as any)?.id?.toString?.() ||
      meeting.organizer.toString();

    if (!meetingOrganizerId || meetingOrganizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the organizer can update this meeting',
      });
    }

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
          message: 'End time must be after start time',
        });
      }
    }

    if (Array.isArray(updates.attendees)) {
      const normalizedIds: string[] = updates.attendees
        .map((a: any) =>
          typeof a === 'string' ? a : a?._id?.toString() || a?.id,
        )
        .filter(
          (id: any) => typeof id === 'string' && id.trim().length > 0,
        );

      updates.attendees = normalizedIds;

      if (normalizedIds.length > 0) {
        const existingUsers = await User.find({
          _id: { $in: normalizedIds },
        });

        if (existingUsers.length !== normalizedIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more attendees not found',
          });
        }
      }
    }

    const oldAttendees = (meeting.attendees || []).map((a: any) =>
      a?.toString ? a.toString() : a,
    );

    Object.assign(meeting, updates);
    await meeting.save();
    await meeting.populate('organizer attendees', 'name email');

    const updatedAttendeeIds: string[] = (meeting.attendees || []).map(
      (a: any) => (a?._id ? a._id.toString() : a.toString()),
    );
    const notifyIds = updatedAttendeeIds.filter((id) => id !== userId);

    if (notifyIds.length > 0) {
      await createNotification({
        userIds: notifyIds,
        type: 'meeting',
        action: 'updated',
        title: 'Meeting updated',
        message: `Meeting "${meeting.title}" was updated`,
        entityType: 'meeting',
        entityId: meeting._id.toString(),
        icon: 'edit',
        color: '#0ea5e9',
      });
    }

    if (Array.isArray(updates.attendees)) {
      const added = updatedAttendeeIds.filter(
        (id) => !oldAttendees.includes(id) && id !== userId,
      );
      if (added.length > 0) {
        await createNotification({
          userIds: added,
          type: 'meeting',
          action: 'assigned',
          title: 'New meeting invitation',
          message: `You've been invited to "${meeting.title}"`,
          entityType: 'meeting',
          entityId: meeting._id.toString(),
          icon: 'video',
          color: '#3b82f6',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      meeting,
    });
  } catch (error: any) {
    console.error('Update meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating meeting',
      error: error.message,
    });
  }
};

export const deleteMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = getAuthUserId(req);

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res
        .status(404)
        .json({ success: false, message: 'Meeting not found' });
    }

    const meetingOrganizerId =
      (meeting.organizer as any)?._id?.toString?.() ||
      (meeting.organizer as any)?.id?.toString?.() ||
      meeting.organizer.toString();

    if (!meetingOrganizerId || meetingOrganizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the organizer can delete this meeting',
      });
    }

    const attendeeIds: string[] = (meeting.attendees || []).map(
      (a: any) => (a?._id ? a._id.toString() : a.toString()),
    );

    await meeting.deleteOne();

    if (attendeeIds.length > 0) {
      await createNotification({
        userIds: attendeeIds.filter((id) => id !== userId),
        type: 'meeting',
        action: 'deleted',
        title: 'Meeting cancelled',
        message: `Meeting "${meeting.title}" has been cancelled`,
        entityType: 'meeting',
        entityId: id,
        icon: 'x-circle',
        color: '#ef4444',
      });
    }

    return res
      .status(200)
      .json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error: any) {
    console.error('Delete meeting error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting meeting',
      error: error.message,
    });
  }
};

export const getUpcomingMeetings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const now = new Date();

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    const meetings = await Meeting.find({
      $or: [{ organizer: userId }, { attendees: userId }],
      startTime: { $gte: now },
    })
      .populate('organizer attendees', 'name email')
      .sort({ startTime: 1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error('Get upcoming meetings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching upcoming meetings',
      error: error.message,
    });
  }
};

export const getMonthlyMeetings = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    const { year, month } = req.query;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized' });
    }

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required',
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

    return res.status(200).json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    console.error('Get monthly meetings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching monthly meetings',
      error: error.message,
    });
  }
};
