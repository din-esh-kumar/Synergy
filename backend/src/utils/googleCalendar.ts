// src/utils/googleCalendar.ts
import { google, calendar_v3 } from 'googleapis';
import dayjs from 'dayjs';
import User from '../models/User.model';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI as string;

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

const getUserCalendarClient = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user || !(user as any).googleTokens) {
    // not connected to Google
    return null;
  }
  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials((user as any).googleTokens);
  return google.calendar({ version: 'v3', auth: oAuth2Client });
};

export interface CalendarEventResult {
  eventId?: string;
  meetLink?: string;
}

export const createGoogleCalendarEvent = async (params: {
  organizerId: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}): Promise<CalendarEventResult> => {
  const {
    organizerId,
    summary,
    description,
    startTime,
    endTime,
    location,
    attendees = [],
  } = params;

  const calendar = await getUserCalendarClient(organizerId);
  if (!calendar) {
    // user not connected; let caller fall back to internal link
    return { eventId: undefined, meetLink: undefined };
  }

  const eventAttendees: calendar_v3.Schema$EventAttendee[] = attendees.map(
    (email) => ({ email }),
  );

  const event: calendar_v3.Schema$Event = {
    summary,
    description: description || '',
    location: location || undefined,
    start: { dateTime: dayjs(startTime).toISOString() },
    end: { dateTime: dayjs(endTime).toISOString() },
    attendees: eventAttendees,
    conferenceData: {
      createRequest: {
        requestId: `instant-${Date.now()}`,
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
    conference?.entryPoints?.find((e) => e.entryPointType === 'video')
      ?.uri || created.hangoutLink || undefined;

  return {
    eventId: created.id as string,
    meetLink,
  };
};
