// backend/src/services/auth.service.ts
import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { jwtConfig } from '../config/auth';
import User, { IUser } from '../models/User.model';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface IUserPayload {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
  // Helper: generate access + refresh tokens
  private static generateTokens(user: IUser) {
    const payload: IUserPayload = {
      id: String(user._id),
      email: String(user.email),
      role: String(user.role),
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret as Secret, {
      expiresIn: jwtConfig.accessExpiry || '1h',
    });

    const refreshToken = jwt.sign(
      payload,
      jwtConfig.refreshSecret as Secret,
      {
        expiresIn: jwtConfig.refreshExpiry || '7d',
      }
    );

    return { accessToken, refreshToken };
  }

  // Registration with email/password
  static async register(data: {
    name: string;
    email: string;
    password: string;
    role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    phone?: string;
    designation?: string;
  }) {
    const { name, email, password, role, phone, designation } = data;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userDoc = await User.create({
      name,
      email,
      password: passwordHash,
      role: role || 'EMPLOYEE',
      phone,
      designation,
      status: true,
    });

    const user = userDoc.toObject();
    const { password: _pw, ...safeUser } = user;

    const { accessToken, refreshToken } = this.generateTokens(userDoc);
    return { user: safeUser, accessToken, refreshToken };
  }

  // Login with email/password
  static async login(email: string, password: string) {
    const userDoc = await User.findOne({ email });
    if (!userDoc) {
      throw new Error('Invalid credentials');
    }

    if (userDoc.status === false) {
      throw new Error('User account is inactive');
    }

    const valid = await bcrypt.compare(password, userDoc.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const user = userDoc.toObject();
    const { password: _pw, ...safeUser } = user;

    const { accessToken, refreshToken } = this.generateTokens(userDoc);
    return { user: safeUser, accessToken, refreshToken };
  }

  // Google sign-in / registration
  static async verifyGoogleToken(idToken: string) {
    if (!idToken) {
      throw new Error('Missing Google ID token');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token payload');
    }

    let userDoc = await User.findOne({ email: payload.email });

    if (!userDoc) {
      // For Google users, store an empty password
      userDoc = await User.create({
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
        email: payload.email,
        password: '', // no local password
        role: 'EMPLOYEE',
        status: true,
      });
    } else if (userDoc.status === false) {
      throw new Error('User account is inactive');
    }

    const user = userDoc.toObject();
    const { password: _pw, ...safeUser } = user;

    const { accessToken, refreshToken } = this.generateTokens(userDoc);
    return { user: safeUser, accessToken, refreshToken };
  }

  // Refresh access token using refresh token
  static async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        jwtConfig.refreshSecret as Secret
      ) as IUserPayload;

      const userDoc = await User.findById(decoded.id);
      if (!userDoc || userDoc.status === false) {
        throw new Error('User not found or inactive');
      }

      const { accessToken } = this.generateTokens(userDoc);
      return { accessToken };
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }
}

export default AuthService;
