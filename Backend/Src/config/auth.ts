import { Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms'; // if using ms-style durations like '1h'

export const jwtConfig = {
  secret: process.env.JWT_SECRET as Secret,
  refreshSecret: process.env.JWT_REFRESH_SECRET as Secret,
  accessExpiry: process.env.JWT_ACCESS_EXPIRY as StringValue || '1h',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY as StringValue || '7d',
};
