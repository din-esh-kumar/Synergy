// backend/src/utils/googleCalendar.ts
import { google, calendar_v3 } from 'googleapis';
import dayjs from 'dayjs';
import Meeting from '../models/Meeting.model';
import User from '../models/User.model';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// You must set these in your .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI as string;

/**
 * Create an OAuth2 client.
 */
const createOAuthClient = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Google OAuth env vars are missing');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );
};

/**
 * Get an authenticated Calendar client for a given user.
 * You must have stored their tokens already after OAuth login.
 */
const getUserCalendarClient = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user || !(user as any).googleTokens) {
    throw new Error('User has no Google tokens configured');
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials((user as any).googleTokens);

  return google.calendar({ version: 'v3', auth: oAuth2Client });
};

export interface CalendarEventResult {
  eventId: string;
  meetLink?: string;
}

/**
 * Generic helper used by controllers: create a Calendar event + Meet link.
 * This does not depend on the Meeting model.
 */
export const createGoogleCalendarEvent = async (args: {
  organizerId: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[]; // array of attendee emails
}): Promise<CalendarEventResult> => {
  const {
    organizerId,
    summary,
    description,
    startTime,
    endTime,
    location,
    attendees = [],
  } = args;

  const calendar = await getUserCalendarClient(organizerId);

  const attendeeObjs: calendar_v3.Schema$EventAttendee[] = attendees.map(
    (email) => ({ email }),
  );

  const event: calendar_v3.Schema$Event = {
    summary,
    description: description || '',
    location: location || undefined,
    start: {
      dateTime: dayjs(startTime).toISOString(),
    },
    end: {
      dateTime: dayjs(endTime).toISOString(),
    },
    attendees: attendeeObjs,
    conferenceData: {
      createRequest: {
        requestId: `meet-generic-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
  });

  const created = response.data;
  const conference = created.conferenceData;
  const meetLink =
    conference?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
    created.hangoutLink ||
    undefined;

  return {
    eventId: created.id as string,
    meetLink,
  };
};

/**
 * Create a Google Calendar event for a Meeting document and attach a Meet link.
 * (Used if you want to sync after the Meeting is already stored.)
 */
export const createCalendarEventForMeeting = async (
  meetingId: string,
  organizerId: string,
  attendeeIds: string[],
): Promise<CalendarEventResult> => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) {
    throw new Error('Meeting not found');
  }

  const calendar = await getUserCalendarClient(organizerId);

  const attendees: calendar_v3.Schema$EventAttendee[] = [];
  if (attendeeIds.length) {
    const users = await User.find({ _id: { $in: attendeeIds } }).select('email');
    users.forEach((u) => {
      if (u.email) attendees.push({ email: u.email });
    });
  }

  const event: calendar_v3.Schema$Event = {
    summary: meeting.title,
    description: meeting.description || '',
    location: meeting.location || undefined,
    start: {
      dateTime: dayjs(meeting.startTime).toISOString(),
    },
    end: {
      dateTime: dayjs(meeting.endTime).toISOString(),
    },
    attendees,
    conferenceData: {
      createRequest: {
        requestId: `meet-${meeting._id.toString()}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
  });

  const created = response.data;
  const conference = created.conferenceData;
  const meetLink =
    conference?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
    created.hangoutLink ||
    undefined;

  return {
    eventId: created.id as string,
    meetLink,
  };
};

/**
 * Update an existing Calendar event when meeting changes.
 */
export const updateCalendarEventForMeeting = async (
  meetingId: string,
  organizerId: string,
  eventId: string,
): Promise<void> => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  const calendar = await getUserCalendarClient(organizerId);

  const event: calendar_v3.Schema$Event = {
    summary: meeting.title,
    description: meeting.description || '',
    location: meeting.location || undefined,
    start: {
      dateTime: dayjs(meeting.startTime).toISOString(),
    },
    end: {
      dateTime: dayjs(meeting.endTime).toISOString(),
    },
  };

  await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: event,
    sendUpdates: 'all',
  });
};

/**
 * Delete a Calendar event when meeting is deleted.
 */
export const deleteCalendarEvent = async (
  organizerId: string,
  eventId: string,
): Promise<void> => {
  const calendar = await getUserCalendarClient(organizerId);
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
    sendUpdates: 'all',
  });
};
