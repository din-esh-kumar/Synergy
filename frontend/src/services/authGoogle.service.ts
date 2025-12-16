// frontend/src/services/authGoogle.service.ts
import api from './api';

// Start Google Calendar OAuth for the currently logged-in user.
// Backend reads the user id from the JWT on /auth/google.
export const connectGoogleCalendar = () => {
  const backendBase =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // This route must be protected by auth middleware so req.user.id is set.
  window.location.href = `${backendBase}/auth/google`;
};
