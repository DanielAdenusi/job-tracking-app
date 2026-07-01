# Job Tracker

A full-stack, mobile-first job application tracking web app for saving roles, tracking progress, managing follow-ups, and viewing job search activity through a dashboard and Kanban-style pipeline.

## Overview

Job Tracker helps users manage their job search in one place. Users can sign in with Google, add applications, track statuses, set follow-up dates, update priorities, view live dashboard stats, and move roles through a Kanban board.

The project is built as a responsive web app with a PWA-friendly structure, making it usable across desktop and mobile devices.

## Features

- Google sign-in with Firebase Auth
- Protected frontend routes
- User-specific application data
- Add, edit, delete, and view job applications
- Application status pipeline
- Kanban board for tracking progress
- Dashboard with live PostgreSQL stats
- Search, filter, and sort applications
- URL-based application filters
- Follow-up tracking
- Priority tracking
- Contact and notes fields
- Responsive Tailwind CSS UI
- Express API with Firebase ID token verification
- PostgreSQL database with SQL migrations and constraints
- Optimistic UI updates for status changes and deletes

## Tech Stack

### Client

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Firebase Auth

### Server

- Node.js
- Express
- PostgreSQL
- Firebase Admin SDK

### Database

- PostgreSQL
- SQL migrations
- User-scoped application records
- Database constraints for statuses, priorities, work modes, employment types, URLs, and contact emails

## Project Structure

```text
job-tracker/
  client/
    src/
      auth/
      components/
      constants/
      layouts/
      lib/
      pages/
      services/
      types/
  server/
    scripts/
    src/
      constants/
      controllers/
      db/
        migrations/
        pool.js
      middleware/
      routes/
      services/
      utils/
  README.md
```

## Prerequisites

- Node.js
- npm
- PostgreSQL database
- Firebase project with Google Authentication enabled
- Firebase service account credentials for the server

## Environment Variables

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Create `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/job_tracker
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
```

For GitHub, include safe example files only:

```text
client/.env.example
server/.env.example
```

Do not commit real `.env` files.

## Install Dependencies

From the root folder:

```powershell
npm install
npm install --prefix client
npm install --prefix server
```

## Database Setup

Run the migrations against your PostgreSQL database:

```powershell
cd server
npm run migrate
```

The migrations create and manage:

- `users`, linked to Firebase users
- `applications`, linked to users and storing job details, statuses, notes, and dates
- `schema_migrations`, used to track which SQL migration files have already run

## Run Locally

### Option 1: Run client and server together

From the root folder:

```powershell
npm run dev
```

### Option 2: Run client and server separately

Start the API:

```powershell
cd server
npm run dev
```

Start the client in another terminal:

```powershell
cd client
npm run dev
```

By default:

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api`

## Available Scripts

### Root

```powershell
npm run dev
npm run client
npm run server
```

### Client

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

### Server

```powershell
npm run dev
npm start
npm run migrate
```

## Core Frontend Routes

```text
/login
/dashboard
/applications
/applications/new
/applications/:id
/applications/:id/edit
/kanban
/settings
```

## API Routes

### Public

```http
GET /api/health
```

### Dashboard

Requires a Firebase ID token.

```http
GET /api/dashboard/stats
```

### Applications

Application routes require a Firebase ID token in the `Authorization` header:

```http
Authorization: Bearer <firebase_id_token>
```

Routes:

```http
GET    /api/applications
GET    /api/applications/:id
POST   /api/applications
PATCH  /api/applications/:id
PATCH  /api/applications/:id/status
DELETE /api/applications/:id
```

## Allowed Application Statuses

```text
wishlist
saved
applied
assessment
interviewing
offer
rejected
withdrawn
```

## Allowed Priorities

```text
low
medium
high
```

## Allowed Employment Types

```text
full_time
part_time
internship
placement
contract
temporary
freelance
```

## Allowed Work Modes

```text
remote
hybrid
onsite
```

## Authentication Flow

1. The user signs in with Google through Firebase Auth.
2. React receives a Firebase ID token.
3. The frontend sends the token to the Express API.
4. Express verifies the token with Firebase Admin.
5. The backend creates or updates the matching PostgreSQL user.
6. Application data is scoped to that authenticated user.

## Key Implementation Details

- The server automatically creates or updates a local `users` row after validating a Firebase token.
- The client sends authenticated API requests through `client/src/lib/apiFetch.ts`.
- Application API calls are grouped in `client/src/services/applicationsApi.ts`.
- Dashboard API calls are grouped in `client/src/services/dashboardApi.ts`.
- PostgreSQL access goes through `server/src/db/pool.js`.
- Backend application logic is split into routes, controllers, services, validation utilities, and middleware.
- The dashboard reads live stats from PostgreSQL rather than calculating everything in the browser.
- Application search, filtering, and sorting are handled on the frontend for the MVP.
- Kanban status updates use optimistic UI updates and persist changes to PostgreSQL.

## Manual Test Flow

Use this checklist when testing the app locally:

1. Sign out.
2. Visit `/dashboard` and confirm it redirects to `/login`.
3. Sign in with Google.
4. Add a new application.
5. View the application details.
6. Edit the application.
7. Change the application status from the applications list.
8. Move the application from the Kanban board.
9. Check that dashboard stats update.
10. Search applications.
11. Filter applications by status and priority.
12. Sort applications.
13. Delete a test application.
14. Sign out.

## Screenshots

```md
![Dashboard](./screenshots/dashboard.png)
![Applications](./screenshots/applications.png)
![Kanban](./screenshots/kanban.png)
![Application Form](./screenshots/application-form.png)
```

## Future Improvements

- PWA install support
- Offline draft saving
- Email reminders for follow-ups
- Calendar integration
- CV version tracking per application
- Job description saving
- Analytics charts
- Drag-and-drop Kanban board
- Export applications to CSV
- Dark mode
- Deployment to a production frontend, API, and PostgreSQL database

## Project Status

MVP in progress.
