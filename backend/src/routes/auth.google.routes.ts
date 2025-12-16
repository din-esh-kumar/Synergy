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
// This route should be protected by your auth middleware so (req as any).user.id is set
router.get('/google', (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (!authUser || !authUser.id) {
      return res.status(401).send('Unauthorized: no authenticated user');
    }

    const oAuth2Client = createOAuthClient();
    const scopes = ['https://www.googleapis.com/auth/calendar'];

    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      // pass the app user id through Google's state param
      state: authUser.id.toString(),
    });

    res.redirect(url);
  } catch (err) {
    console.error('Error starting Google OAuth:', err);
    res.status(500).send('Failed to start Google authentication');
  }
});

// STEP 2: callback – save tokens for the user who initiated OAuth
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    const stateUserId = req.query.state as string | undefined; // comes from step 1

    if (!code || !stateUserId) {
      return res.status(400).send('Missing code or state');
    }

    const oAuth2Client = createOAuthClient();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const updatedUser = await User.findByIdAndUpdate(
      stateUserId,
      { googleTokens: tokens },
      { new: true },
    );

    console.log(
      'Google token update result:',
      stateUserId,
      'hasTokens=',
      !!updatedUser?.googleTokens,
    );

    if (!updatedUser) {
      return res.status(404).send('User not found for given userId');
    }

    return res.send('Google tokens saved successfully. You can close this tab.');
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.status(500).send('Google authentication failed');
  }
});

export default router;
