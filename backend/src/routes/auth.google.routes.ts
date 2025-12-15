// backend/src/routes/auth.google.routes.ts
import express, { Request, Response } from 'express';
import { google } from 'googleapis';
import User from '../models/User.model';

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI as string;

const createOAuthClient = () =>
  new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );

// STEP 1: send user to Google
router.get('/google', (req: Request, res: Response) => {
  const oAuth2Client = createOAuthClient();
  const scopes = ['https://www.googleapis.com/auth/calendar'];

  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  res.redirect(url);
});

// STEP 2: callback – NO auth, NO redirect to frontend
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.status(400).send('Missing code');
    }

    // Use your own MongoDB _id for the organizer user
    const userId = '6926dd43e5a9dd5086e813d2';

    const oAuth2Client = createOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    await User.findByIdAndUpdate(userId, { googleTokens: tokens });

    return res.send('Google tokens saved successfully. You can close this tab.');
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.status(500).send('Google authentication failed');
  }
});

export default router;
