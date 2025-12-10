# Frontend – React + TypeScript + Vite SPA

React single‑page application for the **Employee Management System**, providing dashboards, forms, approvals, and admin tools for **timesheets**, **expenses**, **leaves**, **projects**, and **users**. It talks to the backend via Axios and uses **Zustand** for state management and **React Router** for navigation, with **Google OAuth** support and **RBAC‑aware** routes.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **State Management**: Zustand (per‑domain stores)
- **Styling**: Tailwind‑style utility classes (`App.css`/`index.css`)
- **Icons**: Font Awesome (`@fortawesome/*`)
- **HTTP**: Axios (`src/config/api.ts`)
- **Auth**: Google OAuth via `@react-oauth/google` + JWT from backend
- **Notifications**: `react-hot-toast`

---

## Scripts

Defined in `package.json`:

- `npm run dev` – start dev server with Vite
- `npm run build` – type‑check then build for production
- `npm run preview` – preview production build
- `npm run lint` – run ESLint

---

## Environment Configuration

Create a `.env.local` (or `.env`) file in the `frontend` directory with:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_API_BASE_URL=http://localhost:8001
```

Notes:

- `VITE_GOOGLE_CLIENT_ID` is used by `GoogleOAuthProvider` in `App.tsx` to enable Google login.
- `VITE_API_BASE_URL` can be wired into `src/config/api.ts` to override the default `http://localhost:8001` if needed.

---

## Folder Structure (Key Files)

- `src/main.tsx` – React entry point, renders `<App />`
- `src/App.tsx`
  - Configures `BrowserRouter` and `Routes`
  - Wraps app in `GoogleOAuthProvider`
  - Sets up global `Toaster` for notifications
  - Declares public routes (`/login`, `/register`) and protected routes with `ProtectedRoute`

- `src/components/`
  - `Layout.tsx` – main shell (sidebar + content) used for authenticated routes
  - `ProtectedRoute.tsx` – checks authentication and optional `allowedRoles` before rendering children
  - `Sidebar.tsx` – navigation with RBAC‑aware links
  - `ProfileModal.tsx`, `ReceiptModal.tsx`, `ConfirmationModal.tsx`, `RejectedReasonTooltip.tsx` – shared UI components
  - `components/admin/*` – admin tables for users, projects, leave types, leave balances, holidays, and exports
  - `components/forms/*` – forms for creating projects, timesheets, expenses, leaves

- `src/pages/`
  - `auth/Login.tsx` – login with email/password and Google OAuth
  - `auth/Register.tsx` – registration flow
  - `Dashboard.tsx` – role‑aware dashboard with stats, quick actions, and zero‑state handling
  - `timesheet/TimesheetList.tsx` – CRUD + submit/approve/resubmit timesheets
  - `expense/ExpenseList.tsx` – expense listing, filtering, and receipt upload
  - `leave/LeaveList.tsx` – leave requests, balances, and details
  - `Approvals.tsx` – manager/admin approvals across timesheets, leaves, and expenses
  - `AdminPanel.tsx` – admin management screens for users, projects, leave types, holidays, and balances

- `src/store/`
  - `authStore.ts` – auth state (user, accessToken, refreshToken), login/register/logout, token refresh, profile update, rate limiting
  - `timesheetStore.ts`, `expenseStore.ts`, `leaveStore.ts` – domain data, API calls, and helpers
  - `adminStore.ts` – users/projects/admin‑level data
  - `approvalStore.ts` – pending approvals aggregation
  - `projectStore.ts`, `exportStore.ts` – project and export helpers

- `src/config/api.ts`
  - `apiClient` – Axios instance with `baseURL` (defaults to `http://localhost:8001`)
  - **Request interceptor** – attaches `Authorization: Bearer <accessToken>` from `authStore`
  - **Response interceptor** – on `401`, attempts automatic token refresh via `authStore.refreshAccessToken`, then retries
  - Special increased timeout for long‑running admin operations (e.g., initialize leave balances)

- `src/types/index.ts` – shared TypeScript types for `User`, timesheets, expenses, leaves, etc.

---

## Routing & RBAC

Routes are defined in `App.tsx`:

- **Public**
  - `/login` – login page
  - `/register` – registration page

- **Protected (wrapped by `ProtectedRoute`)**
  - `/` – `Dashboard`
  - `/timesheets` – `TimesheetList`
  - `/expenses` – `ExpenseList`
  - `/leaves` – `LeaveList`
  - `/approvals` – `Approvals` (only for `manager`, `admin` via `allowedRoles`)
  - `/admin` – `AdminPanel` (only for `admin` via `allowedRoles`)

`ProtectedRoute` reads `useAuthStore` to check `isAuthenticated` and (optionally) `user.role`, redirecting to `/login` if access is denied.

---

## Running the Frontend

From the `frontend` directory:

```bash
# Install dependencies
npm install

# Development (default: http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview the production build
npm run preview
```

Make sure the backend is running and CORS is configured to allow the frontend origin (see `backend/README.md`).

---

## How Authentication Works (Frontend)

- On login/registration success, the backend returns `{ user, accessToken, refreshToken }`.
- `authStore` persists `user` and tokens (using `zustand/middleware/persist`), and sets `isAuthenticated`.
- `apiClient` automatically adds the `Authorization` header and retries failed requests after token refresh.
- Google login is wired via `@react-oauth/google` and the `/api/auth/google-login` backend endpoint, which in turn returns the same `{ user, accessToken, refreshToken }` shape.

---

## UI & UX Notes

- Dashboard provides **stat cards**, **quick actions**, and **role‑specific banners** (Manager/Admin) with pleasant empty states and zero‑state messaging.
- `react-hot-toast` is configured globally in `App.tsx` for success/error/info notifications with a modern toast style.
- Admin and manager tools are clearly separated via RBAC so users only see options they have access to.

