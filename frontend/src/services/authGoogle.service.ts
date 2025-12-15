// frontend/src/services/authGoogle.service.ts
import api from './api';

export const connectGoogleCalendar = () => {
  // simplest: redirect browser; cookies/JWT go automatically
  window.location.href = 'http://localhost:5000/api/auth/google';
};
