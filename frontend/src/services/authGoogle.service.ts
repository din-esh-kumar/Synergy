// frontend/src/services/authGoogle.service.ts
import api from './api';
// import type { IUser } from '../types/auth.types'; // if you actually need the type

// frontend/src/services/authGoogle.service.ts
export const connectGoogleCalendar = (currentUserId: string) => {
  const backendBase =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  window.location.href = `${backendBase}/auth/google?userId=${currentUserId}`;
};

